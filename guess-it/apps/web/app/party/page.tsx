'use client';

/**
 * 🎪 Party Mode — 2–8 players, everyone on their own phone.
 *   🔢 Code Setter — one player sets a secret 5-digit code; the room takes
 *      turns cracking it on a shared board.
 *   🕵️ Mystery — the Setter picks a secret person/movie/thing; the room
 *      takes turns naming it, and every 3 wrong guesses reveals a new clue.
 * 45s turn timer (snooze = guess forfeited) and a scoreboard across rounds:
 * crack it +3, Setter survives everyone +2.
 */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { DigitMark } from '@guess-it/engine';
import { WORLDS } from '@guess-it/content';
import { REALTIME_URL } from '@/lib/online';
import { useParty, type PartyEvent, type PartyScore } from '@/lib/party';
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

function worldMeta(id: string) {
  return WORLDS.find((w) => w.id === id);
}

/** Live turn countdown bar — restarts whenever the server broadcasts a new turn. */
function TurnCountdown({ turnMs, nonce }: { turnMs: number; nonce: number }) {
  const [left, setLeft] = useState(turnMs);
  useEffect(() => {
    const started = Date.now();
    setLeft(turnMs);
    const t = setInterval(() => setLeft(Math.max(0, turnMs - (Date.now() - started))), 250);
    return () => clearInterval(t);
  }, [turnMs, nonce]);
  const frac = turnMs > 0 ? left / turnMs : 0;
  const secs = Math.ceil(left / 1000);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-linear"
          style={{
            width: `${frac * 100}%`,
            background: frac < 0.25 ? 'var(--warn)' : 'var(--accent)',
          }}
        />
      </div>
      <span className="digits w-8 text-right text-xs font-bold" style={{ color: frac < 0.25 ? 'var(--warn)' : 'var(--text-dim)' }}>
        {secs}s
      </span>
    </div>
  );
}

/** Cross-round scoreboard strip. */
function ScoreStrip({ scores }: { scores: PartyScore[] }) {
  if (!scores.length || scores.every((s) => s.points === 0)) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--text-dim)' }}>
      <span className="font-bold tracking-widest">🏅</span>
      {scores.map((s, i) => (
        <span key={s.name}>
          <b style={i === 0 && s.points > 0 ? { color: 'var(--accent)' } : { color: 'var(--text)' }}>{s.name}</b> {s.points}
        </span>
      ))}
    </div>
  );
}

