'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, MessagesSquare } from 'lucide-react';
import { FIXTURES } from '@/lib/data/fixtures';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchChantCounts } from '@/lib/social/api';
import { fetchOtherSportMatches, MatchInfo, sportMeta } from '@/lib/social/matches';
import { TeamBadge } from '@/components/social/TeamBadge';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';

function formatMatchDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function MatchRow({ match, chantCount }: { match: MatchInfo; chantCount?: number }) {
  const winner =
    match.winnerId && (match.winnerId === match.team1.id ? match.team1 : match.team2);
  return (
    <Link
      href={`/match/${match.id}`}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-indigo-500/5"
      style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
    >
      <TeamBadge team={match.team1} size="sm" />
      <span className="text-xs font-bold text-primary w-10 text-center">{match.team1.short}</span>
      <span className="text-[10px] text-muted">vs</span>
      <span className="text-xs font-bold text-primary w-10 text-center">{match.team2.short}</span>
      <TeamBadge team={match.team2} size="sm" />
      <div className="flex-1 min-w-0 text-right">
        <div className="text-xs text-muted">{formatMatchDate(match.date)}</div>
        <div className="text-[10px] text-faint truncate">
          {winner ? `${winner.short} won` : match.venue?.split(',')[0] ?? 'Upcoming'}
        </div>
      </div>
      {chantCount !== undefined && chantCount > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <MessagesSquare className="w-2.5 h-2.5" />
          {chantCount}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-faint shrink-0" />
    </Link>
  );
}

export default function SportsPage() {
  const configured = isSupabaseConfigured();
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [chantCounts, setChantCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchOtherSportMatches()
      .then((data) => {
        setMatches(data);
        setLoaded(true);
        return fetchChantCounts(data.map((m) => m.id));
      })
      .then((counts) => counts && setChantCounts(counts))
      .catch(() => setLoaded(true));
  }, []);

  // group by sport, then league
  const grouped = useMemo(() => {
    const bySport = new Map<string, Map<string, MatchInfo[]>>();
    for (const match of matches) {
      const leagues = bySport.get(match.sport) ?? new Map<string, MatchInfo[]>();
      const list = leagues.get(match.league) ?? [];
      list.push(match);
      leagues.set(match.league, list);
      bySport.set(match.sport, leagues);
    }
    return bySport;
  }, [matches]);

  const upcomingCricket = FIXTURES.filter((f) => !f.isCompleted).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-primary">All Sports</h1>
        <p className="text-sm text-muted">Pick a match, join its stands.</p>
      </div>

      {/* Cricket — the flagship, powered by the full IPL lab */}
      <div className="card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🏏</span>
            <span className="text-sm font-semibold text-primary">Cricket</span>
            <span className="text-xs text-muted">· IPL 2026</span>
          </div>
          <Link
            href="/match"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Open the IPL lab <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-muted">
          {upcomingCricket} matches still to play — full standings, Monte Carlo playoff odds,
          simulators, and a hub for every fixture.
        </p>
      </div>

      {/* Other sports from the database */}
      {!configured ? (
        <SupabaseSetupNotice feature="Other sports" />
      ) : !loaded ? (
        <div className="text-center py-8 text-sm text-muted">Opening the grounds…</div>
      ) : grouped.size === 0 ? (
        <div className="card rounded-2xl p-8 text-center space-y-1">
          <p className="text-sm text-primary font-medium">No other sports yet</p>
          <p className="text-xs text-muted">
            Add matches to the <code>matches</code> table (any sport) and they appear here with a
            hub each — see the README.
          </p>
        </div>
      ) : (
        [...grouped.entries()].map(([sportKey, leagues]) => {
          const meta = sportMeta(sportKey);
          return (
            <div key={sportKey} className="card rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">{meta.emoji}</span>
                <span className="text-sm font-semibold text-primary">{meta.label}</span>
              </div>
              {[...leagues.entries()].map(([league, leagueMatches]) => (
                <div key={league} className="space-y-2">
                  <div className="text-xs font-medium text-muted">{league}</div>
                  {leagueMatches.map((match) => (
                    <MatchRow key={match.id} match={match} chantCount={chantCounts[match.id]} />
                  ))}
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
