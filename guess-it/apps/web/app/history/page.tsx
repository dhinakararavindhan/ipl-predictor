'use client';

import { useEffect, useState } from 'react';
import { MECHANIC_META, WORLDS } from '@guess-it/content';
import { useProfile } from '@/lib/store';

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const history = useProfile((s) => s.history);

  if (!mounted) return null;

  return (
    <main className="flex flex-col gap-4 pt-8">
      <h1 className="text-2xl font-extrabold">📜 History</h1>
      {history.length === 0 ? (
        <p className="pt-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
          No games yet — your story starts with one guess.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((h) => {
            const world = WORLDS.find((w) => w.id === h.world);
            return (
              <div key={h.id + h.endedAt} className="card flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{world?.emoji ?? '🎲'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {MECHANIC_META[h.mechanic].name}
                    {h.daily && <span style={{ color: 'var(--accent)' }}> · Daily</span>}
                    {h.mode === 'vs_ai' && <span style={{ color: 'var(--text-dim)' }}> · vs {h.aiCharacter}</span>}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'var(--text-dim)' }}>
                    {h.answerName} · {h.difficulty} · {new Date(h.endedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xs font-bold"
                    style={{ color: h.outcome === 'WON' ? 'var(--accent-2)' : h.outcome === 'LOST' ? 'var(--danger)' : 'var(--text-dim)' }}
                  >
                    {h.outcome}
                  </p>
                  <p className="digits text-xs" style={{ color: 'var(--text-dim)' }}>
                    {h.score} pts
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
