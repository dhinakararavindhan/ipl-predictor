'use client';

/** Live Race (UI for services/realtime): create/join a room, race a friend in real time. */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Difficulty, Mechanic } from '@guess-it/engine';
import { MECHANIC_META, WORLDS } from '@guess-it/content';
import { REALTIME_URL, useOnline } from '@/lib/online';
import { sfx } from '@/lib/sound';
import { useProfile } from '@/lib/store';
import { OpponentBar, RaceClue, RaceExact, RaceHigherLower } from '@/components/RaceGame';

const RACE_MECHANICS: Mechanic[] = ['EXACT_NUMBER', 'CLUE_GUESS', 'HIGHER_LOWER'];
const RACE_WORLDS: Record<Mechanic, string[]> = {
  EXACT_NUMBER: ['numbers'],
  CLUE_GUESS: ['actors', 'movies', 'heroes', 'anything'],
  HIGHER_LOWER: ['numbers'],
  IMAGE_REVEAL: [],
  MULTIPLE_CHOICE: [],
};

export default function OnlinePage() {
  const online = useOnline();
  const username = useProfile((s) => s.username);
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [mechanic, setMechanic] = useState<Mechanic>('EXACT_NUMBER');
  const [world, setWorld] = useState('numbers');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [joinCode, setJoinCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const lastNonce = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (online.errorNonce !== lastNonce.current && online.error) {
      lastNonce.current = online.errorNonce;
      setToast(online.error);
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [online.errorNonce, online.error]);

  // leaving the page leaves the room
  useEffect(() => () => useOnline.getState().leave(), []);

  // race sound
  useEffect(() => {
    if (!online.gameOver) return;
    const won = online.gameOver.outcome === 'WIN' || online.gameOver.outcome === 'WALKOVER';
    if (won) sfx.win();
    else sfx.lose();
  }, [online.gameOver]);

  if (!mounted) return null;

  if (!REALTIME_URL) {
    return (
      <main className="flex flex-col gap-4 pt-10">
        <h1 className="text-2xl font-bold">🌎 Live Race</h1>
        <div className="card p-5">
          <p className="text-sm font-bold">Race server not connected yet</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
            Live races run on the realtime server (guess-it/services/realtime). Deploy it — free
            tiers work — and set NEXT_PUBLIC_REALTIME_URL at build time. Full steps are in
            guess-it/DISTRIBUTION.md.
          </p>
        </div>
        <Link href="/" className="btn btn-ghost py-3 text-center text-sm font-bold">
          HOME
        </Link>
      </main>
    );
  }

  // ---------- racing ----------
  if (online.phase === 'racing' && online.view) {
    const v = online.view;
    return (
      <main className="flex flex-col gap-4 pt-6">
        <div className="flex items-center justify-between">
          <button className="btn btn-ghost h-9 w-9 text-sm" onClick={() => online.leave()} aria-label="Leave race">
            ✕
          </button>
          <div className="text-center">
            <p className="text-sm font-bold">
              {MECHANIC_META[v.mechanic].emoji} Live Race
            </p>
            <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
              {v.world.toUpperCase()} · {v.difficulty}
            </p>
          </div>
          <div className="text-right">
            <p className="digits text-sm font-bold" style={{ color: 'var(--accent-2)' }}>
              {v.potentialScore}
            </p>
            <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
              PTS
            </p>
          </div>
        </div>

        {online.opponent && online.opponentName && (
          <OpponentBar name={online.opponentName} progress={online.opponent} mechanic={v.mechanic} />
        )}

        {v.attemptsMax > 1 && (
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: v.attemptsMax }).map((_, i) => (
              <span key={i} className="h-1.5 w-4 rounded-full" style={{ background: i < v.attemptsUsed ? 'var(--danger)' : 'var(--surface-2)' }} />
            ))}
          </div>
        )}

        {v.mechanic === 'EXACT_NUMBER' && <RaceExact view={v} onGuess={(g) => online.sendAction('guess', g)} />}
        {v.mechanic === 'CLUE_GUESS' && (
          <RaceClue view={v} onGuess={(g) => online.sendAction('guess', g)} onAdvance={() => online.sendAction('advance')} />
        )}
        {v.mechanic === 'HIGHER_LOWER' && <RaceHigherLower view={v} onGuess={(g) => online.sendAction('guess', g)} />}

        {v.status !== 'ACTIVE' && !online.gameOver && (
          <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            You&apos;re out of guesses — waiting to see if {online.opponentName} cracks it…
          </p>
        )}

        {toast && (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2">
            <p className="shake card-2 px-4 py-2 text-sm" style={{ color: 'var(--warn)' }}>
              {toast}
            </p>
          </div>
        )}
      </main>
    );
  }

  // ---------- over ----------
  if (online.phase === 'over' && online.gameOver) {
    const g = online.gameOver;
    const headline =
      g.outcome === 'WIN'
        ? '🏆 YOU WON THE RACE!'
        : g.outcome === 'WALKOVER'
          ? `🏆 ${g.opponent.name} left — you win!`
          : g.outcome === 'DRAW'
            ? '🤝 THE PUZZLE BEAT YOU BOTH'
            : `${g.opponent.name} got there first`;
    const celebrate = g.outcome === 'WIN' || g.outcome === 'WALKOVER';
    const colors = ['#6C5CE7', '#00D2A8', '#FFB020', '#FF5C7A', '#4DA3FF'];
    return (
      <main className="flex flex-col gap-4 pt-10">
        {celebrate &&
          Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="confetti"
              style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 7) * 0.09}s` }}
            />
          ))}
        <h1 className="text-center text-2xl font-extrabold">{headline}</h1>
        <div className="card-2 p-4 text-center">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
            THE ANSWER
          </p>
          <p className="mt-1 text-xl font-extrabold">{g.view.result?.answerName}</p>
        </div>
        <div className="card flex items-center justify-around p-4 text-center">
          <div>
            <p className="digits text-2xl font-extrabold" style={{ color: 'var(--accent-2)' }}>
              {g.you.score}
            </p>
            <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
              YOU · {g.you.attemptsUsed} GUESSES
            </p>
          </div>
          <span className="text-lg" style={{ color: 'var(--text-dim)' }}>
            vs
          </span>
          <div>
            <p className="digits text-2xl font-extrabold">{g.opponent.score}</p>
            <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
              {g.opponent.name.toUpperCase()} · {g.opponent.attemptsUsed} GUESSES
            </p>
          </div>
        </div>
        {g.you.rating !== undefined && (
          <p className="text-center text-sm font-bold" style={{ color: (g.you.ratingDelta ?? 0) >= 0 ? 'var(--accent-2)' : 'var(--danger)' }}>
            📈 Rating: {g.you.rating}{' '}
            <span className="digits">
              ({(g.you.ratingDelta ?? 0) >= 0 ? '+' : ''}
              {g.you.ratingDelta})
            </span>
            {g.opponent.rating !== undefined && (
              <span className="text-xs font-normal" style={{ color: 'var(--text-dim)' }}>
                {' '}
                · {g.opponent.name}: {g.opponent.rating}
              </span>
            )}
          </p>
        )}
        {online.rematchOffer && (
          <p className="text-center text-sm font-bold" style={{ color: 'var(--warn)' }}>
            {online.rematchOffer} wants a rematch!
          </p>
        )}
        <div className="flex gap-2">
          {g.outcome !== 'WALKOVER' && (
            <button className="btn btn-primary flex-1 py-3 text-sm font-bold" onClick={() => online.rematch()}>
              ⚔️ REMATCH
            </button>
          )}
          <button className="btn btn-ghost flex-1 py-3 text-sm font-bold" onClick={() => online.leave()}>
            LEAVE
          </button>
        </div>
      </main>
    );
  }

  // ---------- searching ----------
  if (online.phase === 'searching') {
    return (
      <main className="flex flex-col items-center gap-4 pt-24">
        <p className="animate-pulse text-5xl">🎲</p>
        <h1 className="text-xl font-bold">Finding an opponent…</h1>
        <p className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
          You&apos;ll race the moment someone else hits Quick Match. Tell a friend to
          try it right now — instant match.
        </p>
        <button className="btn btn-ghost px-8 py-3 text-sm font-bold" onClick={() => online.leave()}>
          CANCEL
        </button>
      </main>
    );
  }

  // ---------- lobby ----------
  if (online.phase === 'lobby') {
    return (
      <main className="flex flex-col gap-4 pt-10">
        <h1 className="text-2xl font-bold">🌎 Live Race</h1>
        <div className="card p-6 text-center" style={{ borderColor: 'var(--accent)' }}>
          <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
            ROOM CODE — TELL YOUR FRIEND
          </p>
          <p className="digits mt-2 text-5xl font-extrabold" style={{ letterSpacing: '0.2em', color: 'var(--accent)' }}>
            {online.code}
          </p>
          {online.config && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-dim)' }}>
              {MECHANIC_META[online.config.mechanic].name} · {online.config.world} · {online.config.difficulty}
            </p>
          )}
          <div className="mt-4 flex flex-col gap-1">
            {online.players.map((p) => (
              <p key={p.name} className="text-sm">
                {p.isHost ? '👑' : '🎮'} <b>{p.name}</b>
                {p.isYou ? ' (you)' : ''}
              </p>
            ))}
            {online.players.length < 2 && (
              <p className="animate-pulse text-sm" style={{ color: 'var(--text-dim)' }}>
                Waiting for your friend…
              </p>
            )}
          </div>
          {online.canStart && (
            <button className="btn btn-primary mt-4 w-full py-3.5 text-base font-bold" onClick={() => online.start()}>
              START THE RACE →
            </button>
          )}
        </div>
        <button className="btn btn-ghost py-3 text-sm" onClick={() => online.leave()}>
          Leave room
        </button>
        {toast && (
          <p className="text-center text-sm" style={{ color: 'var(--warn)' }}>
            {toast}
          </p>
        )}
      </main>
    );
  }

  // ---------- menu / create / join ----------
  return (
    <main className="flex flex-col gap-4 pt-10">
      <h1 className="text-2xl font-bold">🌎 Live Race</h1>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        Two phones, one puzzle, real time. Make a room, share the code, first to crack it wins.
      </p>

      {mode === 'menu' && (
        <div className="flex flex-col gap-3">
          <button
            className="card p-5 text-left"
            style={{ borderColor: 'var(--accent)' }}
            onClick={() => online.quickMatch(username)}
          >
            <p className="text-2xl">🎲</p>
            <p className="mt-1 font-bold">Quick Match</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Race a random opponent — rated with Elo
            </p>
          </button>
          <button className="card p-5 text-left" onClick={() => setMode('create')}>
            <p className="text-2xl">🎯</p>
            <p className="mt-1 font-bold">Create a room</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Pick the game, get a code, invite a friend
            </p>
          </button>
          <button className="card p-5 text-left" onClick={() => setMode('join')}>
            <p className="text-2xl">🔑</p>
            <p className="mt-1 font-bold">Join with a code</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Your friend made a room? Enter their code
            </p>
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
              GAME
            </h2>
            <div className="flex flex-col gap-2">
              {RACE_MECHANICS.map((m) => (
                <button
                  key={m}
                  className="card flex items-center gap-3 p-4 text-left"
                  style={mechanic === m ? { borderColor: 'var(--accent)' } : undefined}
                  onClick={() => {
                    setMechanic(m);
                    setWorld(RACE_WORLDS[m][0]);
                  }}
                >
                  <span className="text-2xl">{MECHANIC_META[m].emoji}</span>
                  <span>
                    <span className="block font-bold">{MECHANIC_META[m].name}</span>
                    <span className="block text-xs" style={{ color: 'var(--text-dim)' }}>
                      {MECHANIC_META[m].blurb}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          {RACE_WORLDS[mechanic].length > 1 && (
            <div className="flex flex-wrap gap-2">
              {RACE_WORLDS[mechanic].map((w) => {
                const info = WORLDS.find((x) => x.id === w)!;
                return (
                  <button key={w} className="chip px-4 py-2 text-sm font-semibold" data-active={world === w} onClick={() => setWorld(w)}>
                    {info.emoji} {info.name}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-2">
            {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((d) => (
              <button key={d} className="chip px-4 py-2 text-sm font-semibold" data-active={difficulty === d} onClick={() => setDifficulty(d)}>
                {d}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary w-full py-3.5 text-base font-bold"
            onClick={() => online.createRoom(username, { world, mechanic, difficulty })}
          >
            CREATE ROOM →
          </button>
          <button className="btn btn-ghost py-2 text-xs" onClick={() => setMode('menu')}>
            ← Back
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex flex-col gap-3">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="ROOM CODE"
            className="card-2 digits px-4 py-4 text-center text-2xl font-bold outline-none"
            style={{ color: 'var(--text)', letterSpacing: '0.3em' }}
          />
          <button
            className="btn btn-primary w-full py-3.5 text-base font-bold disabled:opacity-40"
            disabled={joinCode.length < 5}
            onClick={() => online.joinRoom(username, joinCode)}
          >
            JOIN RACE →
          </button>
          <button className="btn btn-ghost py-2 text-xs" onClick={() => setMode('menu')}>
            ← Back
          </button>
        </div>
      )}

      {toast && (
        <p className="text-center text-sm" style={{ color: 'var(--warn)' }}>
          {toast}
        </p>
      )}
      {online.phase === 'connecting' && (
        <p className="animate-pulse text-center text-xs" style={{ color: 'var(--text-dim)' }}>
          Connecting…
        </p>
      )}
    </main>
  );
}
