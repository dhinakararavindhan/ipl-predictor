// The Stands — notifier service (downstream consumer)
// Listens to the event bus and writes fan-facing inbox rows:
//   match.live       → "your match is live" for callers and supporters
//   match.completed  → "you called it / wrong call" for callers
//   segment.decided  → pulse pick graded for pulse callers
// Idempotent via notifications' unique (user_id, kind, ref).

import type { SupabaseClient } from '@supabase/supabase-js';
import { BusEvent, consumeEvents, getAdminSupabase } from '@thestands/core';

const intervalSeconds = Number(process.env.NOTIFY_INTERVAL_SECONDS || 30);

async function matchLabel(supabase: SupabaseClient, matchId: string): Promise<string> {
  const { data } = await supabase
    .from('matches')
    .select('team1_short, team2_short, team1_id, team2_id')
    .eq('id', matchId)
    .maybeSingle();
  if (!data) return matchId;
  return `${data.team1_short ?? data.team1_id.toUpperCase()} vs ${data.team2_short ?? data.team2_id.toUpperCase()}`;
}

type Row = {
  user_id: string;
  kind: string;
  ref: string;
  title: string;
  body?: string;
  match_id?: string;
};

async function insertAll(supabase: SupabaseClient, rows: Row[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('notifications')
    .upsert(rows, { onConflict: 'user_id,kind,ref', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

async function handle(supabase: SupabaseClient, event: BusEvent) {
  const matchId: string | undefined = event.payload?.match_id;
  if (!matchId) return;

  if (event.topic === 'match.live') {
    const label = await matchLabel(supabase, matchId);
    const [calls, supports] = await Promise.all([
      supabase.from('calls').select('user_id').eq('match_id', matchId),
      supabase.from('supports').select('user_id').eq('match_id', matchId),
    ]);
    const fans = new Set<string>([
      ...(calls.data ?? []).map((r) => r.user_id),
      ...(supports.data ?? []).map((r) => r.user_id),
    ]);
    await insertAll(
      supabase,
      [...fans].map((user_id) => ({
        user_id,
        kind: 'match_live',
        ref: matchId,
        title: `🔴 ${label} is live`,
        body: 'The stands are open — get in there.',
        match_id: matchId,
      }))
    );
  }

  if (event.topic === 'match.completed') {
    const winner: string | null = event.payload?.winner_id ?? null;
    if (!winner) return;
    const label = await matchLabel(supabase, matchId);
    const { data: calls } = await supabase
      .from('calls')
      .select('user_id, predicted_team_id')
      .eq('match_id', matchId);
    await insertAll(
      supabase,
      (calls ?? []).map((call) => ({
        user_id: call.user_id,
        kind: 'call_result',
        ref: matchId,
        title:
          call.predicted_team_id === winner
            ? `✅ You called it — ${label}`
            : `❌ Wrong call — ${label}`,
        body:
          call.predicted_team_id === winner
            ? 'Your call was right. The leaderboard felt that.'
            : 'The crowd giveth… there is always the next match.',
        match_id: matchId,
      }))
    );
  }

  if (event.topic === 'segment.decided') {
    const segment: string = event.payload.segment;
    const winner: string = event.payload.winner_team_id;
    const label = await matchLabel(supabase, matchId);
    const { data: picks } = await supabase
      .from('pulse_calls')
      .select('user_id, predicted_team_id')
      .eq('match_id', matchId)
      .eq('segment', segment);
    await insertAll(
      supabase,
      (picks ?? []).map((pick) => ({
        user_id: pick.user_id,
        kind: 'pulse_result',
        ref: `${matchId}:${segment}`,
        title:
          pick.predicted_team_id === winner
            ? `✅ Pulse hit — ${label}`
            : `❌ Pulse missed — ${label}`,
        body: `Phase ${segment} is decided.`,
        match_id: matchId,
      }))
    );
  }
}

async function tick() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    console.error('[notifier] missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exitCode = 1;
    return false;
  }
  const result = await consumeEvents(supabase, 'notifier', (event) => handle(supabase, event), {
    topics: ['match.live', 'match.completed', 'segment.decided'],
  });
  if (result.error) {
    console.error(`[notifier] error at cursor ${result.lastEventId}: ${result.error}`);
    return false;
  }
  if (result.processed > 0) {
    console.log(`[notifier] processed ${result.processed} events → cursor ${result.lastEventId}`);
  }
  return true;
}

const once = process.argv.includes('--once');
console.log(`[notifier] starting${once ? ' (single run)' : ` — every ${intervalSeconds}s`}`);
const ok = await tick();
if (!once) {
  setInterval(tick, intervalSeconds * 1000);
} else if (!ok) {
  process.exit(1);
}
