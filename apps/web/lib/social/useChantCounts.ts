'use client';

import { useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchChantCounts } from './api';

// One batched query per fixture list, so cards can show a chant-count badge.
// Prefers the match_stats aggregate maintained by the trends service (one
// tiny row per match); falls back to counting chant rows when the service
// hasn't swept yet. Returns {} until loaded or when Supabase is off.
export function useChantCounts(matchIds: string[]): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = matchIds.join(',');

  useEffect(() => {
    const supabase = getSupabase();
    if (!isSupabaseConfigured() || !supabase || !key) return;
    const ids = key.split(',');
    supabase
      .from('match_stats')
      .select('match_id, chant_count')
      .in('match_id', ids)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const fromStats: Record<string, number> = {};
          for (const row of data) fromStats[row.match_id] = row.chant_count;
          setCounts(fromStats);
        } else {
          // trends service hasn't materialized these yet — count directly
          fetchChantCounts(ids).then(setCounts).catch(() => {});
        }
      });
  }, [key]);

  return counts;
}
