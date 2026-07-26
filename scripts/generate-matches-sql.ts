// Regenerates the `matches` seed SQL from lib/data/fixtures.ts.
// Run with: npx tsx scripts/generate-matches-sql.ts
// Paste the output over the seed section of supabase/migrations/0001_social.sql
// whenever fixtures change, then re-run it in the Supabase SQL editor.

import { FIXTURES } from '../lib/data/fixtures';

// Fixtures carry no time of day; assume the 19:30 IST evening start (14:00 UTC).
// Calls lock at this time via RLS, so it only needs to be roughly right.
const START_TIME_UTC = 'T14:00:00Z';

const rows = FIXTURES.map((f) => {
  const startsAt = `${f.date}${START_TIME_UTC}`;
  return `  ('${f.id}', '${f.team1Id}', '${f.team2Id}', '${startsAt}', ${f.isCompleted})`;
});

console.log(`insert into public.matches (id, team1_id, team2_id, starts_at, is_completed) values
${rows.join(',\n')}
on conflict (id) do update set
  team1_id = excluded.team1_id,
  team2_id = excluded.team2_id,
  starts_at = excluded.starts_at,
  is_completed = excluded.is_completed;`);
