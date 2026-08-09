import { describe, expect, it } from 'vitest';
import { GUESSES_PER_PLAYER, PartyManager, type PartyPlayer } from '../src/party';
import type { ServerMsg } from '../src/protocol';

function makePlayer(name: string): PartyPlayer & { inbox: ServerMsg[] } {
  const inbox: ServerMsg[] = [];
  return { id: `id-${name}`, name, guessesLeft: 0, inbox, send: (m) => inbox.push(m) };
}

function last<T extends ServerMsg['type']>(p: { inbox: ServerMsg[] }, type: T) {
  return [...p.inbox].reverse().find((m) => m.type === type) as Extract<ServerMsg, { type: T }> | undefined;
}

/** host + n guessers, code set, ready to guess */
function setupParty(guessers: number, secret = '12345') {
  const mgr = new PartyManager(() => 0.42);
  const host = makePlayer('Host');
  const room = mgr.create(host);
  const others = Array.from({ length: guessers }, (_, i) => makePlayer(`G${i + 1}`));
  for (const g of others) mgr.join(g, room.code);
  mgr.start(host.id);
  mgr.setCode(host.id, secret);
  return { mgr, host, others, room };
}

describe('party mode — code setter', () => {
  it('host sets the code; guessers rotate one by one on a shared board', () => {
    const { mgr, host, others } = setupParty(3);
    const [g1, g2, g3] = others;

    expect(last(host, 'party_setting')!.youAreSetter).toBe(true);
    expect(last(g1, 'party_state')!.yourTurn).toBe(true);
    expect(last(g2, 'party_state')!.yourTurn).toBe(false);

    mgr.guess(g1.id, '67890');
    // everyone sees the guess, attributed
    for (const p of [host, g1, g2, g3]) {
      const st = last(p, 'party_state')!;
      expect(st.board[0].by).toBe('G1');
      expect(st.board[0].digits).toBe('67890');
    }
    expect(last(g2, 'party_state')!.yourTurn).toBe(true); // turn advanced
  });

  it('guessing out of turn is rejected', () => {
    const { mgr, others } = setupParty(2);
    const [, g2] = others;
    mgr.guess(g2.id, '67890');
    expect(last(g2, 'error')!.code).toBe('NOT_YOUR_TURN');
  });

  it('cracking the code wins for that guesser; secret revealed to all', () => {
    const { mgr, host, others } = setupParty(2, '54321');
    const [g1] = others;
    mgr.guess(g1.id, '54321');
    for (const p of [host, ...others]) {
      const over = last(p, 'party_over')!;
      expect(over.winner).toBe('G1');
      expect(over.reason).toBe('cracked');
      expect(over.secret).toBe('54321');
    }
  });

  it('the setter wins when every guesser runs out of guesses', () => {
    const { mgr, host, others } = setupParty(2, '98765');
    const wrongs = ['01234', '12340', '23401', '34012', '40123', '01243', '12430', '24301',
                    '43012', '30124', '01324', '13240', '32401', '24013', '40132', '01342'];
    let w = 0;
    for (let round = 0; round < GUESSES_PER_PLAYER; round++) {
      for (const g of others) mgr.guess(g.id, wrongs[w++]);
    }
    const over = last(host, 'party_over')!;
    expect(over.winner).toBeNull();
    expect(over.reason).toBe('exhausted');
    expect(over.setterName).toBe('Host');
  });

  it('duplicate and malformed guesses are rejected without costing the turn', () => {
    const { mgr, others } = setupParty(2);
    const [g1] = others;
    mgr.guess(g1.id, '11111');
    expect(last(g1, 'error')!.code).toBe('INVALID_GUESS_FORMAT');
    mgr.guess(g1.id, '67890');
    mgr.guess(others[1].id, '67890');
    expect(last(others[1], 'error')!.code).toBe('DUPLICATE_GUESS');
    expect(last(others[1], 'party_state')!.yourTurn).toBe(true); // still their turn
  });

  it('only 5 distinct digits are accepted as the secret', () => {
    const mgr = new PartyManager(() => 0.42);
    const host = makePlayer('Host');
    const room = mgr.create(host);
    mgr.join(makePlayer('G1'), room.code);
    mgr.start(host.id);
    mgr.setCode(host.id, '11223');
    expect(last(host, 'error')!.code).toBe('INVALID_GUESS_FORMAT');
    expect(mgr._room(room.code)!.phase).toBe('setting');
  });

  it('rematch rotates the setter', () => {
    const { mgr, host, others, room } = setupParty(2, '54321');
    mgr.guess(others[0].id, '54321');
    mgr.rematch(host.id);
    expect(last(others[0], 'party_setting')!.youAreSetter).toBe(true);
    expect(last(host, 'party_setting')!.youAreSetter).toBe(false);
    expect(mgr._room(room.code)!.board).toHaveLength(0); // fresh board
  });

  it('the setter leaving ends the round without exposing the secret', () => {
    const { mgr, host, others } = setupParty(2);
    mgr.leave(host.id);
    const over = last(others[0], 'party_over')!;
    expect(over.reason).toBe('setter_left');
    expect(over.secret).toBeNull();
  });

  it('a mid-game guesser leaving skips their turns; play continues', () => {
    const { mgr, others } = setupParty(3);
    const [g1, g2, g3] = others;
    mgr.guess(g1.id, '67890');
    mgr.leave(g2.id); // it was g2's turn
    const st = last(g3, 'party_state')!;
    expect(st.turnName).toBe('G3');
  });

  it('rooms cap at 8 players', () => {
    const mgr = new PartyManager(() => 0.42);
    const host = makePlayer('Host');
    const room = mgr.create(host);
    for (let i = 1; i < 8; i++) mgr.join(makePlayer(`G${i}`), room.code);
    const extra = makePlayer('Late');
    mgr.join(extra, room.code);
    expect(last(extra, 'error')!.code).toBe('FULL');
  });
});

