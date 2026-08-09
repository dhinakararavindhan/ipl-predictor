import { describe, expect, it } from 'vitest';
import { generateSecret } from '@guess-it/engine';
import { RoomManager, supportsOnline, type Player } from '../src/rooms';
import type { ServerMsg } from '../src/protocol';

function makePlayer(name: string): Player & { inbox: ServerMsg[] } {
  const inbox: ServerMsg[] = [];
  return { id: `id-${name}`, name, inbox, send: (m) => inbox.push(m) };
}

function last<T extends ServerMsg['type']>(p: { inbox: ServerMsg[] }, type: T) {
  return [...p.inbox].reverse().find((m) => m.type === type) as Extract<ServerMsg, { type: T }> | undefined;
}

const CONFIG = { world: 'numbers', mechanic: 'EXACT_NUMBER' as const, difficulty: 'MEDIUM' as const };

describe('live race rooms', () => {
  it('gates mechanics to raceable ones', () => {
    expect(supportsOnline('EXACT_NUMBER')).toBe(true);
    expect(supportsOnline('CLUE_GUESS')).toBe(true);
    expect(supportsOnline('HIGHER_LOWER')).toBe(true);
    expect(supportsOnline('MULTIPLE_CHOICE')).toBe(false);
  });

  it('create → join → start gives both players identical puzzles and safe views', () => {
    const mgr = new RoomManager();
    const riya = makePlayer('Riya');
    const arun = makePlayer('Arun');
    const room = mgr.create(riya, CONFIG);
    mgr.join(arun, room.code);

    const lobby = last(arun, 'lobby')!;
    expect(lobby.players.map((p) => p.name).sort()).toEqual(['Arun', 'Riya']);

    mgr.start(riya.id);
    const r = mgr._room(room.code)!;
    expect(r.status).toBe('racing');
    // same seed → same secret for both boards
    const secret = generateSecret(r.seed!);
    const gsRiya = last(riya, 'game_start')!;
    const gsArun = last(arun, 'game_start')!;
    expect(gsRiya.opponentName).toBe('Arun');
    expect(gsArun.opponentName).toBe('Riya');
    // leakage: neither start view contains the secret
    expect(JSON.stringify(gsRiya.view)).not.toContain(secret);
    expect(JSON.stringify(gsArun.view)).not.toContain(secret);
  });

  it('guesses stream to the opponent as progress, not content', async () => {
    const mgr = new RoomManager();
    const riya = makePlayer('Riya');
    const arun = makePlayer('Arun');
    const room = mgr.create(riya, CONFIG);
    mgr.join(arun, room.code);
    mgr.start(riya.id);
    const secret = generateSecret(mgr._room(room.code)!.seed!);
    const wrong = secret === '01234' ? '56789' : '01234';

    await mgr.action(riya.id, 'guess', wrong);
    const progress = last(arun, 'opponent')!;
    expect(progress.progress.attemptsUsed).toBe(1);
    expect(progress.progress.finished).toBe(false);
    expect(JSON.stringify(progress)).not.toContain(wrong); // counts only, never digits
  });

  it('first correct guess wins the race; loser is frozen with LOSS', async () => {
    const mgr = new RoomManager();
    const riya = makePlayer('Riya');
    const arun = makePlayer('Arun');
    const room = mgr.create(riya, CONFIG);
    mgr.join(arun, room.code);
    mgr.start(riya.id);
    const secret = generateSecret(mgr._room(room.code)!.seed!);

    await mgr.action(arun.id, 'guess', secret);
    const arunOver = last(arun, 'game_over')!;
    const riyaOver = last(riya, 'game_over')!;
    expect(arunOver.outcome).toBe('WIN');
    expect(riyaOver.outcome).toBe('LOSS');
    expect(arunOver.view.result?.answerName).toBe(secret); // answer revealed at the end
    expect(riyaOver.view.result?.answerName).toBe(secret);
    expect(arunOver.you.score).toBeGreaterThan(0);
    expect(mgr._room(room.code)!.status).toBe('over');
  });

  it('invalid guesses return typed errors and cost nothing', async () => {
    const mgr = new RoomManager();
    const riya = makePlayer('Riya');
    const arun = makePlayer('Arun');
    const room = mgr.create(riya, CONFIG);
    mgr.join(arun, room.code);
    mgr.start(riya.id);

    await mgr.action(riya.id, 'guess', '11111');
    const err = last(riya, 'error')!;
    expect(err.code).toBe('INVALID_GUESS_FORMAT');
    expect(arun.inbox.find((m) => m.type === 'opponent')).toBeUndefined();
  });

  it('mid-race disconnect gives the opponent a walkover', async () => {
    const mgr = new RoomManager();
    const riya = makePlayer('Riya');
    const arun = makePlayer('Arun');
    const room = mgr.create(riya, CONFIG);
    mgr.join(arun, room.code);
    mgr.start(riya.id);

    mgr.leave(arun.id);
    await new Promise((r) => setTimeout(r, 10)); // walkover delivery is async (ratings path)
    const over = last(riya, 'game_over')!;
    expect(over.outcome).toBe('WALKOVER');
    expect(over.opponent.name).toBe('Arun');
  });

  it('rematch requires both players and relaunches with a fresh puzzle', async () => {
    const mgr = new RoomManager();
    const riya = makePlayer('Riya');
    const arun = makePlayer('Arun');
    const room = mgr.create(riya, CONFIG);
    mgr.join(arun, room.code);
    mgr.start(riya.id);
    const firstSeed = mgr._room(room.code)!.seed;
    const secret = generateSecret(firstSeed!);
    await mgr.action(arun.id, 'guess', secret);

    mgr.rematch(riya.id);
    expect(last(arun, 'rematch_offer')!.from).toBe('Riya');
    mgr.rematch(arun.id);
    expect(mgr._room(room.code)!.status).toBe('racing');
    expect(mgr._room(room.code)!.seed).not.toBe(firstSeed);
  });

  it('rooms are single-use codes; full rooms reject a third player', () => {
    const mgr = new RoomManager();
    const riya = makePlayer('Riya');
    const arun = makePlayer('Arun');
    const chris = makePlayer('Chris');
    const room = mgr.create(riya, CONFIG);
    mgr.join(arun, room.code);
    expect(() => mgr.join(chris, room.code)).toThrow();
    expect(last(chris, 'error')!.code).toBe('FULL');
  });
});
