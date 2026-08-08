'use client';

/**
 * Daily Mystery. Two modes:
 *  - Backend configured → server-authoritative play + GLOBAL leaderboard
 *    (the only way onto the board is playing through the server's engine).
 *  - No backend → local play, personal history list (as before).
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HINT_COSTS, type HintType, type PlayerView } from '@guess-it/engine';
import { dailyChallenge, MECHANIC_META, utcDateKey, WORLDS } from '@guess-it/content';
import {
  API_BASE,
  dailyAction,
  dailyLeaderboard,
  dailyStart,
  ensurePlayer,
  type DailyLeaderboard,
} from '@/lib/api';
import { sfx } from '@/lib/sound';
import { useProfile, useSession } from '@/lib/store';
import { RaceClue, RaceExact, RaceHigherLower, RaceQuickPick } from '@/components/RaceGame';

function msToNextUtcMidnight(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}

function hintFor(mechanic: string): { type: HintType; label: string; cost: number } | null {
  switch (mechanic) {
    case 'EXACT_NUMBER':
      return { type: 'REVEAL_DIGIT', label: 'Reveal a digit', cost: HINT_COSTS.REVEAL_DIGIT };
    case 'CLUE_GUESS':
      return { type: 'FIRST_LETTER', label: 'First letter', cost: HINT_COSTS.FIRST_LETTER };
    case 'HIGHER_LOWER':
      return { type: 'SHRINK_RANGE', label: 'Shrink range', cost: HINT_COSTS.SHRINK_RANGE };
    case 'MULTIPLE_CHOICE':
      return { type: 'FIFTY_FIFTY', label: '50 / 50', cost: HINT_COSTS.FIFTY_FIFTY };
    default:
      return null;
  }
}

export default function DailyPage() {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => {
      const ms = msToNextUtcMidnight();
      setCountdown(`${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;

  return (
    <main className="flex flex-col gap-4 pt-8">
      <h1 className="text-2xl font-bold">🎯 Daily Mystery</h1>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        One puzzle. The whole world. Same answer. Rolls over at 00:00 UTC — next in {countdown || '…'}.
      </p>
      {API_BASE ? <ServerDaily /> : <LocalDaily />}
    </main>
  );
}

// ---------------- server-authoritative mode ----------------

function ServerDaily() {
  const username = useProfile((s) => s.username);
  const recordResult = useProfile((s) => s.recordResult);
  const dailyResults = useProfile((s) => s.dailyResults);
  const [phase, setPhase] = useState<'idle' | 'starting' | 'playing' | 'done'>('idle');
  const [gameId, setGameId] = useState<string | null>(null);
  const [view, setView] = useState<PlayerView | null>(null);
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(null);
  const [board, setBoard] = useState<DailyLeaderboard | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dateKey = utcDateKey();
  const { definition } = dailyChallenge(dateKey);
  const world = WORLDS.find((w) => w.id === definition.world);
  const playedLocally = dailyResults[dateKey];

  const refreshBoard = useCallback(async () => {
    try {
      const id = JSON.parse(localStorage.getItem('guessit-player') ?? 'null');
      setBoard(await dailyLeaderboard(id));
    } catch {
      /* board is progressive enhancement */
    }
  }, []);

  useEffect(() => {
    void refreshBoard();
  }, [refreshBoard]);

  const begin = async () => {
    setPhase('starting');
    try {
      const identity = await ensurePlayer(username);
      const res = await dailyStart(identity, username);
      if (res.alreadyPlayed) {
        setPhase('done');
        void refreshBoard();
        return;
      }
      setGameId(res.gameId!);
      setView(res.view!);
      setPhase('playing');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Could not reach the server.');
      setPhase('idle');
    }
  };

  const act = async (action: 'guess' | 'advance' | 'hint', payload?: string) => {
    if (!gameId) return;
    try {
      const identity = await ensurePlayer(username);
      const res = await dailyAction(identity, gameId, action, payload);
      if (res.error) {
        setToast(res.error);
        setTimeout(() => setToast(null), 2200);
        if (action === 'guess') sfx.bad();
        return;
      }
      if (res.result) {
        const v = res.result.view;
        setView(v);
        setRank(res.result.rank);
        setPhase('done');
        const won = v.result?.outcome === 'WON';
        if (won) sfx.win();
        else sfx.lose();
        // mirror into the local profile: streak, XP, history, achievements
        recordResult(
          {
            id: `daily-${dateKey}`,
            defId: v.defId,
            world: v.world,
            mechanic: v.mechanic,
            difficulty: v.difficulty,
            mode: 'solo',
            outcome: v.result!.outcome,
            answerName: v.result!.answerName,
            score: v.result!.score,
            xp: res.result.xp.total,
            attemptsUsed: v.attemptsUsed,
            durationMs: v.result!.durationMs,
            endedAt: Date.now(),
            daily: dateKey,
          },
          { clueWin: won && v.mechanic === 'CLUE_GUESS', numberWin: won && (v.mechanic === 'EXACT_NUMBER' || v.mechanic === 'HIGHER_LOWER'), perfect: !!v.result?.perfect },
        );
        void refreshBoard();
      } else if (res.view) {
        if (action === 'guess' && res.view.attemptsUsed > (view?.attemptsUsed ?? 0)) sfx.bad();
        setView(res.view);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Connection hiccup — try again.');
      setTimeout(() => setToast(null), 2500);
    }
  };

  const hint = view ? hintFor(view.mechanic) : null;

  return (
    <>
      {phase !== 'playing' && (
        <div className="card p-6 text-center" style={{ borderColor: 'var(--accent)' }}>
          <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
            {dateKey} · TODAY&apos;S MYSTERY · 🌍 GLOBAL
          </p>
          <p className="mt-3 text-4xl">{world?.emoji}</p>
          <p className="mt-2 font-bold">
            {world?.name} · {MECHANIC_META[definition.mechanic].name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Difficulty: {definition.difficulty} · +200 XP · ranked worldwide
          </p>

          {phase === 'done' || playedLocally ? (
            <div className="mt-5">
              {view?.result ? (
                <>
                  <p className="digits text-3xl font-extrabold" style={{ color: 'var(--accent-2)' }}>
                    {view.result.score} pts
                  </p>
                  <p className="mt-1 text-sm">
                    Answer: <b>{view.result.answerName}</b>
                  </p>
                </>
              ) : (
                playedLocally && (
                  <p className="digits text-3xl font-extrabold" style={{ color: 'var(--accent-2)' }}>
                    {playedLocally.score} pts
                  </p>
                )
              )}
              {rank && (
                <p className="mt-1 text-sm font-bold" style={{ color: 'var(--warn)' }}>
                  🌍 Ranked #{rank.rank} of {rank.total} worldwide
                </p>
              )}
              <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                Come back tomorrow for the next mystery.
              </p>
            </div>
          ) : (
            <button
              className="btn btn-primary mt-5 w-full py-3.5 text-base font-bold disabled:opacity-50"
              disabled={phase === 'starting'}
              onClick={begin}
            >
              {phase === 'starting' ? 'Starting…' : "PLAY TODAY'S MYSTERY"}
            </button>
          )}
        </div>
      )}

      {phase === 'playing' && view && (
        <div className="card flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">
              {MECHANIC_META[view.mechanic].emoji} {MECHANIC_META[view.mechanic].name}
            </p>
            <p className="digits text-sm font-bold" style={{ color: 'var(--accent-2)' }}>
              {view.potentialScore} PTS
            </p>
          </div>
          {view.attemptsMax > 1 && (
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: view.attemptsMax }).map((_, i) => (
                <span key={i} className="h-1.5 w-4 rounded-full" style={{ background: i < view.attemptsUsed ? 'var(--danger)' : 'var(--surface-2)' }} />
              ))}
            </div>
          )}
          {view.mechanic === 'EXACT_NUMBER' && <RaceExact view={view} onGuess={(g) => act('guess', g)} />}
          {view.mechanic === 'CLUE_GUESS' && (
            <RaceClue view={view} onGuess={(g) => act('guess', g)} onAdvance={() => act('advance')} />
          )}
          {view.mechanic === 'HIGHER_LOWER' && <RaceHigherLower view={view} onGuess={(g) => act('guess', g)} />}
          {view.mechanic === 'MULTIPLE_CHOICE' && <RaceQuickPick view={view} onGuess={(g) => act('guess', g)} />}
          {hint && view.hintsRemaining > 0 && (
            <button className="btn btn-ghost mx-auto px-5 py-2 text-xs" onClick={() => act('hint', hint.type)}>
              💡 {hint.label} <span style={{ color: 'var(--danger)' }}>(−{hint.cost} pts)</span> · {view.hintsRemaining} left
            </button>
          )}
        </div>
      )}

      {toast && (
        <p className="text-center text-sm" style={{ color: 'var(--warn)' }}>
          {toast}
        </p>
      )}

      {/* 🌍 global leaderboard */}
      <div className="card p-4">
        <h2 className="text-sm font-bold">🌍 Global leaderboard · {board?.dateKey ?? dateKey}</h2>
        {!board || board.top.length === 0 ? (
          <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
            No scores yet today — be the first in the world.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-1">
            {board.top.slice(0, 10).map((r) => (
              <div
                key={r.rank}
                className="flex justify-between rounded-lg px-2 py-1 text-sm"
                style={r.isYou ? { background: 'var(--surface-2)', fontWeight: 700 } : undefined}
              >
                <span>
                  <span className="digits mr-2" style={{ color: r.rank <= 3 ? 'var(--warn)' : 'var(--text-dim)' }}>
                    {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                  </span>
                  {r.name}
                  {r.isYou ? ' (you)' : ''}
                </span>
                <span className="digits" style={{ color: 'var(--accent-2)' }}>
                  {r.score}
                </span>
              </div>
            ))}
            {board.me && board.me.rank > 10 && (
              <div className="flex justify-between rounded-lg px-2 py-1 text-sm" style={{ background: 'var(--surface-2)', fontWeight: 700 }}>
                <span>
                  <span className="digits mr-2" style={{ color: 'var(--text-dim)' }}>
                    #{board.me.rank}
                  </span>
                  You
                </span>
                <span className="digits" style={{ color: 'var(--accent-2)' }}>
                  {board.me.score}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- local fallback (no backend configured) ----------------

function LocalDaily() {
  const router = useRouter();
  const startDaily = useSession((s) => s.startDaily);
  const dailyResults = useProfile((s) => s.dailyResults);
  const dateKey = utcDateKey();
  const { definition } = dailyChallenge(dateKey);
  const world = WORLDS.find((w) => w.id === definition.world);
  const played = dailyResults[dateKey];

  return (
    <>
      <div className="card p-6 text-center" style={{ borderColor: 'var(--accent)' }}>
        <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
          {dateKey} · TODAY&apos;S MYSTERY
        </p>
        <p className="mt-3 text-4xl">{world?.emoji}</p>
        <p className="mt-2 font-bold">
          {world?.name} · {MECHANIC_META[definition.mechanic].name}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Difficulty: {definition.difficulty} · +200 XP for completing
        </p>
        {played ? (
          <div className="mt-5">
            <p className="digits text-3xl font-extrabold" style={{ color: 'var(--accent-2)' }}>
              {played.score} pts
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
              {played.outcome === 'WON' ? 'You cracked it! Come back tomorrow.' : 'The mystery won today. Tomorrow is yours.'}
            </p>
          </div>
        ) : (
          <button
            className="btn btn-primary mt-5 w-full py-3.5 text-base font-bold"
            onClick={() => {
              if (startDaily()) router.push('/game');
            }}
          >
            PLAY TODAY&apos;S MYSTERY
          </button>
        )}
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-bold">🏆 Your daily record</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
          The global leaderboard lights up once the game server is connected (see
          guess-it/DISTRIBUTION.md).
        </p>
        <div className="mt-3 flex flex-col gap-1">
          {Object.entries(dailyResults)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7)
            .map(([date, r]) => (
              <div key={date} className="flex justify-between text-xs" style={{ color: 'var(--text-dim)' }}>
                <span>{date}</span>
                <span className="digits" style={{ color: r.outcome === 'WON' ? 'var(--accent-2)' : 'var(--text-dim)' }}>
                  {r.score} pts
                </span>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
