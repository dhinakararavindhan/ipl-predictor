'use client';

import { useIPLStore } from '@/lib/store';
import { TeamLogo } from './TeamLogo';
import { Trophy } from 'lucide-react';

export function PlayoffBracket() {
  const { teams, simulationResults } = useIPLStore();

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  const top4 = sortedTeams.slice(0, 4);
  const [p1, p2, p3, p4] = top4;

  if (!p1 || !p2 || !p3 || !p4) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-primary">Predicted Playoff Bracket</span>
      </div>

      <div className="space-y-3">
        {/* Qualifier 1: 1st vs 2nd */}
        <div className="rounded-xl p-3" style={{ background: 'var(--row-top2)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] text-muted uppercase tracking-wide mb-2">Qualifier 1 — Winner goes to Final</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo team={p1} size="sm" />
              <div>
                <span className="text-sm font-bold text-primary">{p1.shortName}</span>
                <span className="text-xs text-muted ml-1">#{1}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-muted">VS</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-sm font-bold text-primary">{p2.shortName}</span>
                <span className="text-xs text-muted ml-1">#{2}</span>
              </div>
              <TeamLogo team={p2} size="sm" />
            </div>
          </div>
        </div>

        {/* Eliminator: 3rd vs 4th */}
        <div className="rounded-xl p-3" style={{ background: 'var(--row-top4)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] text-muted uppercase tracking-wide mb-2">Eliminator — Loser is eliminated</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo team={p3} size="sm" />
              <div>
                <span className="text-sm font-bold text-primary">{p3.shortName}</span>
                <span className="text-xs text-muted ml-1">#{3}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-muted">VS</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-sm font-bold text-primary">{p4.shortName}</span>
                <span className="text-xs text-muted ml-1">#{4}</span>
              </div>
              <TeamLogo team={p4} size="sm" />
            </div>
          </div>
        </div>

        {/* Qualifier 2 */}
        <div className="rounded-xl p-3" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] text-muted uppercase tracking-wide mb-2">Qualifier 2 — Q1 Loser vs Eliminator Winner</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs text-muted italic">Q1 Loser</span>
            <span className="text-xs font-bold text-muted">VS</span>
            <span className="text-xs text-muted italic">Eliminator Winner</span>
          </div>
        </div>

        {/* Final */}
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wide font-semibold mb-1">🏆 IPL 2026 Final</div>
          <div className="text-xs text-muted">Q1 Winner vs Q2 Winner</div>
          <div className="text-xs text-muted mt-1">May 31, Ahmedabad</div>
        </div>
      </div>

      <p className="text-[10px] text-faint">
        Based on current projected standings. Updates as matches are played.
      </p>
    </div>
  );
}
