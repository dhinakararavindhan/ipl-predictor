'use client';

import { getH2H } from '@/lib/data/historical';
import { Team } from '@/lib/types';
import { TeamLogo } from './TeamLogo';

interface HeadToHeadProps {
  team1: Team;
  team2: Team;
}

export function HeadToHead({ team1, team2 }: HeadToHeadProps) {
  const h2h = getH2H(team1.id, team2.id);

  if (!h2h) return null;

  const total = h2h.team1Wins + h2h.team2Wins;
  const t1Pct = total > 0 ? (h2h.team1Wins / total) * 100 : 50;

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted uppercase tracking-wide">Head to Head</div>

      {/* Win count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TeamLogo team={team1} size="sm" />
          <span className="font-bold text-primary text-lg">{h2h.team1Wins}</span>
        </div>
        <span className="text-xs text-muted">{total} matches</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-lg">{h2h.team2Wins}</span>
          <TeamLogo team={team2} size="sm" />
        </div>
      </div>

      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden">
        <div
          className="transition-all duration-500"
          style={{ width: `${t1Pct}%`, background: team1.color }}
        />
        <div
          className="transition-all duration-500"
          style={{ width: `${100 - t1Pct}%`, background: team2.color }}
        />
      </div>

      {/* Last 5 */}
      <div>
        <div className="text-xs text-muted mb-1.5">Last 5 meetings</div>
        <div className="flex gap-1.5">
          {h2h.lastFiveResults.map((winnerId, i) => (
            <span
              key={i}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                background: winnerId === team1.id ? team1.color : team2.color,
                opacity: 1 - i * 0.12,
              }}
            >
              {winnerId === team1.id ? team1.shortName.slice(0, 2) : team2.shortName.slice(0, 2)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
