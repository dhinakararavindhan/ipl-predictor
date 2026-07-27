'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, MessagesSquare } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchCallSplit, fetchChants, fetchMyCall } from '@/lib/social/api';
import { Chant, CallSplit } from '@/lib/social/types';
import { MatchInfo, sportMeta } from '@/lib/social/matches';
import { useRealtimeMatch } from '@/lib/social/useRealtimeMatch';
import { useSocial } from './SupabaseProvider';
import { SupabaseSetupNotice } from './SupabaseSetupNotice';
import { SignInDialog } from './SignInDialog';
import { ShareButton } from './ShareButton';
import { TeamBadge } from './TeamBadge';
import { CallWidget } from './CallWidget';
import { SupportMeter } from './SupportMeter';
import { PulsePredictor } from './PulsePredictor';
import { VideoSection } from './VideoSection';
import { ChantComposer } from './ChantComposer';
import { ChantFeed } from './ChantFeed';

const EMPTY_SPLIT: CallSplit = { total: 0, byTeam: {} };

function formatMatchDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
}

export function MatchSocialHub({ match }: { match: MatchInfo }) {
  const configured = isSupabaseConfigured();
  const { user } = useSocial();
  const userId = user?.id;
  const [chants, setChants] = useState<Chant[]>([]);
  const [chantsLoaded, setChantsLoaded] = useState(false);
  const [split, setSplit] = useState<CallSplit>(EMPTY_SPLIT);
  const [myCallTeamId, setMyCallTeamId] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  const { team1, team2 } = match;
  const sport = sportMeta(match.sport);

  const refetchChants = useCallback(() => {
    if (!configured) return;
    fetchChants(match.id, userId)
      .then((data) => {
        setChants(data);
        setChantsLoaded(true);
      })
      .catch(() => {});
  }, [configured, match.id, userId]);

  const refetchCalls = useCallback(() => {
    if (!configured) return;
    fetchCallSplit(match.id).then(setSplit).catch(() => {});
    if (userId) {
      fetchMyCall(match.id, userId)
        .then((call) => setMyCallTeamId(call?.predictedTeamId ?? null))
        .catch(() => {});
    }
  }, [configured, match.id, userId]);

  useEffect(() => {
    refetchChants();
    refetchCalls();
  }, [refetchChants, refetchCalls]);

  // Fallback poll while the tab is visible (Realtime may be off or flaky);
  // live matches poll faster so the stands feel like a chat
  useEffect(() => {
    if (!configured) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetchChants();
        refetchCalls();
      }
    }, match.isLive ? 10_000 : 30_000);
    return () => clearInterval(interval);
  }, [configured, refetchChants, refetchCalls, match.isLive]);

  const realtimeHandlers = useMemo(
    () => ({ chants: refetchChants, calls: refetchCalls }),
    [refetchChants, refetchCalls]
  );
  useRealtimeMatch(match.id, realtimeHandlers);

  // signed-out users have no call of their own, whatever state we last held
  const effectiveMyCall = user ? myCallTeamId : null;
  const winner = match.winnerId
    ? match.winnerId === team1.id
      ? team1
      : team2
    : null;
  const venueName = match.venue ? match.venue.split(',')[0] : null;

  const onRoarToggled = (chantId: string, roared: boolean) => {
    const patch = (c: Chant): Chant =>
      c.id === chantId
        ? { ...c, roaredByMe: roared, roarCount: Math.max(0, c.roarCount + (roared ? 1 : -1)) }
        : { ...c, replies: c.replies.map(patch) };
    setChants((prev) => prev.map(patch));
  };

  const onChantDeleted = (chantId: string) => {
    setChants((prev) =>
      prev
        .filter((c) => c.id !== chantId)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== chantId) }))
    );
  };

  const onCallMade = (teamId: string) => {
    // keep the split responsive without waiting for the refetch
    const prev = myCallTeamId;
    setSplit((s) => {
      const byTeam = { ...s.byTeam };
      if (prev) byTeam[prev] = Math.max(0, (byTeam[prev] ?? 0) - 1);
      byTeam[teamId] = (byTeam[teamId] ?? 0) + 1;
      return { total: prev ? s.total : s.total + 1, byTeam };
    });
    setMyCallTeamId(teamId);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href={match.sport === 'cricket' ? '/match' : `/sports`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {match.sport === 'cricket' ? 'All matches' : 'All sports'}
        </Link>
        <ShareButton title={`${team1.short} vs ${team2.short} — The Stands`} />
      </div>

      {/* Match header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${team1.color}12 0%, transparent 50%, ${team2.color}12 100%)`,
          border: '1px solid var(--border-card)',
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-4 text-xs text-muted">
          <span>{sport.emoji}</span>
          <span className="font-medium">{match.league}</span>
        </div>
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <div className="flex flex-col items-center gap-2">
            <TeamBadge team={team1} size="lg" />
            <span className="font-bold text-primary">{team1.short}</span>
            {match.score1 && <span className="text-xs text-muted">{match.score1}</span>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold text-muted">VS</span>
            {match.isCompleted ? (
              winner ? (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${winner.color}18`, color: winner.color, border: `1px solid ${winner.color}40` }}
                >
                  {winner.short} won
                </span>
              ) : (
                <span className="text-xs text-muted">No result</span>
              )
            ) : match.isLive ? (
              <span className="text-xs font-semibold text-red-500 animate-pulse">In play</span>
            ) : (
              <span className="text-xs text-muted">Upcoming</span>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <TeamBadge team={team2} size="lg" />
            <span className="font-bold text-primary">{team2.short}</span>
            {match.score2 && <span className="text-xs text-muted">{match.score2}</span>}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted">
          <span>{formatMatchDate(match.date)}</span>
          {venueName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {venueName}
            </span>
          )}
        </div>
      </div>

      {/* Match-day ordering: live matches lead with the chant stream,
          upcoming/decided matches lead with support and predictions */}
      {configured ? (
        (() => {
          const chantsCard = (
            <div key="chants" className="card rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                {match.isLive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-primary">Live chants</span>
                  </>
                ) : (
                  <>
                    <MessagesSquare className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-primary">Chants</span>
                  </>
                )}
                {chants.length > 0 && <span className="text-xs text-muted">({chants.length})</span>}
              </div>
              <ChantComposer
                matchId={match.id}
                onPosted={refetchChants}
                onNeedSignIn={() => setSignInOpen(true)}
              />
              {!chantsLoaded ? (
                <div className="space-y-3" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3 animate-pulse"
                      style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full" style={{ background: 'var(--border)' }} />
                        <div className="flex-1 space-y-2 py-0.5">
                          <div className="h-2.5 rounded w-24" style={{ background: 'var(--border)' }} />
                          <div className="h-2.5 rounded w-3/4" style={{ background: 'var(--border)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ChantFeed
                  chants={chants}
                  onRoarToggled={onRoarToggled}
                  onDeleted={onChantDeleted}
                  onReplied={refetchChants}
                  onNeedSignIn={() => setSignInOpen(true)}
                />
              )}
            </div>
          );
          const playCards = (
            <div key="play" className="space-y-6">
              <SupportMeter match={match} onNeedSignIn={() => setSignInOpen(true)} />
              <CallWidget
                match={match}
                myCallTeamId={effectiveMyCall}
                split={split}
                onCallMade={onCallMade}
                onCallFailed={refetchCalls}
                onNeedSignIn={() => setSignInOpen(true)}
              />
              <PulsePredictor match={match} onNeedSignIn={() => setSignInOpen(true)} />
              <VideoSection matchId={match.id} onNeedSignIn={() => setSignInOpen(true)} />
            </div>
          );
          return match.isLive ? [chantsCard, playCards] : [playCards, chantsCard];
        })()
      ) : (
        <SupabaseSetupNotice feature="Calls and Chants" />
      )}

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
