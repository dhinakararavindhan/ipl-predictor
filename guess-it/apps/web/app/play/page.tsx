'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AI_CHARACTERS,
  supportsDuel,
  supportsVersus,
  type AiCharacterId,
  type AiLevel,
  type Difficulty,
  type Mechanic,
} from '@guess-it/engine';
import { MECHANIC_META, mechanicsForWorld, WORLDS } from '@guess-it/content';
import { useProfile, useSession } from '@/lib/store';

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const AI_LEVELS: AiLevel[] = ['ROOKIE', 'EASY', 'MEDIUM', 'HARD'];
type Mode = 'solo' | 'vs_ai' | 'duel';

function PlayWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const start = useSession((s) => s.start);
  const firstGame = useProfile((s) => s.games === 0);

  const [world, setWorld] = useState<string | null>(params.get('world'));
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'vs_ai' ? 'vs_ai' : params.get('mode') === 'duel' ? 'duel' : 'solo');
  const [aiCharacter, setAiCharacter] = useState<AiCharacterId>('machine');
  const [aiLevel, setAiLevel] = useState<AiLevel>(firstGame ? 'ROOKIE' : 'MEDIUM');
  const [players, setPlayers] = useState<string[]>(['', '']);

  const effectiveMode: Mode = !mechanic
    ? mode
    : mode === 'vs_ai' && !supportsVersus(mechanic)
      ? 'solo'
      : mode === 'duel' && !supportsDuel(mechanic)
        ? 'solo'
        : mode;

  const go = () => {
    if (!world || !mechanic) return;
    const ok = start({
      world,
      mechanic,
      difficulty,
      mode: effectiveMode,
      aiCharacter,
      // First-ever versus game always starts at Rookie (AI Spec §4.4)
      aiLevel: firstGame ? 'ROOKIE' : aiLevel,
      duelPlayers: players.map((p, i) => p.trim() || `Player ${i + 1}`),
    });
    if (ok) router.push('/game');
  };

  return (
    <main className="flex flex-col gap-5 pt-8">
      <h1 className="text-2xl font-extrabold">Pick your game</h1>

      {/* Step 1: mode */}
      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
          1 · MODE
        </h2>
        <div className="flex gap-2">
          {(
            [
              ['solo', '🧩 Solo'],
              ['vs_ai', '🤖 vs AI'],
              ['duel', '👥 Pass & Play'],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button key={m} className="chip px-4 py-2 text-sm font-semibold" data-active={mode === m} onClick={() => setMode(m)}>
              {label}
            </button>
          ))}
        </div>
        {mode === 'duel' && (
          <p className="mt-1 text-[11px]" style={{ color: 'var(--text-dim)' }}>
            Same phone, 2–4 players, alternating guesses — first to crack it wins. Works with Crack
            the Code and Higher/Lower.
          </p>
        )}
      </section>

      {/* Step 2: world */}
      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
          2 · WORLD
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {WORLDS.map((w) => (
            <button
              key={w.id}
              className="card p-4 text-left"
              style={world === w.id ? { borderColor: 'var(--accent)' } : undefined}
              onClick={() => {
                setWorld(w.id);
                setMechanic(null);
              }}
            >
              <p className="text-2xl">{w.emoji}</p>
              <p className="mt-1 font-bold">{w.name}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                {w.blurb}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Step 3: mechanic */}
      {world && (
        <section className="pop-in">
          <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
            3 · GAME
          </h2>
          <div className="flex flex-col gap-2">
            {mechanicsForWorld(world)
              .filter((m) => mode !== 'duel' || supportsDuel(m))
              .map((m) => (
                <button
                  key={m}
                  className="card flex items-center gap-3 p-4 text-left"
                  style={mechanic === m ? { borderColor: 'var(--accent)' } : undefined}
                  onClick={() => setMechanic(m)}
                >
                  <span className="text-2xl">{MECHANIC_META[m].emoji}</span>
                  <span className="flex-1">
                    <span className="block font-bold">{MECHANIC_META[m].name}</span>
                    <span className="block text-xs" style={{ color: 'var(--text-dim)' }}>
                      {MECHANIC_META[m].blurb}
                    </span>
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    {MECHANIC_META[m].duration}
                  </span>
                </button>
              ))}
            {mode === 'duel' && mechanicsForWorld(world).filter((m) => supportsDuel(m)).length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                No Pass &amp; Play games in this world yet — try Numbers or Anything.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Step 4: difficulty + opponent(s) */}
      {world && mechanic && (
        <section className="pop-in flex flex-col gap-4">
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
              4 · DIFFICULTY
            </h2>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className="chip px-4 py-2 text-sm font-semibold"
                  data-active={difficulty === d}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {effectiveMode === 'vs_ai' && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
                OPPONENT
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {AI_CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    className="card p-3 text-center"
                    style={aiCharacter === c.id ? { borderColor: 'var(--accent)' } : undefined}
                    onClick={() => setAiCharacter(c.id)}
                  >
                    <p className="text-2xl">{c.emoji}</p>
                    <p className="mt-1 text-sm font-bold">{c.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                      {c.blurb}
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {AI_LEVELS.map((l) => (
                  <button
                    key={l}
                    className="chip px-3 py-1.5 text-xs font-semibold"
                    data-active={(firstGame ? 'ROOKIE' : aiLevel) === l}
                    onClick={() => setAiLevel(l)}
                    disabled={firstGame && l !== 'ROOKIE'}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {firstGame && (
                <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                  First game starts vs Rookie — beat it to unlock stronger minds.
                </p>
              )}
            </div>
          )}

          {effectiveMode === 'duel' && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
                PLAYERS ({players.length})
              </h2>
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={p}
                    onChange={(e) => setPlayers(players.map((x, j) => (j === i ? e.target.value.slice(0, 14) : x)))}
                    placeholder={`Player ${i + 1}`}
                    className="card-2 flex-1 px-4 py-2.5 text-sm outline-none"
                    style={{ color: 'var(--text)' }}
                  />
                  {players.length > 2 && (
                    <button
                      className="btn btn-ghost h-9 w-9 text-sm"
                      onClick={() => setPlayers(players.filter((_, j) => j !== i))}
                      aria-label={`Remove player ${i + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {players.length < 4 && (
                <button className="btn btn-ghost py-2 text-xs" onClick={() => setPlayers([...players, ''])}>
                  + Add player
                </button>
              )}
              <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                Party mode: no hints, no XP — just bragging rights.
              </p>
            </div>
          )}

          <button className="btn btn-primary w-full py-3.5 text-base font-bold" onClick={go}>
            START →
          </button>
        </section>
      )}
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense>
      <PlayWizard />
    </Suspense>
  );
}
