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
