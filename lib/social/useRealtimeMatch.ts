'use client';

import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

// Refetch-on-event: postgres_changes payloads lack joined profile rows, so a
// refetch is simpler and correct. Falls back silently to polling if the
// channel never connects (Realtime disabled, network, etc.).
export function useRealtimeMatch(
  matchId: string,
  onChange: { chants: () => void; calls: () => void }
) {
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // chants/roars are unfiltered on purpose: DELETE payloads only carry the
    // primary key (no match_id), so a filtered listener would miss removals.
    // The handler is a cheap single-match refetch either way.
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chants' },
        onChange.chants
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roars' },
        onChange.chants
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls', filter: `match_id=eq.${matchId}` },
        onChange.calls
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // onChange callbacks are expected to be stable (useCallback in the hub)
  }, [matchId, onChange.chants, onChange.calls]);
}
