'use client';

import { useEffect, useState } from 'react';
import type { GameDefinition, GameState } from '@guess-it/engine';

export function MultipleChoice({
  game,
  def,
  onGuess,
}: {
  game: GameState;
  def: GameDefinition;
  onGuess: (presIdx: string) => void;
}) {
  const { order, eliminated, timeLimitMs } = game.mc!;
  const [remaining, setRemaining] = useState(timeLimitMs);
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(Math.max(0, timeLimitMs - (Date.now() - game.startedAt)));
    }, 100);
    return () => clearInterval(t);
  }, [game.startedAt, timeLimitMs]);

  // 300 ms undo window (PRD GI-3.3) — client UX only
  useEffect(() => {
    if (pending === null) return;
    const t = setTimeout(() => onGuess(String(pending)), 300);
    return () => clearTimeout(t);
  }, [pending, onGuess]);

  const pct = (remaining / timeLimitMs) * 100;
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-4">
      {/* timer bar */}
      <div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${pct}%`, background: pct < 25 ? 'var(--danger)' : 'var(--accent)' }}
          />
        </div>
        <p className="mt-1 text-center text-xs digits" style={{ color: pct < 25 ? 'var(--danger)' : 'var(--text-dim)' }}>
          {(remaining / 1000).toFixed(1)}s — answer fast for a bigger score
        </p>
      </div>

      <p className="text-center text-base font-semibold">{def.multipleChoice!.question}</p>

      <div className="flex flex-col gap-2">
        {order.map((optIdx, presIdx) => {
          const gone = eliminated.includes(presIdx);
          return (
            <button
              key={presIdx}
              className="card p-4 text-left text-sm font-medium transition-opacity disabled:opacity-25"
              style={pending === presIdx ? { borderColor: 'var(--accent)' } : undefined}
              disabled={gone || pending !== null}
              onClick={() => setPending(presIdx)}
            >
              <span className="mr-2 font-bold" style={{ color: 'var(--accent)' }}>
                {letters[presIdx]}
              </span>
              {gone ? '—' : def.multipleChoice!.options[optIdx]}
              {pending === presIdx && (
                <span className="ml-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                  locking in…
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
