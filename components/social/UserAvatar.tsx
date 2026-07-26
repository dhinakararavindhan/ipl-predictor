'use client';

import { getTeamById } from '@/lib/data/teams';
import { ChantAuthor } from '@/lib/social/types';

const sizeMap = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
};

export function UserAvatar({
  author,
  size = 'sm',
}: {
  author: Pick<ChantAuthor, 'username' | 'displayName' | 'favoriteTeamId'>;
  size?: 'sm' | 'md';
}) {
  const team = author.favoriteTeamId ? getTeamById(author.favoriteTeamId) : undefined;
  const name = author.displayName || author.username;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{
        backgroundColor: team ? `${team.color}18` : 'var(--row-hover)',
        color: team ? team.color : 'var(--text-muted)',
        border: `1.5px solid ${team ? `${team.color}40` : 'var(--border)'}`,
      }}
      title={name}
    >
      {initials || '?'}
    </div>
  );
}
