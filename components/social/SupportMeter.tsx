'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { MatchInfo, MatchTeam } from '@/lib/social/matches';
import { fetchSupport, pickSide, SupportState } from '@/lib/social/engage';
import { useSocial } from './SupabaseProvider';

// Whose side are you on — allegiance, not prediction. Never locks.
export function SupportMeter({
  match,
  onNeedSignIn,
}: {
  match: MatchInfo;
  onNeedSignIn: () => void;
}) {
  const { user } = useSocial();
  const userId = user?.id;
  const [state, setState] = useState<SupportState>({ mySide: null, byTeam: {} });
  // bumped on every optimistic action so an in-flight stale fetch (started
  // before the action) can't clobber the optimistic state when it resolves
  const generation = useRef(0);

  const refresh = useCallback(() => {
    const gen = generation.current;
    fetchSupport(match.id, userId)
      .then((s) => {
        if (generation.current === gen) setState(s);
      })
      .catch(() => {});
  }, [match.id, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { team1, team2 } = match;
  const t1 = state.byTeam[team1.id] ?? 0;
  const t2 = state.byTeam[team2.id] ?? 0;
  const total = t1 + t2;
  const t1Pct = total > 0 ? Math.round((t1 / total) * 100) : 50;

  const choose = async (teamId: string) => {
    if (!user) {
      onNeedSignIn();
      return;
    }
    const previous = state;
    generation.current++;
    setState((s) => {
      const byTeam = { ...s.byTeam };
      if (s.mySide) byTeam[s.mySide] = Math.max(0, (byTeam[s.mySide] ?? 0) - 1);
      byTeam[teamId] = (byTeam[teamId] ?? 0) + 1;
      return { mySide: teamId, byTeam };
    });
    try {
      await pickSide(match.id, teamId);
      refresh(); // reconcile with the server now that the write is committed
    } catch {
      setState(previous);
    }
  };

  const sideButton = (team: MatchTeam) => {
    const mine = state.mySide === team.id;
    return (
      <button
        onClick={() => choose(team.id)}
        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95"
        style={{
          background: mine ? `${team.color}18` : 'var(--row-hover)',
          border: mine ? `1.5px solid ${team.color}` : '1px solid var(--border)',
          color: team.color,
        }}
      >
        <Heart className={`w-3.5 h-3.5 ${mine ? 'fill-current' : ''}`} />
        {team.short}
        {mine && <span className="text-[10px] text-primary font-medium">— your side</span>}
      </button>
    );
  };

  return (
    <div className="card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-medium text-primary">Whose side are you on?</span>
        </div>
        {total > 0 && (
          <span className="text-xs text-muted">
            {total} {total === 1 ? 'fan' : 'fans'} in the stands
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {sideButton(team1)}
        {sideButton(team2)}
      </div>
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex h-2 rounded-full overflow-hidden" style={{ background: 'var(--row-hover)' }}>
            <div style={{ width: `${t1Pct}%`, background: team1.color, transition: 'width 300ms' }} />
            <div style={{ width: `${100 - t1Pct}%`, background: team2.color, transition: 'width 300ms' }} />
          </div>
          <div className="flex justify-between text-[10px] font-medium">
            <span style={{ color: team1.color }}>{team1.short} {t1Pct}%</span>
            <span style={{ color: team2.color }}>{100 - t1Pct}% {team2.short}</span>
          </div>
        </div>
      )}
    </div>
  );
}
