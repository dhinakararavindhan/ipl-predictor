'use client';

import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchChantCounts } from './api';

// One batched query per fixture list, so cards can show a chant-count badge.
// Returns {} until loaded (or when Supabase is not configured).
export function useChantCounts(matchIds: string[]): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = matchIds.join(',');

  useEffect(() => {
    if (!isSupabaseConfigured() || !key) return;
    fetchChantCounts(key.split(','))
      .then(setCounts)
      .catch(() => {});
  }, [key]);

  return counts;
}
