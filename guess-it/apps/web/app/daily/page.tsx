'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dailyChallenge, MECHANIC_META, utcDateKey, WORLDS } from '@guess-it/content';
import { useProfile, useSession } from '@/lib/store';

function msToNextUtcMidnight(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}

export default function DailyPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState('');
  const startDaily = useSession((s) => s.startDaily);
  const dailyResults = useProfile((s) => s.dailyResults);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => {
      const ms = msToNextUtcMidnight();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setCountdown(`${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;

  const dateKey = utcDateKey();
  const { definition } = dailyChallenge(dateKey);
  const world = WORLDS.find((w) => w.id === definition.world);
  const played = dailyResults[dateKey];

  return (
    <main className="flex flex-col gap-4 pt-8">
      <h1 className="text-2xl font-extrabold">🎯 Daily Mystery</h1>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        One puzzle. The whole world. Same answer. Rolls over at 00:00 UTC — next in {countdown || '…'}.
      </p>

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
        <h2 className="text-sm font-bold">🏆 Global leaderboard</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
          Shared leaderboards go live with online play in Phase 2 — your daily scores are already
          counting on this device.
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
    </main>
  );
}
