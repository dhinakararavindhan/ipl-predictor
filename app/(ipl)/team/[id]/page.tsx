'use client';

import { use } from 'react';
import { useIPLStore } from '@/lib/store';
import { getTeamById } from '@/lib/data/teams';
import { getQualificationScenarios } from '@/lib/simulation';
import { TeamLogo } from '@/components/TeamLogo';
import { FixtureCard } from '@/components/FixtureCard';
import { QualificationMeter } from '@/components/QualificationMeter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNRR, formatProbability, getProbabilityColor } from '@/lib/utils';
import { getMatchPredictions } from '@/lib/simulation';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Target } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { teams, fixtures, simulationResults } = useIPLStore();

  const team = getTeamById(id);
  if (!team) notFound();

  const result = simulationResults.find((r) => r.teamId === id);
  const teamFixtures = fixtures.filter((f) => f.team1Id === id || f.team2Id === id);
  const upcomingFixtures = teamFixtures.filter((f) => !f.isCompleted);

  const scenarios = getQualificationScenarios(team, teams, fixtures);
  const predictions = getMatchPredictions(teams, fixtures);
  const predMap = new Map(predictions.map((p) => [p.fixtureId, p.team1WinProbability]));

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });
  const rank = sortedTeams.findIndex((t) => t.id === id) + 1;

  const isInPlayoffs = rank <= 4;
  const isTop2 = rank <= 2;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Standings
      </Link>

      {/* Team Hero */}
      <div
        className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${team.color}12 0%, ${team.color}05 50%, transparent 100%)`,
          border: `1px solid ${team.color}25`,
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
          style={{ background: team.color }}
        />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <TeamLogo team={team} size="xl" />

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">{team.name}</h1>
              <Badge variant={isTop2 ? 'success' : isInPlayoffs ? 'info' : 'warning'}>
                {isTop2 ? '🏆 Qualifier' : isInPlayoffs ? '⚡ Playoff Zone' : '⚠️ Outside Top 4'}
              </Badge>
            </div>
            <p className="text-muted text-sm">{team.homeGround}</p>

            <div className="flex flex-wrap gap-4 mt-4">
              <div>
                <div className="text-2xl font-bold text-primary">{team.points}</div>
                <div className="text-xs text-muted">Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">#{rank}</div>
                <div className="text-xs text-muted">Position</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${team.nrr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatNRR(team.nrr)}
                </div>
                <div className="text-xs text-muted">NRR</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{team.won}</div>
                <div className="text-xs text-muted">Wins</div>
              </div>
            </div>
          </div>

          {result && (
            <div className="flex flex-col items-center gap-4">
              <QualificationMeter probability={result.top4Probability} label="Top 4" size="lg" />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {result && [
          {
            label: 'Top 4 Chance',
            value: formatProbability(result.top4Probability),
            color: getProbabilityColor(result.top4Probability),
            icon: <Trophy className="w-4 h-4" />,
          },
          {
            label: 'Top 2 Chance',
            value: formatProbability(result.top2Probability),
            color: getProbabilityColor(result.top2Probability),
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            label: 'Elimination Risk',
            value: formatProbability(result.eliminationProbability),
            color: getProbabilityColor(1 - result.eliminationProbability),
            icon: <TrendingDown className="w-4 h-4" />,
          },
          {
            label: 'Avg Finish',
            value: `#${result.averageFinish.toFixed(1)}`,
            color: 'text-primary',
            icon: <Target className="w-4 h-4" />,
          },
        ].map(({ label, value, color, icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted mb-2">
                {icon}
                <span className="text-xs">{label}</span>
              </div>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scenarios + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qualification Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Qualification Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Best Case</div>
                <div className="text-2xl font-bold text-primary">{scenarios.bestCase.points} pts</div>
                <div className="text-xs text-muted">Win all remaining</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="text-xs text-red-500 dark:text-red-400 mb-1">Worst Case</div>
                <div className="text-2xl font-bold text-primary">{scenarios.worstCase.points} pts</div>
                <div className="text-xs text-muted">Lose all remaining</div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">Wins Needed for Top 4</div>
              <div className="text-3xl font-bold text-primary">
                {scenarios.winsNeeded}
                <span className="text-base text-muted ml-1">
                  / {upcomingFixtures.length} remaining
                </span>
              </div>
            </div>

            {/* Strength Ratings */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-primary">Team Ratings</div>
              {[
                { label: 'Overall Strength', value: team.baseStrength },
                { label: 'Batting', value: team.battingRating },
                { label: 'Bowling', value: team.bowlingRating },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">{label}</span>
                    <span className="text-primary">{value}/100</span>
                  </div>
                  <div className="rounded-full h-2" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${value}%`,
                        background: `linear-gradient(90deg, ${team.color}80, ${team.color})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Form */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Recent Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-6">
              {team.recentForm.map((r, i) => (
                <div
                  key={i}
                  className="flex-1 aspect-square rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{
                    background: r === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    border: r === 1 ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                    color: r === 1 ? '#059669' : '#dc2626',
                  }}
                >
                  {r === 1 ? 'W' : 'L'}
                </div>
              ))}
            </div>

            <div className="text-sm text-muted mb-4">
              {team.recentForm.filter((r) => r === 1).length} wins from last{' '}
              {team.recentForm.length} matches
            </div>

            {/* Finish Distribution */}
            {result && (
              <div>
                <div className="text-sm font-medium text-primary mb-3">
                  Finish Distribution (10k simulations)
                </div>
                <div className="space-y-1.5">
                  {result.finishDistribution.slice(0, 6).map((prob, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-muted w-12">#{idx + 1}</span>
                      <div className="flex-1 rounded-full h-2" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${prob * 100}%`,
                            background: idx < 2 ? '#10b981' : idx < 4 ? '#6366f1' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted w-10 text-right">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Fixtures */}
      {upcomingFixtures.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-primary mb-4">
            Remaining Fixtures ({upcomingFixtures.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingFixtures.map((fixture) => {
              const isTeam1 = fixture.team1Id === id;
              const prob = predMap.get(fixture.id);
              return (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                  showSimulator
                  team1WinProb={isTeam1 ? prob : prob !== undefined ? 1 - prob : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
