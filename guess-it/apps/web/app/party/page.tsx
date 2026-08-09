'use client';

/**
 * 🎪 Party Mode — Code Setter. One player sets a secret 5-digit code; up to
 * seven others take turns guessing on a shared board. Crack it and you win;
 * outlast everyone and the Setter wins.
 */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { DigitMark } from '@guess-it/engine';
import { REALTIME_URL } from '@/lib/online';
import { useParty } from '@/lib/party';
import { sfx } from '@/lib/sound';
import { useProfile } from '@/lib/store';
import { PartyKeypad } from '@/components/PartyKeypad';

function markStyle(m: DigitMark) {
  return m === 'EXACT'
    ? { background: 'var(--accent-2)', color: '#04291f' }
    : m === 'MISPLACED'
      ? { background: 'var(--warn)', color: '#3a2600' }
      : { background: 'var(--surface-2)', color: 'var(--text-dim)' };
}

export default function PartyPage() {
  const party = useParty();
  const username = useProfile((s) => s.username);
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const lastNonce = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (party.errorNonce !== lastNonce.current && party.error) {
      lastNonce.current = party.errorNonce;
      setToast(party.error);
      const t = setTimeout(() => setToast(null), 2600);
      return () => clearTimeout(t);
    }
  }, [party.errorNonce, party.error]);

  useEffect(() => () => useParty.getState().leave(), []);

  useEffect(() => {
    if (party.phase === 'over' && party.over) {
      const iWon = party.over.winner !== null && party.players.some((p) => p.isYou && p.name === party.over!.winner);
      if (iWon || (party.over.winner === null && party.youAreSetter)) sfx.win();
      else sfx.lose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [party.phase]);

  if (!mounted) return null;

  if (!REALTIME_URL) {
    return (
      <main className="flex flex-col gap-4 pt-10">
        <h1 className="text-2xl font-bold">🎪 Party Mode</h1>
        <div className="card p-5">
          <p className="text-sm font-bold">Game server not connected yet</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
            Party mode runs on the game server. Deploy it (free) — steps in guess-it/DISTRIBUTION.md.
          </p>
        </div>
        <Link href="/" className="btn btn-ghost py-3 text-center text-sm font-bold">
          HOME
        </Link>
      </main>
    );
  }

  const board = (
    <div className="flex flex-col gap-1.5">
      {party.board.map((row, i) => (
        <div key={i} className={`flex items-center justify-center gap-1.5 ${i === party.board.length - 1 ? 'pop-in' : ''}`}>
          <span className="w-14 truncate text-right text-[10px] font-bold" style={{ color: 'var(--text-dim)' }}>
            {row.by}
          </span>
          {row.digits.split('').map((d, j) => (
            <span key={j} className="digits flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold" style={markStyle(row.perDigit[j])}>
              {d}
            </span>
          ))}
          <span className="w-10 text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {row.exact}E {row.misplaced}M
          </span>
        </div>
      ))}
      {party.board.length === 0 && (
        <p className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
          No guesses yet — the board fills up as players take turns.
        </p>
      )}
    </div>
  );

  // ---------- guessing ----------
  if (party.phase === 'guessing') {
    return (
      <main className="flex flex-col gap-4 pt-6">
        <div className="flex items-center justify-between">
          <button className="btn btn-ghost h-9 w-9 text-sm" onClick={() => party.leave()} aria-label="Leave party">
            ✕
          </button>
          <div className="text-center">
            <p className="text-sm font-bold">🎪 Code Setter</p>
            <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
              {party.setterName.toUpperCase()} SET THE CODE
            </p>
          </div>
          <span className="w-9" />
        </div>

        <div className="card-2 px-4 py-2.5 text-center" style={{ borderColor: party.yourTurn ? 'var(--accent)' : 'var(--border)' }}>
          <p className="text-sm font-bold">
            {party.yourTurn ? '🎯 Your turn — crack the code!' : party.youAreSetter ? `😼 Watch them struggle, ${party.setterName}` : `⌛ ${party.turnName}'s turn`}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {party.guesses.map((g) => `${g.name}: ${g.left}`).join(' · ')} guesses left
          </p>
        </div>

        {board}

        {!party.youAreSetter && <PartyKeypad label="GUESS" onSubmit={(d) => party.guess(d)} disabled={!party.yourTurn} />}

        {toast && (
          <p className="shake text-center text-sm" style={{ color: 'var(--warn)' }}>
            {toast}
          </p>
        )}
        {party.notice && (
          <p className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            {party.notice}
          </p>
        )}
      </main>
    );
  }

  // ---------- setting ----------
  if (party.phase === 'setting') {
    return (
      <main className="flex flex-col gap-4 pt-10">
        <h1 className="text-center text-xl font-bold">🎪 Round start</h1>
        {party.youAreSetter ? (
          <>
            <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
              <b style={{ color: 'var(--text)' }}>You are the Setter.</b> Pick a secret code of 5
              different digits — if nobody cracks it, you win the round.
            </p>
            <PartyKeypad label="SET CODE 🤫" onSubmit={(d) => party.setCode(d)} />
          </>
        ) : (
          <p className="animate-pulse text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            {party.setterName} is choosing a secret code…
          </p>
        )}
        {toast && (
          <p className="text-center text-sm" style={{ color: 'var(--warn)' }}>
            {toast}
          </p>
        )}
      </main>
    );
  }

  // ---------- over ----------
  if (party.phase === 'over' && party.over) {
    const o = party.over;
    const headline =
      o.reason === 'cracked'
        ? `🏆 ${o.winner} CRACKED IT!`
        : o.reason === 'exhausted'
          ? `😼 ${o.setterName} WINS — nobody cracked it`
          : o.reason === 'setter_left'
            ? 'The Setter left the party'
            : 'Not enough players left';
    return (
      <main className="flex flex-col gap-4 pt-10">
        <h1 className="text-center text-xl font-extrabold">{headline}</h1>
        {o.secret && (
          <div className="card-2 p-4 text-center">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
              THE SECRET CODE
            </p>
            <p className="digits mt-1 text-3xl font-extrabold" style={{ letterSpacing: '0.2em', color: 'var(--accent)' }}>
              {o.secret}
            </p>
          </div>
        )}
        {board}
        <div className="flex gap-2">
          {o.isHost && (o.reason === 'cracked' || o.reason === 'exhausted') && (
            <button className="btn btn-primary flex-1 py-3 text-sm font-bold" onClick={() => party.rematch()}>
              🔄 NEXT ROUND (new setter)
            </button>
          )}
          <button className="btn btn-ghost flex-1 py-3 text-sm font-bold" onClick={() => party.leave()}>
            LEAVE
          </button>
        </div>
        {!o.isHost && (o.reason === 'cracked' || o.reason === 'exhausted') && (
          <p className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            Waiting for the host to start the next round — the Setter hat rotates!
          </p>
        )}
      </main>
    );
  }

  // ---------- lobby ----------
  if (party.phase === 'lobby') {
    return (
      <main className="flex flex-col gap-4 pt-10">
        <h1 className="text-2xl font-bold">🎪 Party Mode</h1>
        <div className="card p-6 text-center" style={{ borderColor: 'var(--accent)' }}>
          <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
            PARTY CODE — INVITE UP TO 7 FRIENDS
          </p>
          <p className="digits mt-2 text-5xl font-extrabold" style={{ letterSpacing: '0.2em', color: 'var(--accent)' }}>
            {party.code}
          </p>
          <div className="mt-4 flex flex-col gap-1">
            {party.players.map((p) => (
              <p key={p.name} className="text-sm">
                {p.isSetter ? '🤫' : '🎮'} <b>{p.name}</b>
                {p.isYou ? ' (you)' : ''}
                {p.isSetter ? ' — first Setter' : ''}
              </p>
            ))}
          </div>
          {party.canStart ? (
            <button className="btn btn-primary mt-4 w-full py-3.5 text-base font-bold" onClick={() => party.start()}>
              START THE ROUND →
            </button>
          ) : (
            <p className="mt-4 animate-pulse text-sm" style={{ color: 'var(--text-dim)' }}>
              {party.players.length < 2 ? 'Waiting for players…' : 'Waiting for the host to start…'}
            </p>
          )}
        </div>
        <button className="btn btn-ghost py-3 text-sm" onClick={() => party.leave()}>
          Leave party
        </button>
        {toast && (
          <p className="text-center text-sm" style={{ color: 'var(--warn)' }}>
            {toast}
          </p>
        )}
      </main>
    );
  }

  // ---------- menu ----------
  return (
    <main className="flex flex-col gap-4 pt-10">
      <h1 className="text-2xl font-bold">🎪 Party Mode</h1>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        The classic: one of you secretly sets a 5-digit code, everyone else takes turns cracking
        it on a shared board. 2–8 players, everyone on their own phone.
      </p>

      {mode === 'menu' && (
        <div className="flex flex-col gap-3">
          <button className="card p-5 text-left" onClick={() => party.createParty(username)}>
            <p className="text-2xl">🤫</p>
            <p className="mt-1 font-bold">Host a party</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              You set the first secret code
            </p>
          </button>
          <button className="card p-5 text-left" onClick={() => setMode('join')}>
            <p className="text-2xl">🔑</p>
            <p className="mt-1 font-bold">Join a party</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Got a code? Get guessing
            </p>
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex flex-col gap-3">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="PARTY CODE"
            className="card-2 digits px-4 py-4 text-center text-2xl font-bold outline-none"
            style={{ color: 'var(--text)', letterSpacing: '0.3em' }}
          />
          <button
            className="btn btn-primary w-full py-3.5 text-base font-bold disabled:opacity-40"
            disabled={joinCode.length < 5}
            onClick={() => party.joinParty(username, joinCode)}
          >
            JOIN PARTY →
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
      {party.phase === 'connecting' && (
        <p className="animate-pulse text-center text-xs" style={{ color: 'var(--text-dim)' }}>
          Connecting…
        </p>
      )}
    </main>
  );
}
