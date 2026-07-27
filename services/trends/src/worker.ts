// The Stands — trends service (downstream consumer)
// Maintains per-match aggregates in match_stats from chant events.
// Idempotent: every event triggers a recount, never a blind increment,
// so at-least-once delivery can't drift the numbers.

import type { SupabaseClient } from '@supabase/supabase-js';
import { BusEvent, consumeEvents, getAdminSupabase } from '@thestands/core';

const intervalSeconds = Number(process.env.TRENDS_INTERVAL_SECONDS || 60);

async function recount(supabase: SupabaseClient, matchId: string) {
  const { count, error } = await supabase
    .from('chants')
    .select('*', { count: 'exact', head: true })
    .eq('match_id', matchId);
  if (error) throw new Error(error.message);
  const { error: upsertError } = await supabase.from('match_stats').upsert(
    { match_id: matchId, chant_count: count ?? 0, updated_at: new Date().toISOString() },
    { onConflict: 'match_id' }
  );
  if (upsertError) throw new Error(upsertError.message);
}

async function tick() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    console.error('[trends] missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exitCode = 1;
    return false;
  }
  // batch the recounts: one per distinct match seen in this sweep
  const touched = new Set<string>();
  const result = await consumeEvents(
    supabase,
    'trends',
    async (event: BusEvent) => {
      if (event.payload?.match_id) touched.add(event.payload.match_id);
    },
    { topics: ['chant.posted', 'chant.deleted'] }
  );
  if (result.error) {
    console.error(`[trends] error at cursor ${result.lastEventId}: ${result.error}`);
    return false;
  }
  for (const matchId of touched) {
    await recount(supabase, matchId);
  }
  if (result.processed > 0) {
    console.log(
      `[trends] processed ${result.processed} events, recounted ${touched.size} matches → cursor ${result.lastEventId}`
    );
  }
  return true;
}

const once = process.argv.includes('--once');
console.log(`[trends] starting${once ? ' (single run)' : ` — every ${intervalSeconds}s`}`);
const ok = await tick();
if (!once) {
  setInterval(tick, intervalSeconds * 1000);
} else if (!ok) {
  process.exit(1);
}
