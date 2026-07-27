import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { clockLiveWindow, fetchFootballData } from '@/lib/sync/providers';

// Fixture sync worker. Point a cron at this route (vercel.json ships a
// 15-minute schedule) and matches stay current on their own:
//  1. football-data.org fixtures upsert in (when FOOTBALL_DATA_TOKEN is set)
//  2. the clock pass flips is_live from starts_at for every sport
// Protected by CRON_SECRET (Vercel cron sends it as a Bearer token).

async function runSync() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not configured' };
  }

  const summary = { upserted: 0, wentLive: 0, wentIdle: 0, providerRan: false };

  // 1. Provider pass — real fixtures and results
  const rows = await fetchFootballData().catch(() => []);
  if (rows.length > 0) {
    summary.providerRan = true;
    const { error, count } = await supabase
      .from('matches')
      .upsert(rows, { onConflict: 'id', count: 'exact' });
    if (error) return { ok: false, error: error.message };
    summary.upserted = count ?? rows.length;
  }

  // 2. Clock pass — is_live from starts_at, per-sport duration
  const { data: open, error: openError } = await supabase
    .from('matches')
    .select('id, sport, starts_at, is_live')
    .eq('is_completed', false);
  if (openError) return { ok: false, error: openError.message };

  const now = Date.now();
  const goLive: string[] = [];
  const goIdle: string[] = [];
  for (const m of open ?? []) {
    const start = new Date(m.starts_at).getTime();
    const shouldBeLive = now >= start && now <= start + clockLiveWindow(m.sport);
    if (shouldBeLive && !m.is_live) goLive.push(m.id);
    if (!shouldBeLive && m.is_live) goIdle.push(m.id);
  }
  if (goLive.length > 0) {
    const { error } = await supabase.from('matches').update({ is_live: true }).in('id', goLive);
    if (error) return { ok: false, error: error.message };
    summary.wentLive = goLive.length;
  }
  if (goIdle.length > 0) {
    const { error } = await supabase.from('matches').update({ is_live: false }).in('id', goIdle);
    if (error) return { ok: false, error: error.message };
    summary.wentIdle = goIdle.length;
  }

  return { ok: true, ...summary };
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await runSync();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export const POST = GET;
