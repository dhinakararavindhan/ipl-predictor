'use client';

import { SimulationResult } from '@/lib/types';
import { Team } from '@/lib/types';
import { formatProbability, getProbabilityColor } from '@/lib/utils';
import { TeamLogo } from './TeamLogo';
import Link from 'next/link';

interface ProbabilityCardProps {
  team: Team;
  result: SimulationResult;
}

function ProbBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="w-full rounded-full h-1.5 overflow-hidden"
      style={{ background: 'var(--border)' }}
    >
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}

export function ProbabilityCard({ team, result }: ProbabilityCardProps) {
  const top4 = result.top4Probability;
  const top2 = result.top2Probability;
  const elim = result.eliminationProbability;

  return (
    <Link href={`/team/${team.id}`}>
      <div
        className="rounded-2xl p-4 transition-all duration-200 cursor-pointer"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <TeamLogo team={team} size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-primary">{team.shortName}</div>
            <div className="text-xs text-muted">{team.points} pts · Avg #{result.averageFinish.toFixed(1)}</div>
          </div>
          <div className={`text-lg font-bold ${getProbabilityColor(top4)}`}>
            {formatProbability(top4)}
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">Top 4</span>
              <span className={getProbabilityColor(top4)}>{formatProbability(top4)}</span>
            </div>
            <ProbBar
              value={top4}
              color={top4 >= 0.7 ? 'bg-emerald-500' : top4 >= 0.4 ? 'bg-amber-500' : 'bg-red-500'}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">Top 2</span>
              <span className={getProbabilityColor(top2)}>{formatProbability(top2)}</span>
            </div>
            <ProbBar
              value={top2}
              color={top2 >= 0.5 ? 'bg-blue-500' : top2 >= 0.25 ? 'bg-amber-500' : 'bg-slate-400'}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">Elimination</span>
              <span className={getProbabilityColor(1 - elim)}>{formatProbability(elim)}</span>
            </div>
            <ProbBar
              value={elim}
              color={elim >= 0.7 ? 'bg-red-500' : elim >= 0.4 ? 'bg-amber-500' : 'bg-emerald-400'}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
