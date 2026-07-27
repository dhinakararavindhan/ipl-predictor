'use client';

import { useState } from 'react';
import { Check, Lock, Megaphone, X } from 'lucide-react';
import { CallSplit } from '@/lib/social/types';
import { MatchInfo, MatchTeam } from '@/lib/social/matches';
import { upsertCall } from '@/lib/social/api';
import { TeamBadge } from './TeamBadge';
import { useSocial } from './SupabaseProvider';

interface CallWidgetProps {
  match: MatchInfo;
  myCallTeamId: string | null;
  split: CallSplit;
  onCallMade: (teamId: string) => void;
  onCallFailed: () => void;
  onNeedSignIn: () => void;
}

export function CallWidget({
  match,
  myCallTeamId,
  split,
  onCallMade,
  onCallFailed,
  onNeedSignIn,
}: CallWidgetProps) {
  const { user } = useSocial();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { team1, team2 } = match;
  // Calls lock once the result is recorded
  const locked = match.isCompleted;
  const decided = match.isCompleted && match.winnerId;
  const myCallCorrect = decided && myCallTeamId ? match.winnerId === myCallTeamId : null;
  const winnerShort = match.winnerId === team1.id ? team1.short : team2.short;

  const t1Count = split.byTeam[team1.id] ?? 0;
  const t2Count = split.byTeam[team2.id] ?? 0;
  const splitTotal = t1Count + t2Count;
  const t1Pct = splitTotal > 0 ? Math.round((t1Count / splitTotal) * 100) : 50;
  const t2Pct = splitTotal > 0 ? 100 - t1Pct : 50;

  const makeCall = async (teamId: string) => {
    if (locked || busy) return;
    if (!user) {
      onNeedSignIn();
      return;
    }
    setBusy(true);
    setError(null);
    onCallMade(teamId); // optimistic
    try {
      await upsertCall(match.id, teamId);
    } catch (err) {
      onCallFailed(); // refetch true state — a local revert can't undo the split
      const msg = err instanceof Error ? err.message : '';
      setError(
        msg.includes('row-level security')
          ? "Your call couldn't be saved — the match may be decided or your account restricted."
          : msg || 'Could not save your call'
      );
    } finally {
      setBusy(false);
    }
  };

  const pickButton = (team: MatchTeam) => {
    const picked = myCallTeamId === team.id;
    return (
      <button
        onClick={() => makeCall(team.id)}
        disabled={locked || busy}
        className="flex-1 flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all disabled:cursor-not-allowed"
        style={{
          background: picked ? `${team.color}18` : 'var(--row-hover)',
          border: picked ? `1.5px solid ${team.color}` : '1px solid var(--border)',
          opacity: locked && !picked ? 0.5 : 1,
        }}
      >
        <TeamBadge team={team} size="sm" />
        <span className="text-xs font-bold" style={{ color: team.color }}>
          {team.short}
        </span>
        {picked && (
          <span className="text-[10px] font-semibold text-primary inline-flex items-center gap-1">
            <Megaphone className="w-3 h-3" /> Your Call
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-primary">Make your Call</span>
        </div>
        {locked && (
          <span className="text-xs text-muted inline-flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {decided ? 'Match decided' : 'Calls locked'}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {pickButton(team1)}
        {pickButton(team2)}
      </div>

      {decided && myCallTeamId && (
        <div
          className="rounded-lg px-3 py-2 text-xs font-medium inline-flex items-center gap-1.5"
          style={{
            background: myCallCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${myCallCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          {myCallCorrect ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">You called it!</span>
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">
                Wrong call — {winnerShort} won
              </span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Community split */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {splitTotal > 0
              ? `The crowd's call — ${splitTotal} ${splitTotal === 1 ? 'fan' : 'fans'}`
              : 'No calls yet — be the first'}
          </span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--row-hover)' }}>
          {splitTotal > 0 && (
            <>
              <div style={{ width: `${t1Pct}%`, background: team1.color, transition: 'width 300ms' }} />
              <div style={{ width: `${t2Pct}%`, background: team2.color, transition: 'width 300ms' }} />
            </>
          )}
        </div>
        {splitTotal > 0 && (
          <div className="flex justify-between text-xs font-medium">
            <span style={{ color: team1.color }}>{team1.short} {t1Pct}%</span>
            <span style={{ color: team2.color }}>{t2Pct}% {team2.short}</span>
          </div>
        )}
      </div>
    </div>
  );
}
