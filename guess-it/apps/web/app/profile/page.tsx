'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { titleForLevel, xpForLevel, type Mechanic } from '@guess-it/engine';
import { MECHANIC_META, WORLDS } from '@guess-it/content';
import { ACHIEVEMENTS, playerLevel, useProfile } from '@/lib/store';

const AVATARS = ['🧠', '🕵️', '🦊', '🐯', '🚀', '🎯', '👾', '🐙', '🌟', '🔥'];

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  useEffect(() => setMounted(true), []);
  const p = useProfile();

  if (!mounted) return null;

  const level = playerLevel(p.xp);
  const curFloor = xpForLevel(level);
  const nextNeed = xpForLevel(level + 1);
  const pct = nextNeed > curFloor ? Math.min(100, ((p.xp - curFloor) / (nextNeed - curFloor)) * 100) : 100;
  const winRate = p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0;

  return (
    <main className="flex flex-col gap-4 pt-8">
      {/* header */}
      <div className="card flex items-center gap-4 p-5">
        <button
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ background: 'var(--surface-2)', border: '2px solid var(--accent)' }}
          onClick={() => {
            const i = AVATARS.indexOf(p.avatar);
            p.setAvatar(AVATARS[(i + 1) % AVATARS.length]);
          }}
          title="Tap to change avatar"
        >
          {p.avatar}
        </button>
        <div className="flex-1">
          {editing ? (
            <input
              autoFocus
              defaultValue={p.username}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim()) p.setUsername(name);
                setEditing(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="card-2 w-full px-3 py-1.5 text-lg font-bold outline-none"
            />
          ) : (
            <button className="text-left text-xl font-extrabold" onClick={() => setEditing(true)}>
              {p.username} <span className="text-xs font-normal" style={{ color: 'var(--text-dim)' }}>✏️</span>
            </button>
          )}
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Level {level} · {titleForLevel(level)}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
          </div>
          <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {p.xp.toLocaleString()} / {nextNeed.toLocaleString()} XP
          </p>
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Games', p.games],
          ['Wins', p.wins],
          ['Win rate', `${winRate}%`],
          ['Best score', p.bestScore],
          ['Streak', `🔥 ${p.streak.current}`],
          ['Best streak', `🔥 ${p.streak.best}`],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-3 text-center">
            <p className="digits text-lg font-extrabold">{value}</p>
            <p className="text-[10px] tracking-wide" style={{ color: 'var(--text-dim)' }}>
              {(label as string).toUpperCase()}
            </p>
          </div>
        ))}
      </div>

      {/* deep stats */}
      {p.history.length > 0 && <StatsSection />}

      {/* achievements */}
      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
          ACHIEVEMENTS
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = p.achievements.includes(a.key);
            return (
              <div key={a.key} className="card flex items-center gap-3 p-3" style={{ opacity: unlocked ? 1 : 0.4 }}>
                <span className="text-2xl">{unlocked ? a.emoji : '🔒'}</span>
                <div>
                  <p className="text-sm font-bold">{a.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                    {a.blurb}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Link href="/settings" className="btn btn-ghost py-3 text-center text-sm">
        ⚙️ Settings & privacy
      </Link>
    </main>
  );
}

function StatsSection() {
  const history = useProfile((s) => s.history);
  const races = useProfile((s) => s.races);

  const stats = useMemo(() => {
    const byMechanic = new Map<Mechanic, { games: number; wins: number }>();
    const byWorld = new Map<string, { games: number; wins: number }>();
    let winTime = 0;
    let winCount = 0;
    for (const h of history) {
      const m = byMechanic.get(h.mechanic) ?? { games: 0, wins: 0 };
      m.games++;
      if (h.outcome === 'WON') m.wins++;
      byMechanic.set(h.mechanic, m);
      const w = byWorld.get(h.world) ?? { games: 0, wins: 0 };
      w.games++;
      if (h.outcome === 'WON') w.wins++;
      byWorld.set(h.world, w);
      if (h.outcome === 'WON' && h.durationMs > 0) {
        winTime += h.durationMs;
        winCount++;
      }
    }
    return { byMechanic: [...byMechanic.entries()], byWorld: [...byWorld.entries()], avgWinMs: winCount ? winTime / winCount : 0 };
  }, [history]);

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
        YOUR GAME, BY THE NUMBERS
      </h2>
      <div className="card flex flex-col gap-3 p-4">
        {stats.byMechanic.map(([mech, s]) => {
          const rate = Math.round((s.wins / s.games) * 100);
          return (
            <div key={mech}>
              <div className="flex justify-between text-xs">
                <span>
                  {MECHANIC_META[mech].emoji} {MECHANIC_META[mech].name}
                </span>
                <span className="digits" style={{ color: 'var(--text-dim)' }}>
                  {s.wins}/{s.games} · {rate}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rate >= 50 ? 'var(--accent-2)' : 'var(--warn)' }} />
              </div>
            </div>
          );
        })}
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          {stats.avgWinMs > 0 && <span>⏱️ Avg win: {(stats.avgWinMs / 1000).toFixed(0)}s</span>}
          {races.played > 0 && (
            <span>
              ⚔️ Races: {races.won}/{races.played} won
            </span>
          )}
          <span>
            🌍 Best world:{' '}
            {(() => {
              const best = [...stats.byWorld].sort((a, b) => b[1].wins - a[1].wins)[0];
              const w = WORLDS.find((x) => x.id === best?.[0]);
              return w ? `${w.emoji} ${w.name}` : '—';
            })()}
          </span>
        </div>
      </div>
    </section>
  );
}
