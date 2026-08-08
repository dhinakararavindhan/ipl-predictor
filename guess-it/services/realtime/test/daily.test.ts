import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dailyChallenge, dailySeed, utcDateKey } from '@guess-it/content';
import { createGame, generateSecret, playerView, submitGuess } from '@guess-it/engine';
import { DailyApi } from '../src/dailyapi';
import { JsonFileStore } from '../src/storage';
import { issuePlayer, verifyToken } from '../src/auth';

function freshStore(): JsonFileStore {
  return new JsonFileStore(mkdtempSync(join(tmpdir(), 'guessit-')));
}

/** Play the daily to completion via the API, winning if `win`. */
async function playThrough(api: DailyApi, playerId: string, win: boolean, name = 'Tester') {
  const started = await api.start(playerId, name);
  if ('alreadyPlayed' in started) throw new Error('already played');
  const { gameId } = started;
  const dateKey = utcDateKey();
  const { definition } = dailyChallenge(dateKey);

  // the test derives the winning move the same way the server does
  const winningGuess = (() => {
    switch (definition.mechanic) {
      case 'EXACT_NUMBER':
        return generateSecret(dailySeed(dateKey));
      case 'HIGHER_LOWER':
        return String(definition.higherLower!.secret);
      case 'CLUE_GUESS':
        return definition.answer!.name;
      case 'MULTIPLE_CHOICE': {
        // presentation order is seed-shuffled; find the correct presentation index
        const probe = createGame(definition, dailySeed(dateKey), Date.now());
        return String(probe.mc!.order.indexOf(definition.multipleChoice!.correctIndex));
      }
      default:
        throw new Error('unsupported');
    }
  })();

  if (win) {
    return api.action(playerId, gameId, 'guess', winningGuess);
  }
  return api.action(playerId, gameId, 'forfeit');
}

describe('auth tokens', () => {
  it('issues verifiable tokens and rejects tampering', () => {
    const { playerId, token } = issuePlayer();
    expect(verifyToken(token)).toBe(playerId);
    expect(verifyToken(token.slice(0, -4) + 'AAAA')).toBeNull();
    expect(verifyToken('garbage')).toBeNull();
    expect(verifyToken(undefined)).toBeNull();
  });
});

describe('server-authoritative daily', () => {
  it('start → play → win persists a score and ranks it', async () => {
    const store = freshStore();
    const api = new DailyApi(store);
    const p = issuePlayer();
    await store.upsertPlayer({ id: p.playerId, name: 'Riya', createdAt: Date.now() });

    const out = await playThrough(api, p.playerId, true);
    if ('error' in out) throw new Error(out.error);
    expect(out.result).toBeTruthy();
    expect(out.result!.view.result?.outcome).toBe('WON');
    expect(out.result!.rank).toEqual({ rank: 1, total: 1 });
    expect(out.result!.xp.total).toBeGreaterThanOrEqual(300); // correct + daily

    const board = await api.leaderboard(p.playerId);
    expect(board.top[0].isYou).toBe(true);
    expect(board.me?.rank).toBe(1);
  });

  it('one daily per player per date — second start reports alreadyPlayed', async () => {
    const api = new DailyApi(freshStore());
    const p = issuePlayer();
    await playThrough(api, p.playerId, true);
    const again = await api.start(p.playerId, 'Riya');
    expect('alreadyPlayed' in again).toBe(true);
  });

  it('there is no way to submit a score without playing (no endpoint, no session)', async () => {
    const api = new DailyApi(freshStore());
    const p = issuePlayer();
    const forged = await api.action(p.playerId, 'made-up-game-id', 'guess', '12345');
    expect('error' in forged && forged.code).toBe('NOT_FOUND');
    const board = await api.leaderboard(p.playerId);
    expect(board.top).toHaveLength(0);
  });

  it('active daily views never contain the answer', async () => {
    const api = new DailyApi(freshStore());
    const p = issuePlayer();
    const started = await api.start(p.playerId, 'Tester');
    if ('alreadyPlayed' in started) throw new Error('unexpected');
    const dateKey = utcDateKey();
    const { definition } = dailyChallenge(dateKey);
    const needle =
      definition.mechanic === 'EXACT_NUMBER'
        ? generateSecret(dailySeed(dateKey))
        : definition.mechanic === 'HIGHER_LOWER'
          ? String(definition.higherLower!.secret)
          : definition.answer?.name ?? definition.multipleChoice!.options[definition.multipleChoice!.correctIndex];
    const json = JSON.stringify(started.view).toLowerCase();
    expect(started.view.defId).toBe('hidden'); // ids can contain answer slugs
    if (definition.mechanic !== 'MULTIPLE_CHOICE') {
      expect(json).not.toContain(String(needle).toLowerCase());
    } else {
      expect(json).not.toContain('correctindex');
    }
  });

  it('losers rank below winners; ties break by speed', async () => {
    const store = freshStore();
    const api = new DailyApi(store);
    const winner = issuePlayer();
    const loser = issuePlayer();
    await store.upsertPlayer({ id: winner.playerId, name: 'Winner', createdAt: 1 });
    await store.upsertPlayer({ id: loser.playerId, name: 'Loser', createdAt: 2 });
    await playThrough(api, winner.playerId, true, 'Winner');
    await playThrough(api, loser.playerId, false, 'Loser');
    const board = await api.leaderboard(null);
    expect(board.top[0].name).toBe('Winner');
    expect(board.top[1].name).toBe('Loser');
    expect(board.top[0].score).toBeGreaterThan(board.top[1].score);
  });
});

describe('json storage', () => {
  it('persists across instances via the data file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'guessit-'));
    const a = new JsonFileStore(dir);
    await a.upsertPlayer({ id: 'p1', name: 'Riya', createdAt: 1 });
    await a.submitDailyScore('2026-08-08', {
      playerId: 'p1',
      name: 'Riya',
      score: 900,
      outcome: 'WON',
      attemptsUsed: 2,
      durationMs: 30000,
      submittedAt: 1,
    });
    await a.close();
    const b = new JsonFileStore(dir);
    expect((await b.getPlayer('p1'))?.name).toBe('Riya');
    expect((await b.topDaily('2026-08-08', 10))[0].score).toBe(900);
    expect(await b.submitDailyScore('2026-08-08', {
      playerId: 'p1', name: 'Riya', score: 999, outcome: 'WON', attemptsUsed: 1, durationMs: 1, submittedAt: 2,
    })).toBe(false); // once per day survives restart
    await b.close();
  });
});
