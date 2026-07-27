'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Megaphone, MessagesSquare, Target } from 'lucide-react';
import { FIXTURES } from '@/lib/data/fixtures';
import { getTeamById } from '@/lib/data/teams';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchMyCalls, fetchProfileByUsername, fetchUserChants } from '@/lib/social/api';
import { badgesFor, computeCallRecord, CallRecord } from '@/lib/social/badges';
import { AdminChant, Profile } from '@/lib/social/types';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { ShareButton } from '@/components/social/ShareButton';
import { UserAvatar } from '@/components/social/UserAvatar';

function matchLabel(matchId: string): string {
  const fixture = FIXTURES.find((f) => f.id === matchId);
  if (!fixture) return matchId;
  const t1 = getTeamById(fixture.team1Id)?.shortName ?? fixture.team1Id;
  const t2 = getTeamById(fixture.team2Id)?.shortName ?? fixture.team2Id;
  return `${t1} vs ${t2}`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
    >
      <div className="text-lg font-bold text-primary">{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}

export default function FanPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const configured = isSupabaseConfigured();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [record, setRecord] = useState<CallRecord | null>(null);
  const [chants, setChants] = useState<AdminChant[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    fetchProfileByUsername(decodeURIComponent(username))
      .then(async (p) => {
        if (cancelled) return;
        if (!p) {
          setState('missing');
          return;
        }
        const [calls, userChants] = await Promise.all([
          fetchMyCalls(p.id),
          fetchUserChants(p.id),
        ]);
        if (cancelled) return;
        setProfile(p);
        setRecord(computeCallRecord(calls));
        setChants(userChants);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="Fan profiles" />
      </div>
    );
  }

  if (state === 'loading') {
    return <div className="text-center py-16 text-sm text-muted">Finding this fan…</div>;
  }

  if (state === 'missing' || state === 'error' || !profile || !record) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-2">
        <h1 className="text-lg font-bold text-primary">
          {state === 'error' ? 'Could not load this fan' : 'No such fan'}
        </h1>
        <Link href="/leaderboard" className="text-sm text-indigo-500 hover:underline">
          Back to the leaderboard
        </Link>
      </div>
    );
  }

  const team = profile.favoriteTeamId ? getTeamById(profile.favoriteTeamId) : undefined;
  const name = profile.displayName || profile.username;
  const badges = badgesFor(record, chants.length);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Leaderboard
        </Link>
        <ShareButton title={`${name} — IPL Playoff Lab fan`} />
      </div>

      {/* Fan hero */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: team
            ? `linear-gradient(135deg, ${team.color}12 0%, ${team.color}05 50%, transparent 100%)`
            : 'var(--bg-card)',
          border: `1px solid ${team ? `${team.color}25` : 'var(--border-card)'}`,
        }}
      >
        <div className="flex items-center gap-4">
          <UserAvatar author={profile} size="md" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-primary truncate">{name}</h1>
            <p className="text-xs text-muted">
              @{profile.username}
              {team && (
                <>
                  {' · '}
                  <span style={{ color: team.color }} className="font-semibold">
                    {team.shortName} faithful
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {badges.map((badge) => (
              <span
                key={badge.label}
                title={badge.title}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
              >
                {badge.emoji} {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Call record */}
      <div className="card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-primary">Call record</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <StatTile label="Calls" value={String(record.calls)} />
          <StatTile label="Correct" value={String(record.correct)} />
          <StatTile
            label="Accuracy"
            value={record.decided > 0 ? `${record.accuracy.toFixed(0)}%` : '—'}
          />
          <StatTile label="Best streak" value={record.bestStreak > 0 ? String(record.bestStreak) : '—'} />
        </div>
        {record.calls === 0 && (
          <p className="text-xs text-muted flex items-center gap-1">
            <Target className="w-3 h-3" /> No calls yet.
          </p>
        )}
      </div>

      {/* Recent chants */}
      <div className="card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessagesSquare className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-primary">Recent chants</span>
        </div>
        {chants.length === 0 ? (
          <p className="text-sm text-muted py-2">Nothing from the stands yet.</p>
        ) : (
          <div className="space-y-2">
            {chants.map((chant) => (
              <div
                key={chant.id}
                className="rounded-xl p-3"
                style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
              >
                <Link
                  href={`/match/${chant.matchId}`}
                  className="text-[10px] text-muted hover:text-indigo-500 inline-flex items-center gap-0.5 mb-1"
                >
                  {matchLabel(chant.matchId)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
                <p className="text-sm text-primary whitespace-pre-wrap break-words">{chant.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
