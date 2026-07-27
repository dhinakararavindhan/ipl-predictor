'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchOtherSportMatches, MatchInfo, sportMeta } from '@/lib/social/matches';
import { TeamBadge } from './TeamBadge';

// Compact strip of upcoming matches from other sports on the home page.
// Renders nothing when Supabase is unconfigured or nothing is seeded.
export function AroundTheGrounds() {
  const [matches, setMatches] = useState<MatchInfo[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchOtherSportMatches()
      .then((all) => setMatches(all.filter((m) => !m.isCompleted).slice(0, 4)))
      .catch(() => {});
  }, []);

  if (matches.length === 0) return null;

  return (
    <div className="card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">🌍 Around the grounds</span>
        <Link
          href="/sports"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          All sports <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/match/${match.id}`}
            className="flex items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-indigo-500/5"
            style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
          >
            <span className="text-sm">{sportMeta(match.sport).emoji}</span>
            <TeamBadge team={match.team1} size="xs" />
            <span className="text-xs font-bold text-primary">{match.team1.short}</span>
            <span className="text-[10px] text-muted">vs</span>
            <span className="text-xs font-bold text-primary">{match.team2.short}</span>
            <TeamBadge team={match.team2} size="xs" />
            <span className="flex-1 text-right text-[10px] text-faint truncate">{match.league}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
