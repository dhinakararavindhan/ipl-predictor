// The Stands — fixtures-sync worker
// A standalone service that keeps the matches table current: real fixtures
// and results from configured providers, plus the clock pass that flips
// matches live and back. Run it anywhere Node runs (or via the Dockerfile);
// the web app's /api/sync-fixtures cron route is the serverless twin.

import { getAdminSupabase, runSync } from '@thestands/core';

const intervalMinutes = Number(process.env.SYNC_INTERVAL_MINUTES || 5);

async function tick() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    console.error('[fixtures-sync] missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exitCode = 1;
    return false;
  }
  const started = Date.now();
  const summary = await runSync(supabase);
  const ms = Date.now() - started;
  if (summary.ok) {
    console.log(
      `[fixtures-sync] ok in ${ms}ms — upserted=${summary.upserted} live+${summary.wentLive} idle+${summary.wentIdle} provider=${summary.providerRan}`
    );
  } else {
    console.error(`[fixtures-sync] FAILED in ${ms}ms — ${summary.error}`);
  }
  return summary.ok;
}

const once = process.argv.includes('--once');

console.log(`[fixtures-sync] starting${once ? ' (single run)' : ` — every ${intervalMinutes}m`}`);
const ok = await tick();
if (!once) {
  setInterval(tick, intervalMinutes * 60_000);
} else if (!ok) {
  process.exit(1);
}
