'use client';

import { useState } from 'react';
import type { GameDefinition, GameState } from '@guess-it/engine';

export function HigherLower({
  game,
  def,
  onGuess,
}: {
  game: GameState;
  def: GameDefinition;
  onGuess: (g: string) => void;
}) {
  const [entry, setEntry] = useState('');
  const { curLo, curHi, history } = game.hl!;
  const { lo, hi, unit, prompt } = def.higherLower!;
  const span = hi - lo || 1;
  const leftPct = ((curLo - lo) / span) * 100;
  const widthPct = ((curHi - curLo) / span) * 100;

  const submit = () => {
    if (!entry) return;
    onGuess(entry);
    setEntry('');
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-base font-semibold">{prompt}</p>

      {/* narrowing range bar */}
      <div>
        <div className="relative h-3 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
          <div
            className="absolute h-full rounded-full transition-all duration-500"
            style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%`, background: 'var(--info)' }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs digits" style={{ color: 'var(--text-dim)' }}>
          <span>{curLo.toLocaleString()}</span>
          <span>{curHi.toLocaleString()}</span>
        </div>
      </div>

      {/* history */}
      {history.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {history.map((h, i) => (
            <span key={i} className="chip digits px-3 py-1 text-sm" style={{ cursor: 'default' }}>
              {h.guess.toLocaleString()} {h.verdict === 'TOO_LOW' ? '↑' : '↓'}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={entry}
          inputMode="numeric"
          onChange={(e) => setEntry(e.target.value.replace(/[^0-9-]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={`${curLo.toLocaleString()} – ${curHi.toLocaleString()}${unit ? ` ${unit}` : ''}`}
          className="card-2 digits flex-1 px-4 py-3 text-center text-lg outline-none"
          style={{ color: 'var(--text)' }}
        />
        <button className="btn btn-primary px-6 text-sm font-bold disabled:opacity-40" disabled={!entry} onClick={submit}>
          GUESS
        </button>
      </div>
    </div>
  );
}
