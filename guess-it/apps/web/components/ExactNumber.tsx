'use client';

import { useState } from 'react';
import type { GameState } from '@guess-it/engine';

export function ExactNumber({
  game,
  onGuess,
  errorNonce,
}: {
  game: GameState;
  onGuess: (g: string) => void;
  errorNonce: number;
}) {
  const [entry, setEntry] = useState('');
  const revealed = new Map(game.exact!.revealedPositions.map((r) => [r.index, r.digit]));

  const push = (d: string) => {
    if (entry.length >= 5 || entry.includes(d)) return;
    setEntry(entry + d);
  };
  const submit = () => {
    if (entry.length !== 5) return;
    onGuess(entry);
    setEntry('');
  };

  const markStyle = (m: 'EXACT' | 'MISPLACED' | 'MISS') =>
    m === 'EXACT'
      ? { background: 'var(--accent-2)', color: '#04291f' }
      : m === 'MISPLACED'
        ? { background: 'var(--warn)', color: '#3a2600' }
        : { background: 'var(--surface-2)', color: 'var(--text-dim)' };
  const markGlyph = (m: 'EXACT' | 'MISPLACED' | 'MISS') => (m === 'EXACT' ? '✓' : m === 'MISPLACED' ? '↔' : '✕');

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        Crack the secret 5-digit code. All digits are different.
      </p>

      {/* hint-revealed positions */}
      {revealed.size > 0 && (
        <p className="text-center text-xs" style={{ color: 'var(--info)' }}>
          Hint: {[...revealed.entries()].map(([i, d]) => `position ${i + 1} is ${d}`).join(', ')}
        </p>
      )}

      {/* history */}
      <div className="flex flex-col gap-1.5">
        {game.exact!.guesses.map((row, i) => (
          <div key={i} className="pop-in flex items-center justify-center gap-1.5">
            {row.digits.split('').map((d, j) => (
              <span
                key={j}
                className="digits flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
                style={markStyle(row.perDigit[j])}
                title={row.perDigit[j]}
              >
                {d}
              </span>
            ))}
            <span className="ml-2 w-16 text-[10px] leading-tight" style={{ color: 'var(--text-dim)' }}>
              {row.perDigit.map(markGlyph).join(' ')}
              <br />
              {row.exact}E {row.misplaced}M
            </span>
          </div>
        ))}
      </div>

      {/* entry row */}
      <div key={errorNonce} className={`flex items-center justify-center gap-1.5 ${errorNonce ? '' : ''}`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="digits card-2 flex h-12 w-12 items-center justify-center text-xl font-bold"
            style={entry[i] ? { borderColor: 'var(--accent)' } : undefined}
          >
            {entry[i] ?? (revealed.has(i) ? <span style={{ color: 'var(--info)', opacity: 0.4 }}>{revealed.get(i)}</span> : '')}
          </span>
        ))}
      </div>

      {/* keypad */}
      <div className="mx-auto grid w-full max-w-[300px] grid-cols-5 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
          <button
            key={d}
            className="btn btn-ghost digits h-12 text-lg font-bold disabled:opacity-30"
            disabled={entry.includes(d) || entry.length >= 5}
            onClick={() => push(d)}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-[300px] gap-2">
        <button className="btn btn-ghost flex-1 py-3 text-sm" onClick={() => setEntry(entry.slice(0, -1))}>
          ⌫ Delete
        </button>
        <button className="btn btn-primary flex-1 py-3 text-sm disabled:opacity-40" disabled={entry.length !== 5} onClick={submit}>
          GUESS
        </button>
      </div>
    </div>
  );
}
