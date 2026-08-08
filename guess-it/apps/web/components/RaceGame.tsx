'use client';

/** Live-race board renderers driven by the server's PlayerView (never local state). */
import { useState } from 'react';
import { COSTS, type DigitMark, type PlayerView } from '@guess-it/engine';
import { TextGuess } from './TextGuess';
import type { OpponentProgress } from '@/lib/online';

function markStyle(m: DigitMark) {
  return m === 'EXACT'
    ? { background: 'var(--accent-2)', color: '#04291f' }
    : m === 'MISPLACED'
      ? { background: 'var(--warn)', color: '#3a2600' }
      : { background: 'var(--surface-2)', color: 'var(--text-dim)' };
}

export function OpponentBar({ name, progress, mechanic }: { name: string; progress: OpponentProgress; mechanic: string }) {
  const line = progress.finished
    ? 'is done!'
    : mechanic === 'CLUE_GUESS'
      ? `on clue ${progress.cluesRevealed ?? 1} · ${progress.attemptsUsed} guesses`
      : `${progress.attemptsUsed} ${progress.attemptsUsed === 1 ? 'guess' : 'guesses'}${
          progress.lastExactCount !== undefined ? ` · last hit ${progress.lastExactCount} exact` : ''
        }`;
  return (
    <div className="card-2 flex items-center gap-3 px-4 py-2.5" style={{ borderColor: 'var(--danger)' }}>
      <span className="text-xl">⚔️</span>
      <p className="text-xs">
        <b>{name}</b> <span style={{ color: 'var(--text-dim)' }}>{line}</span>
      </p>
      <span className="ml-auto inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--accent-2)' }} />
    </div>
  );
}

export function RaceExact({ view, onGuess }: { view: PlayerView; onGuess: (g: string) => void }) {
  const [entry, setEntry] = useState('');
  const push = (d: string) => {
    if (entry.length < 5 && !entry.includes(d)) setEntry(entry + d);
  };
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        Same secret code on both phones. First to crack it wins.
      </p>
      <div className="flex flex-col gap-1.5">
        {view.exact!.guesses.map((row, i) => (
          <div key={i} className="flex items-center justify-center gap-1.5">
            {row.digits.split('').map((d, j) => (
              <span
                key={j}
                className={`digits flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${i === view.exact!.guesses.length - 1 ? 'flip-in' : ''}`}
                style={{ ...markStyle(row.perDigit[j]), animationDelay: `${j * 80}ms` }}
              >
                {d}
              </span>
            ))}
            <span className="ml-2 w-12 text-[10px]" style={{ color: 'var(--text-dim)' }}>
              {row.exact}E {row.misplaced}M
            </span>
          </div>
        ))}
      </div>
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
            onGuess(entry);
            setEntry('');
          }}
        >
          GUESS
        </button>
      </div>
    </div>
  );
}

export function RaceClue({
  view,
  onGuess,
  onAdvance,
}: {
  view: PlayerView;
  onGuess: (g: string) => void;
  onAdvance: () => void;
}) {
  const c = view.clue!;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        Same mystery for both of you. First correct guess wins.
      </p>
      <div className="flex flex-col gap-2">
        {c.cluesRevealed.map((text, i) => (
          <div key={i} className="card pop-in px-4 py-3">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--accent)' }}>
              CLUE {i + 1} / {c.cluesTotal}
            </p>
            <p className="mt-0.5 text-sm">{text}</p>
          </div>
        ))}
      </div>
      {c.wrongGuesses.length > 0 && (
        <p className="text-center text-xs" style={{ color: 'var(--danger)' }}>
          {c.wrongGuesses.map((w) => (
            <s key={w} className="mr-2">
              {w}
            </s>
          ))}
        </p>
      )}
      <TextGuess world={view.world} onGuess={onGuess} />
      {c.cluesRevealed.length < c.cluesTotal && (
        <button className="btn btn-ghost py-2.5 text-sm" onClick={onAdvance}>
          GET NEXT CLUE <span style={{ color: 'var(--danger)' }}>(−{COSTS.CLUE_EXTRA_CLUE} pts)</span>
        </button>
      )}
    </div>
  );
}

export function RaceQuickPick({ view, onGuess }: { view: PlayerView; onGuess: (presIdx: string) => void }) {
  const [locked, setLocked] = useState<number | null>(null);
  const m = view.mc!;
  const letters = ['A', 'B', 'C', 'D'];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
        One shot — answer fast for a bigger score.
      </p>
      <p className="text-center text-base font-semibold">{m.question}</p>
      <div className="flex flex-col gap-2">
        {m.options.map((opt, presIdx) => {
          const gone = m.eliminated.includes(presIdx);
          return (
            <button
              key={presIdx}
              className="card p-4 text-left text-sm font-medium transition-opacity disabled:opacity-25"
              style={locked === presIdx ? { borderColor: 'var(--accent)' } : undefined}
              disabled={gone || locked !== null}
              onClick={() => {
                setLocked(presIdx);
                onGuess(String(presIdx));
              }}
            >
              <span className="mr-2 font-bold" style={{ color: 'var(--accent)' }}>
                {letters[presIdx]}
              </span>
              {gone ? '—' : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RaceHigherLower({ view, onGuess }: { view: PlayerView; onGuess: (g: string) => void }) {
  const [entry, setEntry] = useState('');
  const h = view.hl!;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-base font-semibold">{h.prompt}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {h.history.map((x, i) => (
          <span key={i} className="chip digits px-3 py-1 text-sm" style={{ cursor: 'default' }}>
            {x.guess.toLocaleString()} {x.verdict === 'TOO_LOW' ? '↑' : '↓'}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={entry}
          inputMode="numeric"
          onChange={(e) => setEntry(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && entry && (onGuess(entry), setEntry(''))}
          placeholder={`${h.curLo.toLocaleString()} – ${h.curHi.toLocaleString()}${h.unit ? ` ${h.unit}` : ''}`}
          className="card-2 digits flex-1 px-4 py-3 text-center text-lg outline-none"
          style={{ color: 'var(--text)' }}
        />
        <button
          className="btn btn-primary px-6 text-sm font-bold disabled:opacity-40"
          disabled={!entry}
          onClick={() => {
            onGuess(entry);
            setEntry('');
          }}
        >
          GUESS
        </button>
      </div>
    </div>
  );
}
