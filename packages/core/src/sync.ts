// The fixture sync engine, shared by every runtime that needs it:
// the web app's /api/sync-fixtures route (serverless cron) and the
// standalone services/fixtures-sync worker (long-running process).

import type { SupabaseClient } from '@supabase/supabase-js';
import { clockLiveWindow, fetchFootballData } from './providers';

export interface SyncSummary {
  ok: boolean;
  error?: string;
  upserted?: number;
  wentLive?: number;
  wentIdle?: number;
  providerRan?: boolean;
}

export async function runSync(supabase: SupabaseClient): Promise<SyncSummary> {
  const summary: SyncSummary = { ok: true, upserted: 0, wentLive: 0, wentIdle: 0, providerRan: false };

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

  return summary;
}
