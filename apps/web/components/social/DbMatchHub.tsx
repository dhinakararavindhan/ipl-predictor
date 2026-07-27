'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchDbMatch, MatchInfo } from '@/lib/social/matches';
import { SupabaseSetupNotice } from './SupabaseSetupNotice';
import { MatchSocialHub } from './MatchSocialHub';

// Hub for matches that live only in the database (every non-cricket sport).
export function DbMatchHub({ matchId }: { matchId: string }) {
  const configured = isSupabaseConfigured();
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchDbMatch(matchId)
      .then((m) => {
        if (m) {
          setMatch(m);
          setState('ready');
        } else {
          setState('missing');
        }
      })
      .catch(() => setState('missing'));
  }, [matchId]);

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="Match hubs" />
      </div>
    );
  }

  if (state === 'loading') {
    return <div className="text-center py-16 text-sm text-muted">Opening the stands…</div>;
  }

  if (state === 'missing' || !match) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-2">
        <h1 className="text-lg font-bold text-primary">No such match</h1>
        <p className="text-sm text-muted">This match is not in The Stands yet.</p>
        <Link href="/sports" className="text-sm text-indigo-500 hover:underline">
          Browse all sports
        </Link>
      </div>
    );
  }

  return <MatchSocialHub match={match} />;
}