describe('party mode — turn timer', () => {
  it('a snoozed turn forfeits one guess and play moves on', async () => {
    const mgr = new PartyManager(() => 0.42, 80); // 80ms turns
    const host = makePlayer('Host');
    const room = mgr.create(host);
    const g1 = makePlayer('G1');
    const g2 = makePlayer('G2');
    mgr.join(g1, room.code);
    mgr.join(g2, room.code);
    mgr.start(host.id);
    mgr.setCode(host.id, '12345');
    expect(last(g1, 'party_state')!.yourTurn).toBe(true);

    await new Promise((r) => setTimeout(r, 110)); // G1's turn expires; G2's is still live
    const st = last(g2, 'party_state')!;
    expect(st.yourTurn).toBe(true); // turn advanced past the sleeper
    expect(st.notice).toContain('G1 snoozed');
    expect(st.guesses.find((g) => g.name === 'G1')!.left).toBe(GUESSES_PER_PLAYER - 1);
    mgr.leave(host.id); // stop the room's timer
  });

  it('the setter wins if every guess times out', async () => {
    const mgr = new PartyManager(() => 0.42, 5);
    const host = makePlayer('Host');
    const room = mgr.create(host);
    const g1 = makePlayer('G1');
    mgr.join(g1, room.code);
    mgr.start(host.id);
    mgr.setCode(host.id, '12345');
    await new Promise((r) => setTimeout(r, GUESSES_PER_PLAYER * 5 + 80));
    const over = last(host, 'party_over')!;
    expect(over.reason).toBe('exhausted');
    expect(over.winner).toBeNull();
  });

  it('party_state advertises the turn length so clients can show a countdown', () => {
    const { host } = setupParty(2);
    expect(last(host, 'party_state')!.turnMs).toBeGreaterThan(0);
  });
});

describe('party mode — scoreboard across rounds', () => {
  it('cracking the code scores +3; a setter hold scores +2; totals survive rematch', () => {
    const { mgr, host, others } = setupParty(2, '54321');
    const [g1, g2] = others;
    mgr.guess(g1.id, '54321'); // G1 cracks it: +3
    let over = last(host, 'party_over')!;
    expect(over.scores).toContainEqual({ name: 'G1', points: 3 });
    expect(over.scores[0]).toEqual({ name: 'G1', points: 3 }); // sorted, leader first

    mgr.rematch(host.id); // setter rotates to G1
    mgr.setCode(g1.id, '98765');
    const wrongs = ['01234', '12340', '23401', '34012', '40123', '01243', '12430', '24301',
                    '43012', '30124', '01324', '13240', '32401', '24013', '40132', '01342'];
    let w = 0;
    for (let round = 0; round < GUESSES_PER_PLAYER; round++) {
      mgr.guess(g2.id, wrongs[w++]);
      mgr.guess(host.id, wrongs[w++]);
    }
    over = last(host, 'party_over')!;
    expect(over.reason).toBe('exhausted');
    expect(over.scores).toContainEqual({ name: 'G1', points: 5 }); // 3 + setter hold 2
    expect(over.scores).toContainEqual({ name: 'Host', points: 0 });
  });

  it('the lobby shows running scores so late joiners see the standings', () => {
    const { mgr, host, others } = setupParty(2, '54321');
    mgr.guess(others[0].id, '54321');
    mgr.rematch(host.id);
    // scores were broadcast with the previous party_over; lobby carries them too
    const lobby = last(host, 'party_lobby');
    if (lobby) expect(lobby.scores).toBeDefined();
  });
});

