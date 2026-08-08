'use client';

/** Game screen (UI/UX S6): shared chrome + mechanic body + AI overlay + result. */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HINT_COSTS, potentialScore, type HintType } from '@guess-it/engine';
import { MECHANIC_META } from '@guess-it/content';
import { sfx } from '@/lib/sound';
import { useProfile, useSession } from '@/lib/store';
import { AiPanel } from '@/components/AiPanel';
import { ClueGame } from '@/components/ClueGame';
import { ExactNumber } from '@/components/ExactNumber';
import { HigherLower } from '@/components/HigherLower';
import { MultipleChoice } from '@/components/MultipleChoice';
import { ResultSheet } from '@/components/ResultSheet';

function hintFor(mechanic: string): { type: HintType; label: string; cost: number } | null {
  switch (mechanic) {
    case 'EXACT_NUMBER':
      return { type: 'REVEAL_DIGIT', label: 'Reveal a digit', cost: HINT_COSTS.REVEAL_DIGIT };
    case 'CLUE_GUESS':
    case 'IMAGE_REVEAL':
      return { type: 'FIRST_LETTER', label: 'First letter', cost: HINT_COSTS.FIRST_LETTER };
    case 'HIGHER_LOWER':
      return { type: 'SHRINK_RANGE', label: 'Shrink range', cost: HINT_COSTS.SHRINK_RANGE };
    case 'MULTIPLE_CHOICE':
      return { type: 'FIFTY_FIFTY', label: '50 / 50', cost: HINT_COSTS.FIFTY_FIFTY };
    default:
      return null;
  }
}

