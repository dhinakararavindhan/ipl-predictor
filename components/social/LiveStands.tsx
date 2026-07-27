'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessagesSquare, Radio } from 'lucide-react';
import { fetchLiveMatches, MatchInfo, sportMeta } from '@/lib/social/matches';
import { TeamBadge } from './TeamBadge';

// In-play matches across every sport, each one a live comment stream.
export function LiveStands() {
  const [matches, setMatches] = useState<MatchInfo[]>([]);

  useEffect(() => {
    fetchLiveMatches().then(setMatches).catch(() => {});
  }, []);

  if (matches.length === 0) return null;

  return (
    <div className="card rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-red-500 animate-pulse" />
        <span className="text-sm font-semibold text-primary">Live stands — chant along</span>
      </div>
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
          {match.score1 && <span className="text-[10px] text-muted">{match.score1}</span>}
          <span className="text-[10px] text-muted">vs</span>
          <span className="text-xs font-bold text-primary">{match.team2.short}</span>
          {match.score2 && <span className="text-[10px] text-muted">{match.score2}</span>}
          <TeamBadge team={match.team2} size="xs" />
          <span className="flex-1 text-right text-[10px] font-semibold text-red-500">● LIVE</span>
          <MessagesSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        </Link>
      ))}
    </div>
  );
}
