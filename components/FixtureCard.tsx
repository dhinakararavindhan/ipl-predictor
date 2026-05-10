'use client';

import { Fixture } from '@/lib/types';
import { getTeamById } from '@/lib/data/teams';
import { TeamLogo } from './TeamLogo';
import { formatDate, getImportanceLabel, getImportanceColor } from '@/lib/utils';
import { useIPLStore } from '@/lib/store';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';

interface FixtureCardProps {
  fixture: Fixture;
  showSimulator?: boolean;
  team1WinProb?: number;
  isPulsing?: boolean;
}

export function FixtureCard({ fixture, showSimulator = false, team1WinProb, isPulsing = false }: FixtureCardProps) {
  const { setFixtureWinner, resetFixture } = useIPLStore();
  const team1 = getTeamById(fixture.team1Id);
  const team2 = getTeamById(fixture.team2Id);

  if (!team1 || !team2) return null;

  const t2WinProb = team1WinProb !== undefined ? 1 - team1WinProb : undefined;

  // Shorten venue to just the stadium name (before first comma)
  const venueName = fixture.venue.split(',')[0];

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-300 w-full ${isPulsing ? 'scale-[1.02]' : ''}`}
      style={{
        background: isPulsing ? 'var(--row-top4)' : 'var(--bg-card)',
        border: isPulsing
          ? '1.5px solid #6366f1'
          : `1px solid ${fixture.isCompleted ? 'var(--border)' : 'var(--border-card)'}`,
        boxShadow: isPulsing ? '0 0 0 3px rgba(99,102,241,0.15)' : undefined,
      }}
    >
      {/* Header: date + importance badge */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-xs text-muted whitespace-nowrap">{formatDate(fixture.date)}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${getImportanceColor(fixture.importance)}`}
        >
          {getImportanceLabel(fixture.importance)}
        </span>
      </div>

      {/* Teams row — fixed 3-column grid so VS stays centred */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">

        {/* Team 1 */}
        <div
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
          style={{
            background:
              fixture.isCompleted && fixture.winnerId === team1.id
                ? 'rgba(16,185,129,0.08)'
                : 'transparent',
            border:
              fixture.isCompleted && fixture.winnerId === team1.id
                ? '1px solid rgba(16,185,129,0.25)'
                : '1px solid transparent',
            opacity: fixture.isCompleted && fixture.winnerId !== team1.id ? 0.4 : 1,
          }}
        >
          <TeamLogo team={team1} size="md" />
          <span className="font-bold text-primary text-sm text-center leading-tight">
            {team1.shortName}
          </span>
          {team1WinProb !== undefined && !fixture.isCompleted && (
            <span className="text-xs text-muted">{(team1WinProb * 100).toFixed(0)}%</span>
          )}
          {fixture.isCompleted && fixture.winnerId === team1.id && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">WON</span>
          )}
        </div>

        {/* VS — fixed width, never grows */}
        <div className="flex flex-col items-center gap-1 w-10 shrink-0">
          <span className={`font-bold text-sm ${isPulsing ? 'text-indigo-500 animate-pulse' : 'text-muted'}`}>
            {isPulsing ? '⚡' : 'VS'}
          </span>
          {!fixture.isCompleted && (
            <span
              className="text-[10px] text-faint text-center leading-tight"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxWidth: '2.5rem',
              }}
              title={venueName}
            >
              {venueName}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
          style={{
            background:
              fixture.isCompleted && fixture.winnerId === team2.id
                ? 'rgba(16,185,129,0.08)'
                : 'transparent',
            border:
              fixture.isCompleted && fixture.winnerId === team2.id
                ? '1px solid rgba(16,185,129,0.25)'
                : '1px solid transparent',
            opacity: fixture.isCompleted && fixture.winnerId !== team2.id ? 0.4 : 1,
          }}
        >
          <TeamLogo team={team2} size="md" />
          <span className="font-bold text-primary text-sm text-center leading-tight">
            {team2.shortName}
          </span>
          {t2WinProb !== undefined && !fixture.isCompleted && (
            <span className="text-xs text-muted">{(t2WinProb * 100).toFixed(0)}%</span>
          )}
          {fixture.isCompleted && fixture.winnerId === team2.id && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">WON</span>
          )}
        </div>
      </div>

      {/* Simulator Controls */}
      {showSimulator && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          {!fixture.isCompleted ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs min-w-0"
                onClick={() => setFixtureWinner(fixture.id, team1.id)}
                style={{ borderColor: `${team1.color}50`, color: team1.color }}
              >
                {team1.shortName} Win
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs min-w-0"
                onClick={() => setFixtureWinner(fixture.id, team2.id)}
                style={{ borderColor: `${team2.color}50`, color: team2.color }}
              >
                {team2.shortName} Win
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs"
              onClick={() => resetFixture(fixture.id)}
            >
              <RotateCcw className="w-3 h-3" />
              Reset Result
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