export default function GamePage() {
  const router = useRouter();
  const session = useSession();
  const clearNewlyUnlocked = useProfile((s) => s.clearNewlyUnlocked);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const lastErrorNonce = useRef(0);

  useEffect(() => setMounted(true), []);

  // heartbeat: MC timeout sweep + AI runner (Architecture §7 pattern, client-run)
  useEffect(() => {
    const t = setInterval(() => useSession.getState().heartbeat(), 700);
    return () => clearInterval(t);
  }, []);

  // surface engine errors as toasts
  useEffect(() => {
    if (session.errorNonce !== lastErrorNonce.current && session.error) {
      lastErrorNonce.current = session.errorNonce;
      setToast(session.error);
      const t = setTimeout(() => setToast(null), 2200);
      return () => clearTimeout(t);
    }
  }, [session.errorNonce, session.error]);

  // clear "new achievement" flags when leaving the result
  useEffect(() => () => clearNewlyUnlocked(), [clearNewlyUnlocked]);

  // sound juice: react to game-state transitions
  const prevGame = useRef<{ attempts: number; status: string } | null>(null);
  useEffect(() => {
    const g = session.game;
    if (!g) {
      prevGame.current = null;
      return;
    }
    const prev = prevGame.current;
    prevGame.current = { attempts: g.attemptsUsed, status: g.status };
    if (!prev) return;
    if (prev.status === 'ACTIVE' && g.status === 'WON') sfx.win();
    else if (prev.status === 'ACTIVE' && (g.status === 'LOST' || g.status === 'FORFEITED')) sfx.lose();
    else if (g.status === 'ACTIVE' && g.attemptsUsed > prev.attempts) sfx.bad();
  }, [session.game]);

  if (!mounted) return null;
  const { game, def, ai } = session;
  if (!game || !def) {
    return (
      <main className="flex flex-col items-center gap-4 pt-24">
        <p className="text-4xl">🎲</p>
        <p style={{ color: 'var(--text-dim)' }}>No game in progress.</p>
        <button className="btn btn-primary px-8 py-3 text-sm font-bold" onClick={() => router.push('/play')}>
          PICK A GAME
        </button>
      </main>
    );
  }

  const meta = MECHANIC_META[game.mechanic];
  const hint = hintFor(game.mechanic);
  const active = game.status === 'ACTIVE';

  const playAgain = () => {
    clearNewlyUnlocked();
    session.start({
      world: game.world,
      mechanic: game.mechanic,
      difficulty: game.difficulty,
      mode: session.duel ? 'duel' : ai ? 'vs_ai' : 'solo',
      aiCharacter: ai?.character,
      aiLevel: ai?.level,
      duelPlayers: session.duel?.players,
    });
  };

  return (
    <main className="flex flex-col gap-4 pt-6">
      {/* chrome */}
      <div className="flex items-center justify-between">
        <button
          className="btn btn-ghost h-9 w-9 text-sm"
          onClick={() => (active ? setConfirmQuit(true) : router.push('/'))}
          aria-label="Close game"
        >
          ✕
        </button>
        <div className="text-center">
          <p className="text-sm font-bold">
            {meta.emoji} {meta.name}
          </p>
          <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
            {game.world.toUpperCase()} · {game.difficulty}
          </p>
        </div>
        <div className="text-right">
          <p className="digits text-sm font-bold" style={{ color: 'var(--accent-2)' }}>
            {game.status === 'ACTIVE' ? potentialScore(game) : game.result?.score}
          </p>
          <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
            PTS
          </p>
        </div>
      </div>

      {/* attempts pips */}
      {game.attemptsMax > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: game.attemptsMax }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-4 rounded-full"
              style={{ background: i < game.attemptsUsed ? 'var(--danger)' : 'var(--surface-2)' }}
            />
          ))}
        </div>
      )}

      {/* opponent */}
      {ai && <AiPanel ai={ai} game={game} />}

      {/* pass & play turn banner */}
      {session.duel && active && (
        <div className="card-2 pop-in px-4 py-2.5 text-center" key={session.duel.current} style={{ borderColor: 'var(--accent)' }}>
          <p className="text-sm font-bold">
            🎯 {session.duel.players[session.duel.current]}&apos;s turn
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
            {session.duel.players.map((p, i) => `${p}: ${session.duel!.guessCounts[i]}`).join(' · ')} guesses — first correct wins
          </p>
        </div>
      )}

      {/* mechanic body */}
      <div className={active ? '' : 'pointer-events-none opacity-50'}>
        {game.mechanic === 'EXACT_NUMBER' && (
          <ExactNumber game={game} onGuess={session.guess} errorNonce={session.errorNonce} />
        )}
        {game.mechanic === 'CLUE_GUESS' && (
          <ClueGame game={game} def={def} onGuess={session.guess} onAdvance={session.advance} />
        )}
        {game.mechanic === 'HIGHER_LOWER' && <HigherLower game={game} def={def} onGuess={session.guess} />}
        {game.mechanic === 'MULTIPLE_CHOICE' && <MultipleChoice game={game} def={def} onGuess={session.guess} />}
      </div>

      {/* hint (disabled in Pass & Play — brains only) */}
      {active && hint && game.hintsRemaining > 0 && !session.duel && (
        <button className="btn btn-ghost mx-auto px-5 py-2 text-xs" onClick={() => session.hint(hint.type)}>
          💡 {hint.label} <span style={{ color: 'var(--danger)' }}>(−{hint.cost} pts)</span> · {game.hintsRemaining} left
        </button>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2">
          <p className="shake card-2 px-4 py-2 text-sm" style={{ color: 'var(--warn)' }}>
            {toast}
          </p>
        </div>
      )}

      {/* quit confirm */}
      {confirmQuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card w-full max-w-sm p-5 text-center">
            <p className="font-bold">Give up this game?</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
              Forfeiting scores 0 and reveals the answer.
            </p>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-ghost flex-1 py-2.5 text-sm" onClick={() => setConfirmQuit(false)}>
                Keep playing
              </button>
              <button
                className="btn flex-1 py-2.5 text-sm font-bold"
                style={{ background: 'var(--danger)', color: 'white' }}
                onClick={() => {
                  setConfirmQuit(false);
                  session.forfeit();
                }}
              >
                Forfeit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* result */}
      {game.result && (
        <ResultSheet result={game.result} ai={ai} xp={session.lastXp} onPlayAgain={playAgain} daily={!!session.daily} />
      )}
    </main>
  );
}
