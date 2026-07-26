import { Fixture } from '@/lib/types';

// Fixtures carry only a date; assume the 19:30 IST evening start (14:00 UTC).
// Must stay in sync with scripts/generate-matches-sql.ts so the client lock
// mirrors the RLS "call before start" policy.
export function matchStartsAt(fixture: Fixture): Date {
  return new Date(`${fixture.date}T14:00:00Z`);
}

export function hasMatchStarted(fixture: Fixture): boolean {
  return fixture.isCompleted || matchStartsAt(fixture).getTime() <= Date.now();
}
