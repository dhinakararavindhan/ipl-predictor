'use client';

/** Shared guess input with namespace type-ahead (PRD D-8.3) for Clue/Image games. */
import { useMemo, useState } from 'react';
import { namespaceFor } from '@guess-it/content';
import { normalize } from '@guess-it/engine';

export function TextGuess({ world, onGuess }: { world: string; onGuess: (g: string) => void }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const namespace = useMemo(() => namespaceFor(world), [world]);

  const suggestions = useMemo(() => {
    const q = normalize(text);
    if (q.length < 2) return [];
    return namespace.filter((n) => normalize(n).includes(q)).slice(0, 6);
  }, [text, namespace]);

  const submit = (value: string) => {
    if (!value.trim()) return;
    onGuess(value);
    setText('');
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === 'Enter' && submit(text)}
          placeholder="Type your guess…"
          className="card-2 flex-1 px-4 py-3 text-sm outline-none"
          style={{ color: 'var(--text)' }}
        />
        <button className="btn btn-primary px-5 text-sm font-bold disabled:opacity-40" disabled={!text.trim()} onClick={() => submit(text)}>
          GUESS
        </button>
      </div>
      {focused && suggestions.length > 0 && (
        <div className="card-2 absolute top-full z-10 mt-1 w-full overflow-hidden" style={{ borderRadius: 14 }}>
          {suggestions.map((s) => (
            <button
              key={s}
              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-white/5"
              onMouseDown={(e) => {
                e.preventDefault();
                submit(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
