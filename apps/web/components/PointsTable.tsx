'use client';

import { useIPLStore } from '@/lib/store';
import { SimulationResult } from '@/lib/types';
import { formatNRR, formatProbability, getProbabilityColor } from '@/lib/utils';
import { TeamLogo } from './TeamLogo';
import Link from 'next/link';

interface PointsTableProps {
  simulationResults: SimulationResult[];
}

export function PointsTable({ simulationResults }: PointsTableProps) {
  const { teams } = useIPLStore();
  const simulationCount = useIPLStore((s) => s.simulationCount);

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  const resultMap = new Map(simulationResults.map((r) => [r.teamId, r]));

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <colgroup>
          {/* # */}
          <col style={{ width: '2rem' }} />
          {/* Team — takes remaining space */}
          <col />
          {/* P W L */}
          <col style={{ width: '2.25rem' }} />
          <col style={{ width: '2.25rem' }} />
          <col style={{ width: '2.25rem' }} />
          {/* Pts */}
          <col style={{ width: '2.75rem' }} />
          {/* NRR — sm+ */}
          <col style={{ width: '4.5rem' }} />
          {/* Form — md+ */}
          <col style={{ width: '7rem' }} />
          {/* Top 4% — lg+ */}
          <col style={{ width: '4rem' }} />
          {/* Top 2% — lg+ */}
          <col style={{ width: '4rem' }} />
        </colgroup>

        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="text-left py-3 px-2 text-muted font-medium">#</th>
            <th className="text-left py-3 px-2 text-muted font-medium">Team</th>
            <th className="text-center py-3 px-1 text-muted font-medium">P</th>
            <th className="text-center py-3 px-1 text-muted font-medium">W</th>
            <th className="text-center py-3 px-1 text-muted font-medium">L</th>
            <th className="text-center py-3 px-2 text-muted font-medium">Pts</th>
            <th className="text-center py-3 px-2 text-muted font-medium hidden sm:table-cell">NRR</th>
            <th className="text-center py-3 px-2 text-muted font-medium hidden md:table-cell">Form</th>
            <th className="text-center py-3 px-2 text-muted font-medium hidden lg:table-cell">Top 4%</th>
            <th className="text-center py-3 px-2 text-muted font-medium hidden lg:table-cell">Top 2%</th>
            <th className="text-center py-3 px-2 text-muted font-medium hidden xl:table-cell">Playoff Status</th>
          </tr>
        </thead>

        <tbody key={simulationCount}>
          {sortedTeams.map((team, idx) => {
            const result = resultMap.get(team.id);
            const isTop4 = idx < 4;
            const isTop2 = idx < 2;
            const isEliminated = idx >= 8;
            
            // Determine playoff status
            let playoffStatus = '';
            let statusColor = '';
            let statusIcon = '';
            
            if (isTop2) {
              playoffStatus = '✅ Qualifier 1';
              statusColor = 'text-emerald-600 dark:text-emerald-400';
              statusIcon = '🏆';
            } else if (isTop4) {
              playoffStatus = '🔄 Qualifier 2';
              statusColor = 'text-blue-600 dark:text-blue-400';
              statusIcon = '🚀';
            } else if (isEliminated) {
              playoffStatus = '❌ Eliminated';
              statusColor = 'text-red-500 dark:text-red-400';
              statusIcon = '❌';
            } else {
              playoffStatus = '🤔 Possible';
              statusColor = 'text-amber-600 dark:text-amber-400';
              statusIcon = '⚠️';
            }

            return (
              <tr
                key={team.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: isTop2
                    ? 'var(--row-top2)'
                    : isTop4
                    ? 'var(--row-top4)'
                    : 'transparent',
                }}
                className="transition-colors hover:opacity-80"
              >
                {/* Rank */}
                <td className="py-2.5 px-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isTop2
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : isTop4
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                        : 'text-muted'
                    }`}
                  >
                    {idx + 1}
                  </span>
                </td>

                {/* Team */}
                <td className="py-2.5 px-2">
                  <Link
                    href={`/team/${team.id}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <TeamLogo team={team} size="sm" />
                    <div className="min-w-0">
                      <div className="font-semibold text-primary">{team.shortName}</div>
                      <div className="text-xs text-muted hidden sm:block truncate max-w-[140px]">
                        {team.name}
                      </div>
                    </div>
                  </Link>
                </td>

                {/* P W L */}
                <td className="py-2.5 px-1 text-center text-primary tabular-nums">{team.played}</td>
                <td className="py-2.5 px-1 text-center font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{team.won}</td>
                <td className="py-2.5 px-1 text-center font-medium tabular-nums text-red-500 dark:text-red-400">{team.lost}</td>

                {/* Pts */}
                <td className="py-2.5 px-2 text-center">
                  <span className="font-bold text-primary tabular-nums">{team.points}</span>
                </td>

                {/* NRR */}
                <td className="py-2.5 px-2 text-center hidden sm:table-cell">
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      team.nrr >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}
                  >
                    {formatNRR(team.nrr)}
                  </span>
                </td>

                {/* Form */}
                <td className="py-2.5 px-2 hidden md:table-cell">
                  <div className="flex gap-0.5 justify-center">
                    {team.recentForm.map((r, i) => (
                      <span
                        key={i}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          r === 1
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-500/30 dark:text-red-400'
                        }`}
                      >
                        {r === 1 ? 'W' : 'L'}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Top 4% */}
                <td className="py-2.5 px-2 text-center hidden lg:table-cell">
                  {result ? (
                    <span className={`font-semibold text-xs tabular-nums ${getProbabilityColor(result.top4Probability)}`}>
                      {formatProbability(result.top4Probability)}
                    </span>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>

                {/* Top 2% */}
                <td className="py-2.5 px-2 text-center hidden lg:table-cell">
                  {result ? (
                    <span className={`font-semibold text-xs tabular-nums ${getProbabilityColor(result.top2Probability)}`}>
                      {formatProbability(result.top2Probability)}
                    </span>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>

                {/* Playoff Status */}
                <td className="py-2.5 px-2 text-center hidden xl:table-cell">
                  <div className={`flex items-center justify-center gap-1.5 text-xs font-semibold ${statusColor}`}>
                    <span>{statusIcon}</span>
                    <span>{playoffStatus}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex gap-4 mt-4 px-2 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-500/20" />
          <span>Qualifier 1 &amp; 2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-500/20" />
          <span>Eliminator</span>
        </div>
      </div>
    </div>
  );
}
