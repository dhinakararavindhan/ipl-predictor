'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, MessagesSquare } from 'lucide-react';
import { Fixture } from '@/lib/types';
import { getTeamById } from '@/lib/data/teams';
import { formatDate } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchCallSplit, fetchChants, fetchMyCall } from '@/lib/social/api';
import { Chant, CallSplit } from '@/lib/social/types';
import { hasMatchStarted } from '@/lib/social/match';
import { useRealtimeMatch } from '@/lib/social/useRealtimeMatch';
import { TeamLogo } from '@/components/TeamLogo';
import { useSocial } from './SupabaseProvider';
import { SupabaseSetupNotice } from './SupabaseSetupNotice';
import { SignInDialog } from './SignInDialog';
import { CallWidget } from './CallWidget';
import { ChantComposer } from './ChantComposer';
import { ChantFeed } from './ChantFeed';

const EMPTY_SPLIT: CallSplit = { total: 0, byTeam: {} };

export function MatchSocialHub({ fixture }: { fixture: Fixture }) {
  const configured = isSupabaseConfigured();
  const { user } = useSocial();
  const [chants, setChants] = useState<Chant[]>([]);
  const [split, setSplit] = useState<CallSplit>(EMPTY_SPLIT);
  const [myCallTeamId, setMyCallTeamId] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  const team1 = getTeamById(fixture.team1Id);
  const team2 = getTeamById(fixture.team2Id);

  const refetchChants = useCallback(() => {
    if (!configured) return;
    fetchChants(fixture.id, user?.id).then(setChants).catch(() => {});
  }, [configured, fixture.id, user?.id]);

  const refetchCalls = useCallback(() => {
    if (!configured) return;
    fetchCallSplit(fixture.id).then(setSplit).catch(() => {});
    if (user) {
      fetchMyCall(fixture.id, user.id)
        .then((call) => setMyCallTeamId(call?.predictedTeamId ?? null))
        .catch(() => {});
    }
  }, [configured, fixture.id, user]);

  useEffect(() => {
    refetchChants();
    refetchCalls();
  }, [refetchChants, refetchCalls]);

  // Fallback poll while the tab is visible (Realtime may be off or flaky)
  useEffect(() => {
    if (!configured) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetchChants();
        refetchCalls();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [configured, refetchChants, refetchCalls]);

  const realtimeHandlers = useMemo(
    () => ({ chants: refetchChants, calls: refetchCalls }),
    [refetchChants, refetchCalls]
  );
  useRealtimeMatch(fixture.id, realtimeHandlers);

  if (!team1 || !team2) return null;

  // signed-out users have no call of their own, whatever state we last held
  const effectiveMyCall = user ? myCallTeamId : null;
  const winner = fixture.winnerId ? getTeamById(fixture.winnerId) : undefined;
  const started = hasMatchStarted(fixture);
  const venueName = fixture.venue.split(',')[0];

  const onRoarToggled = (chantId: string, roared: boolean) => {
    setChants((prev) =>
      prev.map((c) =>
        c.id === chantId
          ? { ...c, roaredByMe: roared, roarCount: Math.max(0, c.roarCount + (roared ? 1 : -1)) }
          : c
      )
    );
  };

  const onCallMade = (teamId: string) => {
    setMyCallTeamId((prev) => {
      // keep the split responsive without waiting for the refetch
      setSplit((s) => {
        const byTeam = { ...s.byTeam };
        if (prev) byTeam[prev] = Math.max(0, (byTeam[prev] ?? 0) - 1);
        byTeam[teamId] = (byTeam[teamId] ?? 0) + 1;
        return { total: prev ? s.total : s.total + 1, byTeam };
      });
      return teamId;
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/match"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All matches
      </Link>

      {/* Match header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${team1.color}12 0%, transparent 50%, ${team2.color}12 100%)`,
          border: '1px solid var(--border-card)',
        }}
      >
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <div className="flex flex-col items-center gap-2">
            <TeamLogo team={team1} size="lg" />
            <span className="font-bold text-primary">{team1.shortName}</span>
            {fixture.score_1 && <span className="text-xs text-muted">{fixture.score_1}</span>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold text-muted">VS</span>
            {fixture.isCompleted ? (
              winner ? (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${winner.color}18`, color: winner.color, border: `1px solid ${winner.color}40` }}
                >
                  {winner.shortName} won
                </span>
              ) : (
                <span className="text-xs text-muted">No result</span>
              )
            ) : started ? (
              <span className="text-xs font-semibold text-red-500 animate-pulse">In play</span>
            ) : (
              <span className="text-xs text-muted">Upcoming</span>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <TeamLogo team={team2} size="lg" />
            <span className="font-bold text-primary">{team2.shortName}</span>
            {fixture.score_2 && <span className="text-xs text-muted">{fixture.score_2}</span>}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted">
          <span>{formatDate(fixture.date)}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {venueName}
          </span>
        </div>
      </div>

      {/* Calls */}
      {configured ? (
        <CallWidget
          fixture={fixture}
          team1={team1}
          team2={team2}
          myCallTeamId={effectiveMyCall}
          split={split}
          onCallMade={onCallMade}
          onNeedSignIn={() => setSignInOpen(true)}
        />
      ) : (
        <SupabaseSetupNotice feature="Calls and Chants" />
      )}

      {/* Chants */}
      {configured && (
        <div className="card rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-primary">Chants</span>
            {chants.length > 0 && <span className="text-xs text-muted">({chants.length})</span>}
          </div>
          <ChantComposer
            matchId={fixture.id}
            onPosted={refetchChants}
            onNeedSignIn={() => setSignInOpen(true)}
          />
          <ChantFeed
            chants={chants}
            onRoarToggled={onRoarToggled}
            onDeleted={(id) => setChants((prev) => prev.filter((c) => c.id !== id))}
            onNeedSignIn={() => setSignInOpen(true)}
          />
        </div>
      )}

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
