import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateSecret } from '@guess-it/engine';
import { eloUpdate } from '../src/elo';
import { RoomManager, type Player } from '../src/rooms';
import { INITIAL_RATING, JsonFileStore } from '../src/storage';
import type { ServerMsg } from '../src/protocol';

function makePlayer(name: string, authId?: string): Player & { inbox: ServerMsg[] } {
  const inbox: ServerMsg[] = [];
  return { id: `id-${name}`, name, authId, inbox, send: (m) => inbox.push(m) };
}

function last<T extends ServerMsg['type']>(p: { inbox: ServerMsg[] }, type: T) {
  return [...p.inbox].reverse().find((m) => m.type === type) as Extract<ServerMsg, { type: T }> | undefined;
}

async function storeWith(...players: { id: string; name: string }[]) {
  const store = new JsonFileStore(mkdtempSync(join(tmpdir(), 'guessit-')));
  for (const p of players) await store.upsertPlayer({ ...p, createdAt: 1 });
  return store;
}

describe('elo math', () => {
  it('equal ratings: winner +16, loser -16 (K=32)', () => {
    expect(eloUpdate(1000, 1000, 1)).toEqual([1016, 984]);
  });
  it('upsets pay more', () => {
    const [underdog] = eloUpdate(1000, 1200, 1);
    expect(underdog - 1000).toBeGreaterThan(16);
  });
  it('draws move ratings toward each other', () => {
    const [a, b] = eloUpdate(1200, 1000, 0.5);
    expect(a).toBeLessThan(1200);
    expect(b).toBeGreaterThan(1000);
  });
});

describe('quick match', () => {
  it('first player waits; second player triggers an instant race', () => {
    const mgr = new RoomManager(() => 0.1);
    const a = makePlayer('Riya');
    const b = makePlayer('Arun');
    mgr.quickmatch(a);
    expect(last(a, 'searching')).toBeTruthy();
    mgr.quickmatch(b);
    expect(last(a, 'game_start')?.opponentName).toBe('Arun');
    expect(last(b, 'game_start')?.opponentName).toBe('Riya');
  });

  it('leaving the queue cancels the search', () => {
    const mgr = new RoomManager(() => 0.1);
    const a = makePlayer('Riya');
    const b = makePlayer('Arun');
    mgr.quickmatch(a);
    mgr.leave(a.id);
    mgr.quickmatch(b);
    expect(last(b, 'searching')).toBeTruthy();
    expect(last(b, 'game_start')).toBeUndefined();
  });

  it('a player cannot match with themselves', () => {
    const mgr = new RoomManager(() => 0.1);
    const a = makePlayer('Riya');
    mgr.quickmatch(a);
    mgr.quickmatch(a);
    expect(last(a, 'game_start')).toBeUndefined();
  });
});

describe('rated races', () => {
  it('authenticated racers gain/lose Elo on the result', async () => {
    const store = await storeWith({ id: 'auth-riya', name: 'Riya' }, { id: 'auth-arun', name: 'Arun' });
    const mgr = new RoomManager(() => 0.05, store); // 0.05 → EXACT_NUMBER quickmatch config
    const riya = makePlayer('Riya', 'auth-riya');
    const arun = makePlayer('Arun', 'auth-arun');
    mgr.quickmatch(riya);
    mgr.quickmatch(arun);
    const room = mgr.roomOf(riya.id)!;
    const secret = generateSecret(room.seed!);
    await mgr.action(arun.id, 'guess', secret);

    const arunOver = last(arun, 'game_over')!;
    const riyaOver = last(riya, 'game_over')!;
    expect(arunOver.you.rating).toBe(INITIAL_RATING + 16);
    expect(arunOver.you.ratingDelta).toBe(16);
    expect(riyaOver.you.rating).toBe(INITIAL_RATING - 16);
    expect(await store.getRating('auth-arun')).toBe(1016);
    expect(await store.getRating('auth-riya')).toBe(984);
  });

  it('anonymous racers are never rated', async () => {
    const store = await storeWith();
    const mgr = new RoomManager(() => 0.05, store);
    const riya = makePlayer('Riya'); // no tokens
    const arun = makePlayer('Arun');
    mgr.quickmatch(riya);
    mgr.quickmatch(arun);
    const room = mgr.roomOf(riya.id)!;
    await mgr.action(arun.id, 'guess', generateSecret(room.seed!));
    expect(last(arun, 'game_over')!.you.rating).toBeUndefined();
  });

  it('mid-race quit costs the leaver rating (walkover)', async () => {
    const store = await storeWith({ id: 'auth-riya', name: 'Riya' }, { id: 'auth-arun', name: 'Arun' });
    const mgr = new RoomManager(() => 0.05, store);
    const riya = makePlayer('Riya', 'auth-riya');
    const arun = makePlayer('Arun', 'auth-arun');
    mgr.quickmatch(riya);
    mgr.quickmatch(arun);
    mgr.leave(arun.id);
    await new Promise((r) => setTimeout(r, 10)); // rating write is async on walkover
    expect(await store.getRating('auth-riya')).toBe(1016);
    expect(await store.getRating('auth-arun')).toBe(984);
    expect(last(riya, 'game_over')!.outcome).toBe('WALKOVER');
  });
});
