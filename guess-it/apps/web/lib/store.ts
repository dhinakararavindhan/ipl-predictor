'use client';

/**
 * Client state: profile (persisted) + active game session (persisted for
 * mid-game refresh recovery, PRD GI-3.1).
 *
 * NOTE (documented deviation from Engine R-1.3): this MVP build runs the
 * reference engine client-side for solo-vs-AI play — there is no backend yet.
 * Server authority activates when services/api lands (Development Plan
 * Sprint 4+); nothing here writes to shared leaderboards.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  advance as engineAdvance,
  createAiRuntime,
  createGame,
  EngineError,
  forfeit as engineForfeit,
  levelForXp,
  loseToAi,
  runAi,
  submitGuess,
  supportsVersus,
  tick as engineTick,
  useHint as engineUseHint,
  xpForResult,
  type AiCharacterId,
  type AiLevel,
  type AiRuntime,
  type Difficulty,
  type GameDefinition,
  type GameState,
  type HintType,
  type Mechanic,
} from '@guess-it/engine';
import { dailyChallenge, dailySeed, getDefinition, pickDefinition, utcDateKey } from '@guess-it/content';
import type { ChallengePayload } from './challenge';

// ---------------- profile ----------------

export interface HistoryEntry {
  id: string;
  defId: string;
  world: string;
  mechanic: Mechanic;
  difficulty: Difficulty;
  mode: 'solo' | 'vs_ai';
  aiCharacter?: AiCharacterId;
  aiLevel?: AiLevel;
  outcome: 'WON' | 'LOST' | 'FORFEITED';
  answerName: string;
  score: number;
  xp: number;
  attemptsUsed: number;
  durationMs: number;
  endedAt: number;
  daily?: string; // dateKey when this was a daily challenge
}

export interface AchievementDef {
  key: string;
  name: string;
  emoji: string;
  blurb: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_guess', name: 'First Guess', emoji: '🐣', blurb: 'Play your first game' },
  { key: 'code_breaker', name: 'Code Breaker', emoji: '🔓', blurb: 'Win 10 games' },
  { key: 'detective', name: 'Detective', emoji: '🕵️', blurb: 'Solve 10 clue games' },
  { key: 'number_wizard', name: 'Number Wizard', emoji: '🧙', blurb: 'Win 10 number games' },
  { key: 'perfect', name: 'Perfect', emoji: '💎', blurb: 'Win without hints or wrong guesses' },
  { key: 'lightning', name: 'Lightning', emoji: '⚡', blurb: 'Win in under 30 seconds' },
  { key: 'streak_master', name: 'Streak Master', emoji: '🔥', blurb: 'Reach a 7-day streak' },
  { key: 'legend', name: 'Legend', emoji: '👑', blurb: 'Win 100 games' },
];

interface ProfileState {
  username: string;
  avatar: string;
  xp: number;
  games: number;
  wins: number;
  losses: number;
  bestScore: number;
  streak: { current: number; best: number; lastDate: string | null };
  achievements: string[];
  history: HistoryEntry[];
  dailyResults: Record<string, { score: number; outcome: string }>;
  playedDefIds: string[];
  newlyUnlocked: string[]; // shown on next result screen, then cleared

  setUsername: (name: string) => void;
  setAvatar: (a: string) => void;
  recordResult: (entry: HistoryEntry, opts: { clueWin: boolean; numberWin: boolean; perfect: boolean }) => void;
  clearNewlyUnlocked: () => void;
  resetAll: () => void;
}

function localDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayKey(ts: number): string {
  return localDateKey(ts - 86_400_000);
}

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      username: 'Player',
      avatar: '🧠',
      xp: 0,
      games: 0,
      wins: 0,
      losses: 0,
      bestScore: 0,
      streak: { current: 0, best: 0, lastDate: null },
      achievements: [],
      history: [],
      dailyResults: {},
      playedDefIds: [],
      newlyUnlocked: [],

      setUsername: (username) => set({ username: username.trim().slice(0, 20) || 'Player' }),
      setAvatar: (avatar) => set({ avatar }),

      recordResult: (entry, opts) => {
        const p = get();
        const won = entry.outcome === 'WON';

        // streak: any completed (non-forfeit) game preserves the local day (PRD GI-5.2)
        let streak = { ...p.streak };
        if (entry.outcome !== 'FORFEITED') {
          const today = localDateKey(entry.endedAt);
          if (streak.lastDate !== today) {
            streak.current = streak.lastDate === yesterdayKey(entry.endedAt) ? streak.current + 1 : 1;
            streak.lastDate = today;
            streak.best = Math.max(streak.best, streak.current);
          }
        }

        const wins = p.wins + (won ? 1 : 0);
        const clueWins = p.history.filter((h) => h.outcome === 'WON' && h.mechanic === 'CLUE_GUESS').length + (opts.clueWin ? 1 : 0);
        const numberWins =
          p.history.filter((h) => h.outcome === 'WON' && (h.mechanic === 'EXACT_NUMBER' || h.mechanic === 'HIGHER_LOWER')).length +
          (opts.numberWin ? 1 : 0);

        const unlocked = new Set(p.achievements);
        const fresh: string[] = [];
        const grant = (key: string, cond: boolean) => {
          if (cond && !unlocked.has(key)) {
            unlocked.add(key);
            fresh.push(key);
          }
        };
        grant('first_guess', true);
        grant('code_breaker', wins >= 10);
        grant('detective', clueWins >= 10);
        grant('number_wizard', numberWins >= 10);
        grant('perfect', won && opts.perfect);
        grant('lightning', won && entry.durationMs <= 30000);
        grant('streak_master', streak.current >= 7);
        grant('legend', wins >= 100);

        set({
          xp: p.xp + entry.xp,
          games: p.games + 1,
          wins,
          losses: p.losses + (entry.outcome === 'LOST' ? 1 : 0),
          bestScore: Math.max(p.bestScore, entry.score),
          streak,
          achievements: [...unlocked],
          newlyUnlocked: fresh,
          history: [entry, ...p.history].slice(0, 200),
          playedDefIds: [entry.defId, ...p.playedDefIds.filter((d) => d !== entry.defId)].slice(0, 60),
          dailyResults: entry.daily
            ? { ...p.dailyResults, [entry.daily]: { score: entry.score, outcome: entry.outcome } }
            : p.dailyResults,
        });
      },

      clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),

      resetAll: () =>
        set({
          username: 'Player',
          avatar: '🧠',
          xp: 0,
          games: 0,
          wins: 0,
          losses: 0,
          bestScore: 0,
          streak: { current: 0, best: 0, lastDate: null },
          achievements: [],
          history: [],
          dailyResults: {},
          playedDefIds: [],
          newlyUnlocked: [],
        }),
    }),
    { name: 'guessit-profile' },
  ),
);

export function playerLevel(xp: number): number {
  return levelForXp(xp);
}

// ---------------- game session ----------------

export interface StartConfig {
  world: string;
  mechanic: Mechanic;
  difficulty: Difficulty;
  mode: 'solo' | 'vs_ai';
  aiCharacter?: AiCharacterId;
  aiLevel?: AiLevel;
  daily?: boolean;
}

export interface ChallengeContext {
  name: string;
  score: number;
  attempts: number;
  outcome: 'WON' | 'LOST' | 'FORFEITED';
}

interface SessionState {
  def: GameDefinition | null;
  game: GameState | null;
  ai: AiRuntime | null;
  mode: 'solo' | 'vs_ai';
  daily: string | null;
  challenge: ChallengeContext | null;
  error: string | null;
  errorNonce: number;
  recorded: boolean;
  lastXp: { total: number; parts: { label: string; amount: number }[] } | null;

  start: (config: StartConfig) => boolean;
  startDaily: () => boolean;
  startChallenge: (p: ChallengePayload) => 'ok' | 'played' | 'invalid';
  guess: (text: string) => void;
  hint: (type: HintType) => void;
  advance: () => void;
  forfeit: () => void;
  heartbeat: () => void; // MC timeout sweep + AI runner; call on an interval
  clear: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => {
      /** After any state change, finish bookkeeping exactly once. */
      const settle = (game: GameState, ai: AiRuntime | null) => {
        const s = get();
        if (game.status === 'ACTIVE' || s.recorded || !s.def || !game.result) {
          set({ game, ai });
          return;
        }
        const versus = s.mode === 'vs_ai';
        const award = xpForResult(game.result, {
          versus,
          difficulty: game.difficulty,
          daily: !!s.daily,
        });
        useProfile.getState().recordResult(
          {
            id: `${game.seed}`,
            defId: s.def.id,
            world: game.world,
            mechanic: game.mechanic,
            difficulty: game.difficulty,
            mode: s.mode,
            aiCharacter: ai?.character,
            aiLevel: ai?.level,
            outcome: game.result.outcome,
            answerName: game.result.answerName,
            score: game.result.score,
            xp: award.total,
            attemptsUsed: game.attemptsUsed,
            durationMs: game.result.durationMs,
            endedAt: Date.now(),
            daily: s.daily ?? undefined,
          },
          {
            clueWin: game.result.outcome === 'WON' && game.mechanic === 'CLUE_GUESS',
            numberWin:
              game.result.outcome === 'WON' &&
              (game.mechanic === 'EXACT_NUMBER' || game.mechanic === 'HIGHER_LOWER'),
            perfect: game.result.perfect,
          },
        );
        set({ game, ai, recorded: true, lastXp: award });
      };

      const act = (fn: (game: GameState, def: GameDefinition) => GameState) => {
        const { game, def, ai } = get();
        if (!game || !def) return;
        try {
          const next = fn(game, def);
          settle(next, ai);
        } catch (e) {
          if (e instanceof EngineError) {
            set({ error: e.message, errorNonce: get().errorNonce + 1 });
          } else {
            throw e;
          }
        }
      };

      return {
        def: null,
        game: null,
        ai: null,
        mode: 'solo',
        daily: null,
        challenge: null,
        error: null,
        errorNonce: 0,
        recorded: false,
        lastXp: null,

        start: (config) => {
          const seed = `g-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
          const def = pickDefinition(
            config.world,
            config.mechanic,
            config.difficulty,
            seed,
            useProfile.getState().playedDefIds,
          );
          if (!def) return false;
          const now = Date.now();
          const game = createGame(def, seed, now);
          const versus = config.mode === 'vs_ai' && supportsVersus(config.mechanic);
          const ai =
            versus && config.aiCharacter && config.aiLevel
              ? createAiRuntime(config.aiCharacter, config.aiLevel, game, now)
              : null;
          set({
            def,
            game,
            ai,
            mode: versus ? 'vs_ai' : 'solo',
            daily: null,
            challenge: null,
            error: null,
            recorded: false,
            lastXp: null,
          });
          return true;
        },

        startChallenge: (p) => {
          const def = getDefinition(p.d, p.w, p.df);
          if (!def) return 'invalid';
          // one play per challenge seed (PRD GI-7.1)
          if (useProfile.getState().history.some((h) => h.id === p.s)) return 'played';
          const now = Date.now();
          const game = createGame(def, p.s, now);
          set({
            def,
            game,
            ai: null,
            mode: 'solo',
            daily: null,
            challenge: { name: p.n, score: p.sc, attempts: p.at, outcome: p.o },
            error: null,
            recorded: false,
            lastXp: null,
          });
          return 'ok';
        },

        startDaily: () => {
          const dateKey = utcDateKey();
          if (useProfile.getState().dailyResults[dateKey]) return false; // once per day (GI-6.1)
          const { definition } = dailyChallenge(dateKey);
          const now = Date.now();
          const game = createGame(definition, dailySeed(dateKey), now);
          set({
            def: definition,
            game,
            ai: null,
            mode: 'solo',
            daily: dateKey,
            challenge: null,
            error: null,
            recorded: false,
            lastXp: null,
          });
          return true;
        },

        guess: (text) => act((g, d) => submitGuess(g, d, text, Date.now())),
        hint: (type) => act((g, d) => engineUseHint(g, d, type)),
        advance: () => act((g, d) => engineAdvance(g, d, Date.now())),
        forfeit: () => act((g, d) => engineForfeit(g, d, Date.now())),

        heartbeat: () => {
          const { game, def, ai } = get();
          if (!game || !def || game.status !== 'ACTIVE') return;
          const now = Date.now();
          // 1) timed mechanics sweep
          const swept = engineTick(game, def, now);
          if (swept.status !== 'ACTIVE') {
            settle(swept, ai);
            return;
          }
          // 2) AI runner
          if (ai && !ai.solved) {
            const r = runAi(ai, swept, def, now);
            if (r.aiSolved) {
              settle(loseToAi(swept, def, now), r.ai);
            } else if (r.ai !== ai) {
              set({ ai: r.ai });
            }
          }
        },

        clear: () =>
          set({ def: null, game: null, ai: null, mode: 'solo', daily: null, challenge: null, error: null, recorded: false, lastXp: null }),
      };
    },
    { name: 'guessit-session' },
  ),
);