/** Mystery-mode feed: revealed clues + wrong name guesses, newest last. */
function MysteryFeed({ events }: { events: PartyEvent[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [events.length]);
  return (
    <div className="card-2 flex max-h-64 flex-col gap-1.5 overflow-y-auto p-3">
      {events.map((e, i) => (
        <div key={i} className={i === events.length - 1 ? 'pop-in' : ''}>
          {e.kind === 'clue' ? (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--accent)' }}>
              💡 {e.text}
            </p>
          ) : (
            <p className="px-3 text-xs" style={{ color: 'var(--text-dim)' }}>
              ❌ <b>{e.by}</b>: “{e.text}”
            </p>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

/** Text entry for mystery guesses. */
function MysteryGuessInput({ onSubmit, disabled }: { onSubmit: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setText('');
  };
  return (
    <div className={`flex gap-2 ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 40))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Who / what is it?"
        className="card-2 flex-1 px-4 py-3 text-base outline-none"
        style={{ color: 'var(--text)' }}
      />
      <button className="btn btn-primary px-6 py-3 text-sm font-bold disabled:opacity-40" disabled={!text.trim()} onClick={submit}>
        GUESS
      </button>
    </div>
  );
}

export default function PartyPage() {
  const party = useParty();
  const username = useProfile((s) => s.username);
  const [menu, setMenu] = useState<'menu' | 'join'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [pickWorld, setPickWorld] = useState<string | null>(null);
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

  const isMystery = party.mode === 'mystery';
  const modeTag = isMystery ? '🕵️ Mystery' : '🔢 Code Setter';

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
            <p className="text-sm font-bold">{modeTag}</p>
            <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
              {party.setterName.toUpperCase()} {isMystery ? 'PICKED THE MYSTERY' : 'SET THE CODE'}
            </p>
          </div>
          <span className="w-9" />
        </div>

        <div className="card-2 flex flex-col gap-2 px-4 py-2.5" style={{ borderColor: party.yourTurn ? 'var(--accent)' : 'var(--border)' }}>
          <p className="text-center text-sm font-bold">
            {party.yourTurn
              ? isMystery
                ? '🎯 Your turn — name the mystery!'
                : '🎯 Your turn — crack the code!'
              : party.youAreSetter
                ? `😼 Watch them struggle, ${party.setterName}`
                : `⌛ ${party.turnName}'s turn`}
          </p>
          <TurnCountdown turnMs={party.turnMs} nonce={party.turnNonce} />
          <p className="text-center text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {party.guesses.map((g) => `${g.name}: ${g.left}`).join(' · ')} guesses left
          </p>
        </div>

        <ScoreStrip scores={party.scores} />

        {isMystery ? <MysteryFeed events={party.events} /> : board}

        {!party.youAreSetter &&
          (isMystery ? (
            <MysteryGuessInput onSubmit={(t) => party.guess(t)} disabled={!party.yourTurn} />
          ) : (
            <PartyKeypad label="GUESS" onSubmit={(d) => party.guess(d)} disabled={!party.yourTurn} />
          ))}

        {toast && (
          <p className="shake text-center text-sm" style={{ color: 'var(--warn)' }}>
            {toast}
          </p>
        )}
        {party.notice && (
          <p className="text-center text-xs" style={{ color: 'var(--warn)' }}>
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
        <h1 className="text-center text-xl font-bold">{modeTag} — round start</h1>
        {party.youAreSetter ? (
          isMystery && party.choices ? (
            <>
              <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--text)' }}>You are the Setter.</b> Pick the secret mystery —
                the room gets one clue now, and a new one every 3 wrong guesses.
              </p>
              {pickWorld === null ? (
                <div className="flex flex-col gap-2">
                  {Object.entries(party.choices).map(([world, names]) => {
                    const meta = worldMeta(world);
                    return (
                      <button key={world} className="card flex items-center gap-3 p-4 text-left" onClick={() => setPickWorld(world)}>
                        <span className="text-2xl">{meta?.emoji ?? '🎲'}</span>
                        <span className="flex-1">
                          <span className="block font-bold">{meta?.name ?? world}</span>
                          <span className="block text-xs" style={{ color: 'var(--text-dim)' }}>
                            {names.length} mysteries
                          </span>
                        </span>
                        <span style={{ color: 'var(--accent)' }}>→</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <button className="btn btn-ghost self-start px-3 py-1.5 text-xs" onClick={() => setPickWorld(null)}>
                    ← Worlds
                  </button>
                  <div className="flex max-h-96 flex-wrap gap-2 overflow-y-auto">
                    {(party.choices[pickWorld] ?? []).map((name) => (
                      <button
                        key={name}
                        className="chip px-4 py-2 text-sm font-medium"
                        onClick={() => {
                          party.setCode(name);
                          setPickWorld(null);
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--text)' }}>You are the Setter.</b> Pick a secret code of 5
                different digits — if nobody cracks it, you win the round.
              </p>
              <PartyKeypad label="SET CODE 🤫" onSubmit={(d) => party.setCode(d)} />
            </>
          )
        ) : (
          <p className="animate-pulse text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            {party.setterName} is choosing {isMystery ? 'a secret mystery' : 'a secret code'}…
          </p>
        )}
        <ScoreStrip scores={party.scores} />
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
        ? `🏆 ${o.winner} ${o.mode === 'mystery' ? 'GUESSED IT!' : 'CRACKED IT!'}`
        : o.reason === 'exhausted'
          ? `😼 ${o.setterName} WINS — nobody ${o.mode === 'mystery' ? 'guessed it' : 'cracked it'}`
          : o.reason === 'setter_left'
            ? 'The Setter left the party'
            : 'Not enough players left';
    return (
      <main className="flex flex-col gap-4 pt-10">
        <h1 className="text-center text-xl font-extrabold">{headline}</h1>
        {o.secret && (
          <div className="card-2 p-4 text-center">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
              {o.mode === 'mystery' ? 'THE MYSTERY WAS' : 'THE SECRET CODE'}
            </p>
            <p
              className={`mt-1 font-extrabold ${o.mode === 'mystery' ? 'text-2xl' : 'digits text-3xl'}`}
              style={{ letterSpacing: o.mode === 'mystery' ? undefined : '0.2em', color: 'var(--accent)' }}
            >
              {o.secret}
            </p>
          </div>
        )}
        {party.scores.length > 0 && (
          <div className="card-2 p-4">
            <p className="mb-2 text-center text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
              🏅 PARTY SCOREBOARD · CRACK +3 · SETTER HOLD +2
            </p>
            <div className="flex flex-col gap-1">
              {party.scores.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span>
                    {i === 0 && s.points > 0 ? '👑 ' : ''}
                    <b>{s.name}</b>
                  </span>
                  <span className="digits font-bold" style={{ color: i === 0 && s.points > 0 ? 'var(--accent)' : 'var(--text)' }}>
                    {s.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {o.mode === 'mystery' ? <MysteryFeed events={party.events} /> : board}
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
            {modeTag.toUpperCase()} · PARTY CODE — INVITE UP TO 7 FRIENDS
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
        <ScoreStrip scores={party.scores} />
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
        2–8 players, everyone on their own phone. One of you sets the secret; the room takes turns
        cracking it. 45s per turn, scoreboard across rounds.
      </p>

      {menu === 'menu' && (
        <div className="flex flex-col gap-3">
          <button className="card p-5 text-left" onClick={() => party.createParty(username, 'code')}>
            <p className="text-2xl">🔢</p>
            <p className="mt-1 font-bold">Host: Code Setter</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Set a secret 5-digit code — the room cracks it on a shared board
            </p>
          </button>
          <button className="card p-5 text-left" onClick={() => party.createParty(username, 'mystery')}>
            <p className="text-2xl">🕵️</p>
            <p className="mt-1 font-bold">Host: Mystery</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Pick a secret star, movie or thing — clues drop as guesses miss
            </p>
          </button>
          <button className="card p-5 text-left" onClick={() => setMenu('join')}>
            <p className="text-2xl">🔑</p>
            <p className="mt-1 font-bold">Join a party</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Got a code? Get guessing
            </p>
          </button>
        </div>
      )}

      {menu === 'join' && (
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
          <button className="btn btn-ghost py-2 text-xs" onClick={() => setMenu('menu')}>
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
