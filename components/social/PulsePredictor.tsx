'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Check, X } from 'lucide-react';
import { MatchInfo } from '@/lib/social/matches';
import { segmentsForSport } from '@/lib/social/segments';
import { fetchPulseState, PulseState, upsertPulseCall } from '@/lib/social/engage';
import { useSocial } from './SupabaseProvider';

// Over-by-over / half-by-half / quarter-by-quarter predictions.
// Each segment stays open until an admin records its result (or the
// match is decided).
export function PulsePredictor({
  match,
  onNeedSignIn,
}: {
  match: MatchInfo;
  onNeedSignIn: () => void;
}) {
  const { user } = useSocial();
  const userId = user?.id;
  const [state, setState] = useState<PulseState>({ myPicks: {}, splits: {}, results: {} });
  const [error, setError] = useState<string | null>(null);
  // guards optimistic picks against being clobbered by in-flight stale fetches
  const generation = useRef(0);

  const segments = segmentsForSport(match.sport);
  const { team1, team2 } = match;

  const refresh = useCallback(() => {
    const gen = generation.current;
    fetchPulseState(match.id, userId)
      .then((s) => {
        if (generation.current === gen) setState(s);
      })
      .catch(() => {});
  }, [match.id, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pick = async (segment: string, teamId: string) => {
    if (!user) {
      onNeedSignIn();
      return;
    }
    setError(null);
    const previous = state;
    generation.current++;
    setState((s) => {
      const splits = { ...s.splits, [segment]: { ...(s.splits[segment] ?? {}) } };
      const prevPick = s.myPicks[segment];
      if (prevPick) splits[segment][prevPick] = Math.max(0, (splits[segment][prevPick] ?? 0) - 1);
      splits[segment][teamId] = (splits[segment][teamId] ?? 0) + 1;
      return { ...s, splits, myPicks: { ...s.myPicks, [segment]: teamId } };
    });
    try {
      await upsertPulseCall(match.id, segment, teamId);
      refresh(); // reconcile with the server now that the write is committed
    } catch (err) {
      setState(previous);
      const msg = err instanceof Error ? err.message : '';
      setError(
        msg.includes('row-level security')
          ? 'This phase is already decided — pick the next one!'
          : msg || 'Could not save your pulse call'
      );
    }
  };

  return (
    <div className="card rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-500" />
        <span className="text-sm font-medium text-primary">Pulse — call it phase by phase</span>
      </div>

      <div className="space-y-2">
        {segments.map((segment) => {
          const myPick = state.myPicks[segment.key];
          const split = state.splits[segment.key] ?? {};
          const winner = state.results[segment.key];
          const decided = Boolean(winner) || match.isCompleted;
          const t1Count = split[team1.id] ?? 0;
          const t2Count = split[team2.id] ?? 0;
          const total = t1Count + t2Count;
          const t1Pct = total > 0 ? Math.round((t1Count / total) * 100) : 50;

          const segButton = (teamId: string, short: string, color: string) => {
            const picked = myPick === teamId;
            const won = winner === teamId;
            return (
              <button
                onClick={() => pick(segment.key, teamId)}
                disabled={decided}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:cursor-not-allowed active:scale-95"
                style={{
                  background: picked ? `${color}20` : 'transparent',
                  border: picked ? `1.5px solid ${color}` : '1px solid var(--border)',
                  color,
                  opacity: decided && !won && !picked ? 0.45 : 1,
                }}
              >
                {short}
              </button>
            );
          };

          return (
            <div
              key={segment.key}
              data-segment={segment.key}
              className="rounded-xl p-2.5 space-y-1.5"
              style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-primary w-24 shrink-0">
                  {segment.label}
                </span>
                <span className="text-[10px] text-muted flex-1 hidden sm:block">
                  {segment.question}
                </span>
                {segButton(team1.id, team1.short, team1.color)}
                {segButton(team2.id, team2.short, team2.color)}
                {winner && myPick && (
                  winner === myPick ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-500" />
                  )
                )}
                {winner && (
                  <span className="text-[10px] font-semibold text-muted">
                    {winner === team1.id ? team1.short : team2.short} took it
                  </span>
                )}
              </div>
              {total > 0 && (
                <div className="flex h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                  <div style={{ width: `${t1Pct}%`, background: team1.color }} />
                  <div style={{ width: `${100 - t1Pct}%`, background: team2.color }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
