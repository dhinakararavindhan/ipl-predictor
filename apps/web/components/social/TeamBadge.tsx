'use client';

import { MatchTeam } from '@/lib/social/matches';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

// Sport-agnostic team mark: colored initials tile (same visual language as
// the cricket TeamLogo, but fed by MatchTeam so any sport works).
export function TeamBadge({ team, size = 'md' }: { team: MatchTeam; size?: keyof typeof sizeMap }) {
  return (
    <div
      className={`${sizeMap[size]} rounded-lg flex items-center justify-center font-bold shrink-0`}
      style={{
        backgroundColor: `${team.color}18`,
        color: team.color,
        border: `1.5px solid ${team.color}40`,
      }}
      title={team.name}
    >
      {team.short.slice(0, 3)}
    </div>
  );
}
