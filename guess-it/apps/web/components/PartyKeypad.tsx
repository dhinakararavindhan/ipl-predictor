'use client';

/** Shared 5-distinct-digit keypad for Party Mode (setting + guessing). */
import { useState } from 'react';

export function PartyKeypad({
  label,
  onSubmit,
  disabled,
}: {
  label: string;
  onSubmit: (digits: string) => void;
  disabled?: boolean;
}) {
  const [entry, setEntry] = useState('');
  const push = (d: string) => {
    if (entry.length < 5 && !entry.includes(d)) setEntry(entry + d);
  };
  return (
    <div className={`flex flex-col gap-3 ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="digits card-2 flex h-12 w-12 items-center justify-center text-xl font-bold" style={entry[i] ? { borderColor: 'var(--accent)' } : undefined}>
            {entry[i] ?? ''}
          </span>
        ))}
      </div>
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
        <button
          className="btn btn-primary flex-1 py-3 text-sm disabled:opacity-40"
          disabled={entry.length !== 5}
          onClick={() => {
            onSubmit(entry);
            setEntry('');
          }}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
