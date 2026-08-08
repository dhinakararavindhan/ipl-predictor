'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AI_CHARACTERS,
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

function PlayWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const start = useSession((s) => s.start);
  const firstGame = useProfile((s) => s.games === 0);

  const [world, setWorld] = useState<string | null>(params.get('world'));
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [versus, setVersus] = useState(params.get('mode') === 'vs_ai');
  const [aiCharacter, setAiCharacter] = useState<AiCharacterId>('machine');
  const [aiLevel, setAiLevel] = useState<AiLevel>(firstGame ? 'ROOKIE' : 'MEDIUM');

  const go = () => {
    if (!world || !mechanic) return;
    const ok = start({
      world,
      mechanic,
      difficulty,
      mode: versus && supportsVersus(mechanic) ? 'vs_ai' : 'solo',
      aiCharacter,
      // First-ever versus game always starts at Rookie (AI Spec §4.4)
      aiLevel: firstGame ? 'ROOKIE' : aiLevel,
    });
    if (ok) router.push('/game');
  };

  return (
    <main className="flex flex-col gap-5 pt-8">
      <h1 className="text-2xl font-extrabold">Pick your game</h1>

      {/* Step 1: world */}
      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
          1 · WORLD
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

      {/* Step 2: mechanic */}
      {world && (
        <section className="pop-in">
          <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
            2 · GAME
          </h2>
          <div className="flex flex-col gap-2">
            {mechanicsForWorld(world).map((m) => (
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
          </div>
        </section>
      )}

      {/* Step 3: difficulty + opponent */}
      {world && mechanic && (
        <section className="pop-in flex flex-col gap-4">
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
              3 · DIFFICULTY
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

          {supportsVersus(mechanic) && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-dim)' }}>
                  OPPONENT
                </h2>
                <button className="chip px-3 py-1 text-xs font-semibold" data-active={versus} onClick={() => setVersus(!versus)}>
                  {versus ? '🤖 AI Battle ON' : 'Solo (tap for AI)'}
                </button>
              </div>
              {versus && (
                <div className="flex flex-col gap-2">
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
