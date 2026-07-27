// Regenerates the cricket `matches` seed SQL from lib/data/fixtures.ts.
// Run with: npx tsx scripts/generate-matches-sql.ts
// Uses the full multi-sport column set from 0004_multisport.sql — run the
// output in the SQL editor AFTER all migrations to re-sync cricket fixtures.

import { FIXTURES } from '../lib/data/fixtures';
import { getTeamById } from '../lib/data/teams';

// Fixtures carry no time of day; assume the 19:30 IST evening start (14:00 UTC).
// starts_at is informational — Calls lock via is_completed, not the clock.
const START_TIME_UTC = 'T14:00:00Z';

const q = (s: string | undefined | null) => (s == null ? 'null' : `'${s.replace(/'/g, "''")}'`);

const rows = FIXTURES.map((f) => {
  const t1 = getTeamById(f.team1Id);
  const t2 = getTeamById(f.team2Id);
  const startsAt = `${f.date}${START_TIME_UTC}`;
  return `  ('${f.id}', 'cricket', 'IPL 2026', '${f.team1Id}', '${f.team2Id}', ${q(t1?.name)}, ${q(t2?.name)}, ${q(t1?.shortName)}, ${q(t2?.shortName)}, ${q(t1?.color)}, ${q(t2?.color)}, ${q(f.venue)}, '${startsAt}', ${f.isCompleted}, ${q(f.winnerId ?? null)})`;
});

console.log(`insert into public.matches
  (id, sport, league, team1_id, team2_id, team1_name, team2_name,
   team1_short, team2_short, team1_color, team2_color, venue,
   starts_at, is_completed, winner_id) values
${rows.join(',\n')}
on conflict (id) do update set
  sport = excluded.sport,
  league = excluded.league,
  team1_id = excluded.team1_id,
  team2_id = excluded.team2_id,
  team1_name = excluded.team1_name,
  team2_name = excluded.team2_name,
  team1_short = excluded.team1_short,
  team2_short = excluded.team2_short,
  team1_color = excluded.team1_color,
  team2_color = excluded.team2_color,
  venue = excluded.venue,
  starts_at = excluded.starts_at,
  is_completed = excluded.is_completed,
  winner_id = excluded.winner_id;`);
