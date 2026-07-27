import { Fixture } from '@/lib/types';

// The fixture dataset is a season snapshot (dates may all be in the past
// relative to the real clock), so match state comes from the data itself,
// never from Date.now().

// Calls lock once the result is recorded. Mirrors the RLS
// "call before start" policy (matches.is_completed).
export function isMatchLocked(fixture: Fixture): boolean {
  return fixture.isCompleted;
}

// A match with scores but no recorded result is treated as in play.
export function isMatchLive(fixture: Fixture): boolean {
  return !fixture.isCompleted && Boolean(fixture.score_1 || fixture.score_2);
}
