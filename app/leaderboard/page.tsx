'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Crown, Megaphone, Medal } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchAllCalls, LeaderboardCallRow } from '@/lib/social/api';
import { Badge, badgesFor, computeCallRecord, CallRecord, MatchResults } from '@/lib/social/badges';
import { fetchMatchResults } from '@/lib/social/matches';
import { ChantAuthor } from '@/lib/social/types';
import { useSocial } from '@/components/social/SupabaseProvider';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { UserAvatar } from '@/components/social/UserAvatar';

interface LeaderboardEntry extends CallRecord {
  userId: string;
  author: ChantAuthor;
  badges: Badge[];
}

function rankEntries(rows: LeaderboardCallRow[], results: MatchResults): LeaderboardEntry[] {
  const byUser = new Map<string, LeaderboardCallRow[]>();
  for (const row of rows) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }
  const entries: LeaderboardEntry[] = [...byUser.entries()].map(([userId, userRows]) => {
    const record = computeCallRecord(
      userRows.map((r) => ({ matchId: r.matchId, predictedTeamId: r.predictedTeamId })),
      results
    );
    return { userId, author: userRows[0].author, ...record, badges: badgesFor(record) };
  });
  // most correct calls first, accuracy breaks ties, then volume
  entries.sort((a, b) => b.correct - a.correct || b.accuracy - a.accuracy || b.calls - a.calls);
  return entries.slice(0, 50);
}

const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#b45309'];

export default function LeaderboardPage() {
  const configured = isSupabaseConfigured();
  const { user } = useSocial();
  const [rows, setRows] = useState<LeaderboardCallRow[]>([]);
  const [results, setResults] = useState<MatchResults | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    Promise.all([fetchAllCalls(), fetchMatchResults()])
      .then(([data, matchResults]) => {
        setRows(data);
        setResults(matchResults);
        setLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
        setLoaded(true);
      });
  }, []);

  const entries = useMemo(
    () => (results ? rankEntries(rows, results) : []),
    [rows, results]
  );

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="The fan leaderboard" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold text-primary">Fan Leaderboard</h1>
        </div>
        <p className="text-sm text-muted">
          Who calls it best? Ranked by correct Calls on decided matches.
        </p>
      </div>

      {!loaded ? (
        <div className="text-center py-12 text-sm text-muted">Loading the standings…</div>
      ) : loadError ? (
        <div className="text-center py-12 text-sm text-red-500">
          Couldn&apos;t load the leaderboard — check your connection and refresh.
        </div>
      ) : entries.length === 0 ? (
        <div className="card rounded-2xl p-8 text-center space-y-2">
          <Megaphone className="w-6 h-6 mx-auto text-indigo-500" />
          <p className="text-sm text-primary font-medium">No Calls yet</p>
          <p className="text-xs text-muted">
            Open any match hub and make your Call — the leaderboard starts with you.
          </p>
        </div>
      ) : (
        <div className="card rounded-2xl overflow-hidden">
          {entries.map((entry, i) => {
            const isMe = user?.id === entry.userId;
            const name = entry.author.displayName || entry.author.username;
            return (
              <Link
                key={entry.userId}
                href={`/fan/${entry.author.username}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-indigo-500/5"
                style={{
                  borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                  background: isMe ? 'rgba(99,102,241,0.06)' : undefined,
                }}
              >
                <div className="w-8 text-center shrink-0">
                  {i < 3 ? (
                    <Medal className="w-4 h-4 mx-auto" style={{ color: MEDAL_COLORS[i] }} />
                  ) : (
                    <span className="text-xs font-semibold text-muted">{i + 1}</span>
                  )}
                </div>
                <UserAvatar author={entry.author} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-primary truncate block">
                    {name}
                    {isMe && <span className="text-xs text-indigo-500 font-normal"> — you</span>}
                    {entry.badges.map((b) => (
                      <span key={b.label} title={`${b.label}: ${b.title}`} className="ml-1">
                        {b.emoji}
                      </span>
                    ))}
                  </span>
                  <span className="text-[10px] text-muted">
                    {entry.calls} {entry.calls === 1 ? 'call' : 'calls'}
                    {entry.decided > 0 && ` · ${entry.accuracy.toFixed(0)}% on decided`}
                    {entry.currentStreak >= 2 && ` · ${entry.currentStreak} streak`}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {entry.correct}
                  </div>
                  <div className="text-[10px] text-muted">correct</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
