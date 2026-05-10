'use client';

import { Team } from '@/lib/types';

interface TeamLogoProps {
  team: Team;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
}

const sizeMap = {
  xs: { box: 'w-6 h-6 text-[10px]',  name: 'text-xs' },
  sm: { box: 'w-8 h-8 text-xs',       name: 'text-xs' },
  md: { box: 'w-10 h-10 text-sm',     name: 'text-sm' },
  lg: { box: 'w-14 h-14 text-base',   name: 'text-base' },
  xl: { box: 'w-20 h-20 text-xl',     name: 'text-lg' },
};

export function TeamLogo({ team, size = 'md', showName = false }: TeamLogoProps) {
  const s = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      {/* Simple colored text badge — no image/logo */}
      <div
        className={`${s.box} rounded-lg flex items-center justify-center font-bold shrink-0`}
        style={{
          backgroundColor: `${team.color}18`,
          color: team.color,
          border: `1.5px solid ${team.color}40`,
        }}
        title={team.name}
      >
        {team.shortName.slice(0, 3)}
      </div>
      {showName && (
        <span className={`${s.name} font-semibold text-primary`}>{team.shortName}</span>
      )}
    </div>
  );
}
