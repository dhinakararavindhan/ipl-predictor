import { FIXTURES } from '@/lib/data/fixtures';
import { Call } from './types';

export interface Badge {
  emoji: string;
  label: string;
  title: string;
}

export interface CallRecord {
  calls: number;
  decided: number;
  correct: number;
  accuracy: number; // 0..100 over decided calls
  bestStreak: number; // longest run of consecutive correct calls
  currentStreak: number;
}

const fixtureOrder = new Map(FIXTURES.map((f, i) => [f.id, i]));
const results = new Map(
  FIXTURES.filter((f) => f.isCompleted && f.winnerId).map((f) => [f.id, f.winnerId as string])
);

// Score a fan's calls against the static fixture results, in match order so
// streaks mean consecutive decided matches called correctly.
export function computeCallRecord(calls: Pick<Call, 'matchId' | 'predictedTeamId'>[]): CallRecord {
  const ordered = [...calls].sort(
    (a, b) => (fixtureOrder.get(a.matchId) ?? 0) - (fixtureOrder.get(b.matchId) ?? 0)
  );
  let decided = 0;
  let correct = 0;
  let bestStreak = 0;
  let currentStreak = 0;
  for (const call of ordered) {
    const winner = results.get(call.matchId);
    if (!winner) continue;
    decided++;
    if (winner === call.predictedTeamId) {
      correct++;
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  return {
    calls: calls.length,
    decided,
    correct,
    accuracy: decided > 0 ? (correct / decided) * 100 : 0,
    bestStreak,
    currentStreak,
  };
}

export function badgesFor(record: CallRecord, chantCount?: number): Badge[] {
  const badges: Badge[] = [];
  if (record.currentStreak >= 3) {
    badges.push({ emoji: '🔥', label: 'On fire', title: `${record.currentStreak} correct calls in a row` });
  } else if (record.bestStreak >= 3) {
    badges.push({ emoji: '⚡', label: 'Streaker', title: `Best streak: ${record.bestStreak} in a row` });
  }
  if (record.decided >= 5 && record.accuracy >= 70) {
    badges.push({ emoji: '🎯', label: 'Sharpshooter', title: `${record.accuracy.toFixed(0)}% accuracy over ${record.decided} decided calls` });
  }
  if (record.calls >= 20) {
    badges.push({ emoji: '📊', label: 'Season regular', title: `${record.calls} calls made` });
  }
  if (chantCount !== undefined && chantCount >= 10) {
    badges.push({ emoji: '📣', label: 'Voice of the stands', title: `${chantCount} chants` });
  }
  return badges;
}
