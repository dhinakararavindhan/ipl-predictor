'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Heart } from 'lucide-react';
import { FIXTURES } from '@/lib/data/fixtures';
import { getTeamById, TEAMS } from '@/lib/data/teams';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchFanbaseTotals } from '@/lib/social/engage';
import {
  cricketMatchInfo,
  fetchOtherSportMatches,
  MatchInfo,
  sportMeta,
} from '@/lib/social/matches';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { TeamBadge } from '@/components/social/TeamBadge';

export default function SupportPage() {
  const configured = isSupabaseConfigured();
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [otherMatches, setOtherMatches] = useState<MatchInfo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    Promise.all([fetchFanbaseTotals(), fetchOtherSportMatches()])
      .then(([t, m]) => {
        setTotals(t);
        setOtherMatches(m);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // matches still open to pick a side: next cricket fixtures + other sports
  const openMatches = useMemo(() => {
    const cricket = FIXTURES.filter((f) => !f.isCompleted)
      .slice(0, 5)
      .map(cricketMatchInfo);
    const others = otherMatches.filter((m) => !m.isCompleted).slice(0, 8);
    return [...others, ...cricket];
  }, [otherMatches]);

  // fanbase standings: resolve names via cricket teams or the match rows
  const standings = useMemo(() => {
    const nameFor = (teamId: string): { name: string; color: string } => {
      const cricket = getTeamById(teamId);
      if (cricket) return { name: cricket.shortName, color: cricket.color };
      for (const m of otherMatches) {
        if (m.team1.id === teamId) return { name: m.team1.short, color: m.team1.color };
        if (m.team2.id === teamId) return { name: m.team2.short, color: m.team2.color };
      }
      return { name: teamId.toUpperCase(), color: '#6366f1' };
    };
    return Object.entries(totals)
      .map(([teamId, count]) => ({ teamId, count, ...nameFor(teamId) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [totals, otherMatches]);

  const maxCount = standings[0]?.count ?? 1;

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="Fan support" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          <h1 className="text-xl font-bold text-primary">Fan Support</h1>
        </div>
        <p className="text-sm text-muted">
          Your Call is your head. Your side is your heart. Pick it on every match.
        </p>
      </div>

      {/* Fanbase standings */}
      <div className="card rounded-2xl p-4 space-y-3">
        <span className="text-sm font-semibold text-primary">📣 Loudest fanbases</span>
        {!loaded ? (
          <p className="text-sm text-muted py-2">Counting the crowd…</p>
        ) : standings.length === 0 ? (
          <p className="text-sm text-muted py-2">
            No sides picked yet — open a match below and be the first in the stands.
          </p>
        ) : (
          <div className="space-y-2">
            {standings.map((row, i) => (
              <div key={row.teamId} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted w-5">{i + 1}</span>
                <span className="text-xs font-bold w-12" style={{ color: row.color }}>
                  {row.name}
                </span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--row-hover)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(6, (row.count / maxCount) * 100)}%`, background: row.color }}
                  />
                </div>
                <span className="text-xs text-muted w-14 text-right">
                  {row.count} {row.count === 1 ? 'fan' : 'fans'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open matches to pick a side */}
      <div className="card rounded-2xl p-4 space-y-2">
        <span className="text-sm font-semibold text-primary">Pick your side</span>
        {openMatches.map((match) => (
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
            <ChevronRight className="w-4 h-4 text-faint shrink-0" />
          </Link>
        ))}
      </div>

      {/* IPL team quick nav */}
      <div className="card rounded-2xl p-4 space-y-2">
        <span className="text-sm font-semibold text-primary">🏏 IPL faithful</span>
        <div className="grid grid-cols-5 gap-1.5">
          {TEAMS.map((team) => (
            <Link
              key={team.id}
              href={`/team/${team.id}`}
              className="rounded-lg py-1.5 text-xs font-bold text-center transition-all hover:scale-105"
              style={{
                backgroundColor: `${team.color}14`,
                color: team.color,
                border: `1px solid ${team.color}30`,
              }}
            >
              {team.shortName}
              {totals[team.id] ? <div className="text-[9px] font-medium">{totals[team.id]} 🫶</div> : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
