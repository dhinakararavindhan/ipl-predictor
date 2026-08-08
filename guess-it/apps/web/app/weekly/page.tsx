'use client';

/** Weekly Gauntlet (BRD §23): 7 shared games per ISO week, cumulative score. */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MECHANIC_META, utcWeekKey, weeklyGauntlet, WORLDS } from '@guess-it/content';
import { useProfile, useSession } from '@/lib/store';

export default function WeeklyPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const startWeekly = useSession((s) => s.startWeekly);
  const weeklyResults = useProfile((s) => s.weeklyResults);

  if (!mounted) return null;

  const weekKey = utcWeekKey();
  const { games } = weeklyGauntlet(weekKey);
  const scores = weeklyResults[weekKey]?.scores ?? Array<number | null>(7).fill(null);
  const played = scores.filter((s) => s !== null).length;
  const total = scores.reduce((sum: number, s) => sum + (s ?? 0), 0);
  const nextIndex = scores.findIndex((s) => s === null);

  return (
    <main className="flex flex-col gap-4 pt-8">
      <h1 className="text-2xl font-bold">🏁 Weekly Gauntlet</h1>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        Seven games, one week, one total. Everyone worldwide runs the same gauntlet — same
        puzzles, same order. Resets every Monday (UTC).
      </p>

      <div className="card flex items-center justify-between p-4" style={{ borderColor: 'var(--accent)' }}>
        <div>
          <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
            {weekKey} · {played}/7 PLAYED
          </p>
          <p className="digits text-3xl font-extrabold" style={{ color: 'var(--accent-2)' }}>
            {total.toLocaleString()} <span className="text-sm font-normal">pts</span>
          </p>
        </div>
        {nextIndex >= 0 ? (
          <button
            className="btn btn-primary px-6 py-3 text-sm font-bold"
            onClick={() => {
              if (startWeekly(nextIndex)) router.push('/game');
            }}
          >
            PLAY GAME {nextIndex + 1} →
          </button>
        ) : (
          <p className="text-2xl">🏆</p>
        )}
      </div>

      {played === 7 && (
        <p className="pop-in text-center text-sm font-bold" style={{ color: 'var(--warn)' }}>
          🏁 Gauntlet complete! Come back Monday for the next one.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {games.map((g, i) => {
          const world = WORLDS.find((w) => w.id === g.world);
          const score = scores[i];
          const isNext = i === nextIndex;
          return (
            <div
              key={i}
              className="card flex items-center gap-3 px-4 py-3"
              style={isNext ? { borderColor: 'var(--accent)' } : score !== null ? { opacity: 0.75 } : { opacity: 0.45 }}
            >
              <span className="digits w-6 text-center text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
                {i + 1}
              </span>
              <span className="text-xl">{world?.emoji ?? '🎲'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{MECHANIC_META[g.mechanic].name}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                  {world?.name ?? g.world} · {g.difficulty}
                </p>
              </div>
              {score !== null ? (
                <p className="digits text-sm font-bold" style={{ color: 'var(--accent-2)' }}>
                  {score} pts
                </p>
              ) : isNext ? (
                <button
                  className="btn btn-primary px-4 py-1.5 text-xs font-bold"
                  onClick={() => {
                    if (startWeekly(i)) router.push('/game');
                  }}
                >
                  PLAY
                </button>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  🔒
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px]" style={{ color: 'var(--text-dim)' }}>
        Games unlock in order. Each can be played once — make it count.
      </p>
    </main>
  );
}
