'use client';

import { PredictionGame } from '@/components/PredictionGame';
import { HistoricalComparison } from '@/components/HistoricalComparison';
import { PlayoffBracket } from '@/components/PlayoffBracket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIPLStore } from '@/lib/store';
import { getTeamById } from '@/lib/data/teams';
import { getHistoricalQualification, IPL_WINNERS, getTitleCount } from '@/lib/data/historical';
import { TeamLogo } from '@/components/TeamLogo';
import { Target, Trophy } from 'lucide-react';

export default function PredictPage() {
  const { teams } = useIPLStore();
  const titleCounts = getTitleCount();

  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center gap-2 sm:gap-3">
          <Target className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500" />
          Predict &amp; Compare
        </h1>
        <p className="text-muted mt-1 text-xs sm:text-sm">
          Make your predictions, track accuracy, and compare with IPL history
        </p>
      </div>

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
