'use client';

import type { GameDefinition, GameState } from '@guess-it/engine';
import { COSTS } from '@guess-it/engine';
import { TextGuess } from './TextGuess';

export function ClueGame({
  game,
  def,
  onGuess,
  onAdvance,
}: {
  game: GameState;
  def: GameDefinition;
  onGuess: (g: string) => void;
  onAdvance: () => void;
}) {
  const st = game.clueState!;
  const total = def.clue!.clues.length;
  const revealed = def.clue!.clues.slice(0, st.cluesRevealed);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        Who or what am I? Fewer clues, bigger score.
      </p>

      <div className="flex flex-col gap-2">
        {revealed.map((c, i) => (
          <div key={i} className="card pop-in px-4 py-3">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--accent)' }}>
              CLUE {i + 1} / {total}
            </p>
            <p className="mt-0.5 text-sm">{c.text}</p>
          </div>
        ))}
      </div>

      {st.firstLetter && (
        <p className="text-center text-xs" style={{ color: 'var(--info)' }}>
          Hint: it starts with “{st.firstLetter}”
        </p>
      )}

      {st.wrongGuesses.length > 0 && (
        <p className="text-center text-xs" style={{ color: 'var(--danger)' }}>
          {st.wrongGuesses.map((w) => (
            <s key={w} className="mr-2">
              {w}
            </s>
          ))}
        </p>
      )}

      <TextGuess world={game.world} onGuess={onGuess} />

      {st.cluesRevealed < total && (
        <button className="btn btn-ghost py-2.5 text-sm" onClick={onAdvance}>
          GET NEXT CLUE <span style={{ color: 'var(--danger)' }}>(−{COSTS.CLUE_EXTRA_CLUE} pts)</span>
        </button>
      )}
    </div>
  );
}
