'use client';

import { useIPLStore } from '@/lib/store';
import { PointsTable } from '@/components/PointsTable';
import { ProbabilityCard } from '@/components/ProbabilityCard';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { NRRChart } from '@/components/NRRChart';
import { FixtureCard } from '@/components/FixtureCard';
import { PlayoffSimulator } from '@/components/PlayoffProbabilitySimulator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton, CardSkeleton, ChartSkeleton } from '@/components/LoadingSkeleton';
import { getMatchPredictions } from '@/lib/simulation';
import { RefreshCw, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { teams, fixtures, simulationResults, isSimulating, lastSimulated, simulationCount, runSimulations } =
    useIPLStore();

  const predictions = getMatchPredictions(teams, fixtures);
  const predMap = new Map(predictions.map((p) => [p.fixtureId, p.team1WinProbability]));

  const upcomingFixtures = fixtures.filter((f) => !f.isCompleted).slice(0, 6);

  const sortedResults = [...simulationResults].sort(
    (a, b) => b.top4Probability - a.top4Probability
  );

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
          IPL 2026{' '}
          <span className="gradient-text">Playoff Race</span>
        </h1>

        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            onClick={runSimulations}
            disabled={isSimulating}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}
          >
            <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating
              ? 'Simulating…'
              : lastSimulated
              ? `Re-run simulation · #${simulationCount}`
              : 'Run simulation'}
          </button>
        </div>
      </div>

      {/* Main Grid - Mobile optimized */}
      <div className="grid grid-cols-1 gap-6">
        {/* Points Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              🏆 Points Table
              {isSimulating && (
                <span className="text-xs text-muted font-normal flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Simulating...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <TableSkeleton />
            ) : (
              <PointsTable simulationResults={simulationResults} />
            )}
          </CardContent>
        </Card>

        {/* Playoff Simulator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm sm:text-base">
              <span>🎯 Playoff Simulator</span>
              <Link href="/match" className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                Match Predictor <Trophy className="w-3 h-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlayoffSimulator teamId={sortedResults[0]?.teamId ?? 'rcb'} />
          </CardContent>
        </Card>
      </div>

      {/* Probability Cards */}
      <div>
        <h2 className="text-base font-semibold text-primary mb-3">Qualification Probabilities</h2>
        {simulationResults.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {sortedResults.map((result) => {
              const team = teamMap.get(result.teamId);
              if (!team) return null;
              return <ProbabilityCard key={result.teamId} team={team} result={result} />;
            })}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">📊 Net Run Rate Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? <ChartSkeleton /> : <NRRChart teams={teams} />}
          </CardContent>
        </Card>

        {/* Upcoming Fixtures */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">📅 Upcoming Fixtures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingFixtures.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">All fixtures completed</p>
              ) : (
                upcomingFixtures.map((fixture) => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    team1WinProb={predMap.get(fixture.id)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
