'use client';

import { useIPLStore } from '@/lib/store';
import { getHistoricalQualification, getMinQualificationPoints } from '@/lib/data/historical';
import { TeamLogo } from './TeamLogo';
import { History } from 'lucide-react';

export function HistoricalComparison() {
  const { teams } = useIPLStore();
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
  const { min, avg, max } = getMinQualificationPoints();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium text-primary">Historical Comparison</span>
      </div>

      <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
        <div className="text-muted">In 10-team IPL seasons (2022–2025):</div>
        <div className="text-primary">• Minimum points to qualify: <strong>{min}</strong></div>
        <div className="text-primary">• Average 4th-place points: <strong>{avg}</strong></div>
        <div className="text-primary">• Maximum needed: <strong>{max}</strong></div>
      </div>

      <div className="space-y-2">
        {sortedTeams.map((team) => {
          const histPct = getHistoricalQualification(team.points, team.played);
          return (
            <div key={team.id} className="flex items-center gap-3">
              <TeamLogo team={team} size="xs" />
              <span className="text-xs font-medium text-primary w-10">{team.shortName}</span>
              <div className="flex-1 rounded-full h-2" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${histPct}%`,
                    background: histPct >= 70 ? '#10b981' : histPct >= 40 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums w-10 text-right" style={{ color: histPct >= 70 ? '#10b981' : histPct >= 40 ? '#f59e0b' : '#ef4444' }}>
                {histPct}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-faint">
        Based on teams with similar points-per-match ratio at this stage across IPL 2008–2025
      </p>
    </div>
  );
}
