'use client';

import { useIPLStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NRRChart } from '@/components/NRRChart';
import { ProbabilityChart } from '@/components/ProbabilityChart';
import { BarChart3 } from 'lucide-react';
import { formatProbability, getProbabilityColor } from '@/lib/utils';
import { TeamLogo } from '@/components/TeamLogo';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { teams, simulationResults } = useIPLStore();

  const sortedResults = [...simulationResults].sort(
    (a, b) => b.top4Probability - a.top4Probability
  );
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-indigo-500" />
          Analytics
        </h1>
        <p className="text-muted mt-1 text-sm">
          Qualification probabilities and team performance metrics
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Qualification Probability</CardTitle>
          </CardHeader>
          <CardContent>
            {simulationResults.length > 0 ? (
              <ProbabilityChart teams={teams} results={simulationResults} />
            ) : (
              <div className="h-48 flex items-center justify-center text-muted text-sm">
                Running simulation...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📈 Net Run Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <NRRChart teams={teams} />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Probability Table */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Full Probability Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-3 px-3 text-muted font-medium">Team</th>
                  <th className="text-center py-3 px-3 text-muted font-medium">Top 4 %</th>
                  <th className="text-center py-3 px-3 text-muted font-medium">Top 2 %</th>
                  <th className="text-center py-3 px-3 text-muted font-medium">Elim %</th>
                  <th className="text-center py-3 px-3 text-muted font-medium hidden md:table-cell">Avg Finish</th>
                  <th className="text-center py-3 px-3 text-muted font-medium hidden lg:table-cell">Strength</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result) => {
                  const team = teamMap.get(result.teamId);
                  if (!team) return null;
                  return (
                    <tr
                      key={result.teamId}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="py-3 px-3">
                        <Link href={`/team/${team.id}`} className="flex items-center gap-2 hover:opacity-80">
                          <TeamLogo team={team} size="sm" />
                          <span className="font-semibold text-primary">{team.shortName}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold ${getProbabilityColor(result.top4Probability)}`}>
                          {formatProbability(result.top4Probability)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-semibold ${getProbabilityColor(result.top2Probability)}`}>
                          {formatProbability(result.top2Probability)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-semibold ${getProbabilityColor(1 - result.eliminationProbability)}`}>
                          {formatProbability(result.eliminationProbability)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center hidden md:table-cell text-primary">
                        #{result.averageFinish.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--border)' }}>
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${team.baseStrength}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted w-8">{team.baseStrength}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Team Strength Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Team Strength Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...teams]
              .sort((a, b) => b.baseStrength - a.baseStrength)
              .map((team) => (
                <Link key={team.id} href={`/team/${team.id}`}>
                  <div
                    className="rounded-xl p-4 transition-colors"
                    style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <TeamLogo team={team} size="sm" />
                      <span className="font-semibold text-primary">{team.shortName}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Overall', value: team.baseStrength },
                        { label: 'Batting', value: team.battingRating },
                        { label: 'Bowling', value: team.bowlingRating },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted">{label}</span>
                            <span className="text-primary">{value}</span>
                          </div>
                          <div className="rounded-full h-1.5" style={{ background: 'var(--border)' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${value}%`,
                                background: `linear-gradient(90deg, ${team.color}80, ${team.color})`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
