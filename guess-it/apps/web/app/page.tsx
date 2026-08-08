'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { WORLDS } from '@guess-it/content';
import { utcDateKey } from '@guess-it/content';
import { playerLevel, useProfile } from '@/lib/store';
import { InstallPrompt } from '@/components/InstallPrompt';

function salutation(): string {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

export default function Home() {
  // avoid hydration mismatch with persisted store
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const profile = useProfile();
  const dailyDone = mounted && !!profile.dailyResults[utcDateKey()];

  return (
    <main className="flex flex-col gap-4 pt-8">
      <header className="pop-in">
        <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
          {salutation()}, {mounted ? profile.username.toUpperCase() : 'PLAYER'} 👋
        </p>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight">
            GUESS <span className="brand-gradient">IT</span>
          </h1>
          {mounted && profile.streak.current > 0 && (
            <span className="flame-pulse text-sm font-bold" style={{ color: 'var(--warn)' }}>
              🔥 {profile.streak.current} day{profile.streak.current > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {mounted && (
          <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
            Level {playerLevel(profile.xp)} · {profile.xp.toLocaleString()} XP
          </p>
        )}
      </header>

      {mounted && <InstallPrompt />}

      {/* Daily Mystery */}
      <Link href="/daily" className="card pop-in block p-6 text-center" style={{ borderColor: 'var(--accent)' }}>
        <p className="text-4xl">🎯</p>
        <h2 className="mt-2 text-xl font-extrabold">DAILY MYSTERY</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          Everyone on Earth gets the same challenge
        </p>
        <span
          className="btn btn-primary mt-4 inline-block px-8 py-2.5 text-sm"
          style={dailyDone ? { background: 'var(--surface-2)', color: 'var(--text-dim)' } : undefined}
        >
          {dailyDone ? `Played ✓ — ${profile.dailyResults[utcDateKey()].score} pts` : 'PLAY'}
        </span>
      </Link>

      {/* Weekly Gauntlet */}
      <Link href="/weekly" className="card flex items-center gap-3 p-4">
        <span className="text-2xl">🏁</span>
        <span className="flex-1">
          <span className="block font-bold">Weekly Gauntlet</span>
          <span className="block text-xs" style={{ color: 'var(--text-dim)' }}>
            7 games · one total · resets Monday
          </span>
        </span>
        <span className="text-xs" style={{ color: 'var(--accent)' }}>
          →
        </span>
      </Link>

      {/* Modes */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/play?mode=vs_ai" className="card p-4">
          <p className="text-2xl">🤖</p>
          <p className="mt-1 font-bold">AI Battle</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Race an AI mind
          </p>
        </Link>
        <Link href="/play" className="card p-4">
          <p className="text-2xl">🧩</p>
          <p className="mt-1 font-bold">Play Solo</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            You vs the puzzle
          </p>
        </Link>
      </div>

      {/* Multiplayer */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/play?mode=duel" className="card p-4">
          <p className="text-2xl">👥</p>
          <p className="mt-1 font-bold">Pass &amp; Play</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Duel friends on one phone
          </p>
        </Link>
        <Link href="/online" className="card p-4">
          <p className="text-2xl">🌎</p>
          <p className="mt-1 font-bold">Live Race</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Two phones, real time
          </p>
        </Link>
      </div>
      <p className="-mt-1 text-center text-[11px]" style={{ color: 'var(--text-dim)' }}>
        ⚔️ Tip: finish any game and tap “Challenge a friend” to send them the same puzzle.
      </p>

      {/* Explore */}
      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
          EXPLORE
        </h3>
        <div className="flex flex-wrap gap-2">
          {WORLDS.map((w) => (
            <Link key={w.id} href={`/play?world=${w.id}`} className="chip px-4 py-2 text-sm font-medium">
              {w.emoji} {w.name}
            </Link>
          ))}
        </div>
      </section>

      <Link href="/how-to-play" className="text-center text-xs underline" style={{ color: 'var(--text-dim)' }}>
        How to play
      </Link>
    </main>
  );
}
