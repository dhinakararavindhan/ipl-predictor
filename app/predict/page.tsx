'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PredictionGame } from '@/components/PredictionGame';
import { HistoricalComparison } from '@/components/HistoricalComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIPLStore } from '@/lib/store';
import { getHistoricalQualification, IPL_WINNERS, getTitleCount } from '@/lib/data/historical';
import { FIXTURES } from '@/lib/data/fixtures';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  cricketMatchInfo,
  fetchOtherSportMatches,
  MatchInfo,
  sportMeta,
} from '@/lib/social/matches';
import { TeamBadge } from '@/components/social/TeamBadge';
import { TeamLogo } from '@/components/TeamLogo';
import { Activity, ChevronRight, Megaphone, Target, Trophy } from 'lucide-react';

export default function PredictPage() {
  const { teams } = useIPLStore();
  const titleCounts = getTitleCount();
  const [otherMatches, setOtherMatches] = useState<MatchInfo[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchOtherSportMatches().then(setOtherMatches).catch(() => {});
  }, []);

  const openMatches = useMemo(() => {
    const others = otherMatches.filter((m) => !m.isCompleted).slice(0, 6);
    const cricket = FIXTURES.filter((f) => !f.isCompleted).slice(0, 4).map(cricketMatchInfo);
    return [...others, ...cricket];
  }, [otherMatches]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center gap-2 sm:gap-3">
          <Target className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500" />
          Predict
        </h1>
        <p className="text-muted mt-1 text-xs sm:text-sm">
          Two ways to call it on every match, any sport — your accuracy feeds the leaderboard
        </p>
      </div>

      {/* The two prediction levels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card rounded-2xl p-4 flex gap-3">
          <Megaphone className="w-5 h-5 text-indigo-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">The Call</p>
            <p className="text-xs text-muted mt-0.5">
              Pick the match winner before the result is in. One call per match, change it any time
              until it&apos;s decided.
            </p>
          </div>
        </div>
        <div className="card rounded-2xl p-4 flex gap-3">
          <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">The Pulse</p>
            <p className="text-xs text-muted mt-0.5">
              Call it phase by phase — over by over in cricket, half by half in football, quarter by
              quarter in basketball.
            </p>
          </div>
        </div>
      </div>

      {/* Open matches to predict on */}
      {openMatches.length > 0 && (
        <div className="card rounded-2xl p-4 space-y-2">
          <span className="text-sm font-semibold text-primary">Open for predictions</span>
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
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Prediction Game */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">🎯 Match Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <PredictionGame />
          </CardContent>
        </Card>

        {/* Historical Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">📜 Historical Qualification Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <HistoricalComparison />
          </CardContent>
        </Card>
      </div>

      {/* IPL Winners History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">🏆 IPL Champions (2008–2025)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {IPL_WINNERS.slice().reverse().map((entry) => {
              const winnerTeam = teams.find(
                (t) => t.id === entry.winner
              );
              return (
                <div
                  key={entry.season}
                  className="rounded-xl p-2 sm:p-3 text-center"
                  style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
                >
                  <div className="text-[10px] text-muted mb-1">IPL {entry.season}</div>
                  {winnerTeam && <TeamLogo team={winnerTeam} size="sm" />}
                  <div className="text-xs sm:text-sm font-bold text-primary mt-1">
                    {winnerTeam?.shortName ?? entry.winner.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Title count */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">👑 All-Time Title Count</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(titleCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([teamId, count]) => {
                const team = teams.find((t) => t.id === teamId);
                if (!team) return null;
                return (
                  <div key={teamId} className="flex items-center gap-2 sm:gap-3">
                    <TeamLogo team={team} size="sm" />
                    <span className="text-xs sm:text-sm font-medium text-primary w-10 sm:w-12">{team.shortName}</span>
                    <div className="flex gap-0.5 sm:gap-1">
                      {Array.from({ length: count }).map((_, i) => (
                        <Trophy key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                      ))}
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted ml-auto">{count} title{count > 1 ? 's' : ''}</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
