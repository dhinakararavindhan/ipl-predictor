'use client';

import { useState } from 'react';
import { useIPLStore } from '@/lib/store';
import { Team } from '@/lib/types';
import { TeamLogo } from './TeamLogo';
import { formatNRR } from '@/lib/utils';
import { Trophy, Shield, AlertCircle, TrendingUp, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayoffSimulatorProps {
  teamId: string;
}

export function PlayoffSimulator({ teamId }: PlayoffSimulatorProps) {
  const { teams, fixtures, simulationResults } = useIPLStore();
  const team = teams.find((t) => t.id === teamId);
  const result = simulationResults.find((r) => r.teamId === teamId);

  if (!team || !result) return null;

  const remainingMatches = fixtures.filter(
    (f) => !f.isCompleted && (f.team1Id === teamId || f.team2Id === teamId)
  ).length;

  const maxPoints = team.points + remainingMatches * 2;
  const minPoints = team.points;

  // Calculate wins needed for top 4
  const sortedByPoints = [...teams].sort((a, b) => b.points - a.points);
  const fourthPlace = sortedByPoints[3];
  const fourthPlacePoints = fourthPlace ? fourthPlace.points : 0;
  const winsNeeded = Math.max(0, Math.ceil((fourthPlacePoints - team.points + 1) / 2));

  // Calculate best/worst case scenarios
  const bestCasePoints = team.points + remainingMatches * 2;
  const worstCasePoints = team.points;

  // Calculate finish distribution
  const finishDist = result.finishDistribution;
  const top4Chance = result.top4Probability * 100;
  const top2Chance = result.top2Probability * 100;
  const eliminationChance = result.eliminationProbability * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Playoff Probability Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Header */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
          <TeamLogo team={team} size="md" />
          <div>
            <div className="font-bold text-primary">{team.name}</div>
            <div className="text-xs text-muted">
              {team.played} played | {team.won} won | {team.points} pts
            </div>
          </div>
        </div>

        {/* Key Probabilities */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <div className="text-xs text-muted mb-1">Top 4 Chance</div>
            <div className={`text-2xl font-bold ${top4Chance >= 50 ? 'text-amber-500' : 'text-primary'}`}>
              {top4Chance.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div className="text-xs text-muted mb-1">Top 2 Chance</div>
            <div className="text-2xl font-bold text-indigo-500">
              {top2Chance.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="text-xs text-muted mb-1">Eliminated</div>
            <div className={`text-2xl font-bold ${eliminationChance < 50 ? 'text-emerald-500' : 'text-red-500'}`}>
              {eliminationChance.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Scenarios */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Target className="w-4 h-4" />
            <span>Scenarios</span>
          </div>

          {/* Best Case */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Best Case</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted">Max Points</span>
                <div className="font-bold">{bestCasePoints} pts</div>
              </div>
              <div>
                <span className="text-muted">Position</span>
                <div className="font-bold">1st - 4th</div>
              </div>
            </div>
          </div>

          {/* Worst Case */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">Worst Case</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted">Min Points</span>
                <div className="font-bold">{worstCasePoints} pts</div>
              </div>
              <div>
                <span className="text-muted">Position</span>
                <div className="font-bold">5th - 8th</div>
              </div>
            </div>
          </div>

          {/* Wins Needed */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Wins Needed</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted">Remaining Matches</span>
                <div className="font-bold">{remainingMatches}</div>
              </div>
              <div>
                <span className="text-muted">Wins Required</span>
                <div className="font-bold">{winsNeeded} wins</div>
              </div>
            </div>
          </div>
        </div>

        {/* Finish Distribution */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Calendar className="w-4 h-4" />
            <span>Finish Distribution</span>
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rank) => {
              const percentage = finishDist[rank - 1] * 100;
              if (percentage < 1) return null;
              return (
                <div key={rank} className="flex items-center gap-3 text-xs">
                  <div className="w-8 font-bold text-muted">#{rank}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: rank <= 4 ? '#10b981' : rank <= 8 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <div className="w-12 text-right font-mono">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NRR Context */}
        <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-muted font-semibold">Current NRR:</span>
            <span className={`font-bold ${team.nrr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {formatNRR(team.nrr)}
            </span>
          </div>
          <p className="text-muted">
            NRR is crucial for tie-breakers. A positive NRR significantly improves playoff chances when teams are level on points.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
