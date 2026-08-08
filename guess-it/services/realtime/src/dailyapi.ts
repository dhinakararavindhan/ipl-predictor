/**
 * Server-authoritative Daily Mystery + global leaderboard (API Spec §5,
 * Engine R-1.3 for real): the ONLY way onto the board is playing the game
 * through this server's engine — there is no score-submission endpoint.
 *
 * Sessions are in-memory (a daily game lasts minutes); results persist via
 * Storage. Clients receive PlayerView only.
 */
import { randomUUID } from 'node:crypto';
import {
  advance,
  createGame,
  EngineError,
  forfeit,
  playerView,
  submitGuess,
  tick,
  useHint,
  xpForResult,
  type GameDefinition,
  type GameState,
  type HintType,
  type PlayerView,
} from '@guess-it/engine';
import { dailyChallenge, dailySeed, utcDateKey } from '@guess-it/content';
import type { Storage } from './storage.js';

interface DailySession {
  gameId: string;
  playerId: string;
  dateKey: string;
  def: GameDefinition;
  state: GameState;
  startedAt: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000;

export interface DailyResultPayload {
  view: PlayerView;
  xp: { total: number; parts: { label: string; amount: number }[] };
  rank: { rank: number; total: number } | null;
}

export class DailyApi {
  private sessions = new Map<string, DailySession>();

  constructor(private storage: Storage) {
    setInterval(() => this.sweep(), 5 * 60 * 1000).unref?.();
  }

  private sweep(now = Date.now()): void {
    for (const [id, s] of this.sessions) {
      if (now - s.startedAt > SESSION_TTL_MS) this.sessions.delete(id);
    }
  }

  /** One server-run daily game per player per UTC date. */
  async start(
    playerId: string,
    name: string,
  ): Promise<{ gameId: string; view: PlayerView; dateKey: string } | { alreadyPlayed: DailyScoreLike }> {
    const dateKey = utcDateKey();
    await this.storage.renamePlayer(playerId, name);
    const existing = await this.storage.hasDailyScore(dateKey, playerId);
    if (existing) return { alreadyPlayed: existing };

    // one active session per player — restarting resumes, not re-rolls
    for (const s of this.sessions.values()) {
      if (s.playerId === playerId && s.dateKey === dateKey) {
        return { gameId: s.gameId, view: playerView(s.state, s.def), dateKey };
      }
    }

    const { definition } = dailyChallenge(dateKey);
    const state = createGame(definition, dailySeed(dateKey), Date.now());
    const session: DailySession = {
      gameId: randomUUID(),
      playerId,
      dateKey,
      def: definition,
      state,
      startedAt: Date.now(),
    };
    this.sessions.set(session.gameId, session);
    return { gameId: session.gameId, view: playerView(state, definition), dateKey };
  }

  /** Apply a player action; on terminal state, persist the score. */
  async action(
    playerId: string,
    gameId: string,
    action: 'guess' | 'advance' | 'hint' | 'forfeit' | 'tick',
    payload?: string,
  ): Promise<{ view: PlayerView; result?: DailyResultPayload } | { error: string; code: string }> {
    const s = this.sessions.get(gameId);
    if (!s || s.playerId !== playerId) return { error: 'Game not found.', code: 'NOT_FOUND' };

    const now = Date.now();
    try {
      switch (action) {
        case 'guess':
          s.state = submitGuess(s.state, s.def, payload ?? '', now);
          break;
        case 'advance':
          s.state = advance(s.state, s.def, now);
          break;
        case 'hint':
          s.state = useHint(s.state, s.def, (payload ?? '') as HintType);
          break;
        case 'forfeit':
          s.state = forfeit(s.state, s.def, now);
          break;
        case 'tick':
          s.state = tick(s.state, s.def, now);
          break;
      }
    } catch (e) {
      if (e instanceof EngineError) return { error: e.message, code: e.code };
      throw e;
    }

    const view = playerView(s.state, s.def);
    if (s.state.status === 'ACTIVE' || !s.state.result) return { view };

    // terminal: persist (idempotent per player+date) and rank
    const player = await this.storage.getPlayer(playerId);
    await this.storage.submitDailyScore(s.dateKey, {
      playerId,
      name: player?.name ?? 'Player',
      score: s.state.result.score,
      outcome: s.state.result.outcome,
      attemptsUsed: s.state.attemptsUsed,
      durationMs: s.state.result.durationMs,
      submittedAt: now,
    });
    this.sessions.delete(gameId);
    const xp = xpForResult(s.state.result, { versus: false, difficulty: s.state.difficulty, daily: true });
    const rank = await this.storage.rankFor(s.dateKey, playerId);
    return { view, result: { view, xp, rank } };
  }

  async leaderboard(
    playerId: string | null,
    dateKey: string = utcDateKey(),
  ): Promise<{
    dateKey: string;
    top: { rank: number; name: string; score: number; isYou: boolean }[];
    me: { rank: number; total: number; score: number } | null;
  }> {
    const rows = await this.storage.topDaily(dateKey, 50);
    const top = rows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      score: r.score,
      isYou: r.playerId === playerId,
    }));
    let me: { rank: number; total: number; score: number } | null = null;
    if (playerId) {
      const mine = await this.storage.hasDailyScore(dateKey, playerId);
      const rank = await this.storage.rankFor(dateKey, playerId);
      if (mine && rank) me = { ...rank, score: mine.score };
    }
    return { dateKey, top, me };
  }
}

interface DailyScoreLike {
  score: number;
  outcome: string;
}
