'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MECHANIC_META, WORLDS, getDefinition } from '@guess-it/content';
import { decodeChallenge } from '@/lib/challenge';
import { useProfile, useSession } from '@/lib/store';

function ChallengeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const startChallenge = useSession((s) => s.startChallenge);
  const history = useProfile((s) => s.history);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => decodeChallenge(params.get('c') ?? ''), [params]);

  if (!payload) {
    return (
      <main className="flex flex-col items-center gap-4 pt-24">
        <p className="text-4xl">🔗</p>
        <p style={{ color: 'var(--text-dim)' }}>This challenge link is broken or incomplete.</p>
        <Link href="/" className="btn btn-primary px-8 py-3 text-sm font-bold">
          GO HOME
        </Link>
      </main>
    );
  }

  const def = getDefinition(payload.d, payload.w, payload.df);
  const world = WORLDS.find((w) => w.id === payload.w);
  const played = history.find((h) => h.id === payload.s);

  return (
    <main className="flex flex-col gap-4 pt-10">
      <div className="card p-6 text-center" style={{ borderColor: 'var(--accent)' }}>
        <p className="text-4xl">⚔️</p>
        <h1 className="mt-2 text-xl font-extrabold">{payload.n} challenged you!</h1>
        {def && (
          <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
            {world?.emoji} {world?.name} · {MECHANIC_META[def.mechanic].name} · {payload.df}
          </p>
        )}
        <p className="mt-3 text-xs" style={{ color: 'var(--text-dim)' }}>
          Same puzzle, same rules. Their score stays hidden until you finish.
        </p>

        {played ? (
          <div className="card-2 mt-4 p-4">
            <p className="text-sm font-bold">You already played this one</p>
            <p className="mt-2 text-sm">
              You: <b className="digits">{played.score}</b> · {payload.n}:{' '}
              <b className="digits">{payload.sc}</b>
            </p>
            <p className="mt-1 text-sm font-bold" style={{ color: played.score >= payload.sc ? 'var(--accent-2)' : 'var(--danger)' }}>
              {played.score > payload.sc ? '🏆 You win!' : played.score === payload.sc ? '🤝 Dead heat!' : `${payload.n} takes it.`}
            </p>
          </div>
        ) : (
          <button
            className="btn btn-primary mt-4 w-full py-3.5 text-base font-bold"
            onClick={() => {
              const r = startChallenge(payload);
              if (r === 'ok') router.push('/game');
              else if (r === 'invalid') setError('This challenge references a puzzle this version doesn’t have. Ask your friend to update!');
            }}
          >
            ACCEPT CHALLENGE
          </button>
        )}
        {error && (
          <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
      </div>

      <Link href="/" className="text-center text-xs underline" style={{ color: 'var(--text-dim)' }}>
        What is GUESS IT?
      </Link>
    </main>
  );
}

export default function ChallengePage() {
  return (
    <Suspense>
      <ChallengeInner />
    </Suspense>
  );
}