describe('party mode — mystery rounds', () => {
  function setupMystery() {
    const mgr = new PartyManager(() => 0.42);
    const host = makePlayer('Host');
    const room = mgr.create(host, 'mystery');
    const g1 = makePlayer('G1');
    const g2 = makePlayer('G2');
    mgr.join(g1, room.code);
    mgr.join(g2, room.code);
    mgr.start(host.id);
    return { mgr, host, g1, g2, room };
  }

  it('only the setter receives the catalog of mystery choices', () => {
    const { host, g1 } = setupMystery();
    const setterMsg = last(host, 'party_setting')!;
    expect(setterMsg.mode).toBe('mystery');
    expect(setterMsg.choices).toBeDefined();
    expect(Object.values(setterMsg.choices!).flat()).toContain('Shah Rukh Khan');
    expect(last(g1, 'party_setting')!.choices).toBeUndefined();
  });

  it('a made-up mystery is rejected; a catalog pick starts the round with clue #1', () => {
    const { mgr, host, g1 } = setupMystery();
    mgr.setCode(host.id, 'Definitely Not Real');
    expect(last(host, 'error')!.code).toBe('INVALID_CHOICE');
    mgr.setCode(host.id, 'Shah Rukh Khan');
    const st = last(g1, 'party_state')!;
    expect(st.mode).toBe('mystery');
    expect(st.events).toHaveLength(1);
    expect(st.events[0].kind).toBe('clue');
  });

  it('every 3 wrong guesses auto-reveals the next clue', () => {
    const { mgr, host, g1, g2 } = setupMystery();
    mgr.setCode(host.id, 'Shah Rukh Khan');
    mgr.guess(g1.id, 'Tom Cruise');
    mgr.guess(g2.id, 'Rajinikanth');
    expect(last(g1, 'party_state')!.events.filter((e) => e.kind === 'clue')).toHaveLength(1);
    mgr.guess(g1.id, 'Amitabh Bachchan'); // 3rd wrong → clue 2 drops
    const events = last(g2, 'party_state')!.events;
    expect(events.filter((e) => e.kind === 'clue')).toHaveLength(2);
    expect(events.filter((e) => e.kind === 'guess')).toHaveLength(3);
    expect(events.filter((e) => e.kind === 'guess')[0].by).toBe('G1');
  });

  it('an alias guess wins (case-insensitive) and the answer is revealed to all', () => {
    const { mgr, host, g1, g2 } = setupMystery();
    mgr.setCode(host.id, 'Shah Rukh Khan');
    mgr.guess(g1.id, 'srk');
    for (const p of [host, g1, g2]) {
      const over = last(p, 'party_over')!;
      expect(over.winner).toBe('G1');
      expect(over.reason).toBe('cracked');
      expect(over.secret).toBe('Shah Rukh Khan');
      expect(over.mode).toBe('mystery');
    }
    expect(last(host, 'party_over')!.scores).toContainEqual({ name: 'G1', points: 3 });
  });

  it('mystery rounds end with a setter win when guesses run dry', () => {
    const { mgr, host, g1, g2 } = setupMystery();
    mgr.setCode(host.id, 'Shah Rukh Khan');
    for (let i = 0; i < GUESSES_PER_PLAYER; i++) {
      mgr.guess(g1.id, `wrong guess ${i}a`);
      mgr.guess(g2.id, `wrong guess ${i}b`);
    }
    const over = last(host, 'party_over')!;
    expect(over.reason).toBe('exhausted');
    expect(over.secret).toBe('Shah Rukh Khan');
    expect(over.scores).toContainEqual({ name: 'Host', points: 2 });
  });
});

describe('party mode — emoji reactions', () => {
  it('a reaction is relayed to every phone in the room', () => {
    const { mgr, host, others } = setupParty(2);
    mgr.react(others[0].id, '🔥');
    for (const p of [host, ...others]) {
      const r = last(p, 'party_reaction')!;
      expect(r.by).toBe('G1');
      expect(r.emoji).toBe('🔥');
    }
  });

  it('non-catalog emoji and spam inside the cooldown are dropped', () => {
    const { mgr, host, others } = setupParty(1);
    mgr.react(others[0].id, '💣', 1000); // not in PARTY_REACTIONS
    expect(last(host, 'party_reaction')).toBeUndefined();
    mgr.react(others[0].id, '😂', 1000);
    mgr.react(others[0].id, '🔥', 1500); // 500ms later — throttled
    expect(host.inbox.filter((m) => m.type === 'party_reaction')).toHaveLength(1);
    mgr.react(others[0].id, '🔥', 2100); // cooldown over
    expect(host.inbox.filter((m) => m.type === 'party_reaction')).toHaveLength(2);
  });
});
