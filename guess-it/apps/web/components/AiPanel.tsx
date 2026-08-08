'use client';

/** Opponent overlay: avatar, progress line, latest dialogue (UI/UX S6 versus). */
import { useEffect, useState } from 'react';
import { getCharacter, type AiRuntime, type GameState } from '@guess-it/engine';

export function AiPanel({ ai, game }: { ai: AiRuntime; game: GameState }) {
  const char = getCharacter(ai.character);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setThinking(game.status === 'ACTIVE' && !ai.solved && Date.now() > ai.nextActionAt - 3000);
    }, 500);
    return () => clearInterval(t);
  }, [ai, game.status]);

  const lastLine = [...ai.events].reverse().find((e) => e.type === 'DIALOGUE')?.line;
  const progress =
    game.mechanic === 'EXACT_NUMBER'
      ? `${ai.guessCount} ${ai.guessCount === 1 ? 'guess' : 'guesses'}`
      : `${ai.cluesUsed} ${ai.cluesUsed === 1 ? 'clue' : 'clues'}`;

  return (
    <div className="card-2 flex items-center gap-3 px-4 py-2.5">
      <span className="text-2xl">{char.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">
          {char.name} <span style={{ color: 'var(--text-dim)' }}>· {ai.level}</span>
        </p>
        <p className="truncate text-[11px]" style={{ color: 'var(--text-dim)' }}>
          {ai.solved ? 'Solved it!' : `${progress} used${lastLine ? ` — “${lastLine}”` : ''}`}
        </p>
      </div>
      {thinking && (
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          <span className="inline-block animate-pulse">thinking…</span>
        </span>
      )}
    </div>
  );
}
