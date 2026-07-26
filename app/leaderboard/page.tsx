'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crown, Megaphone, Medal } from 'lucide-react';
import { FIXTURES } from '@/lib/data/fixtures';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchAllCalls, LeaderboardCallRow } from '@/lib/social/api';
import { ChantAuthor } from '@/lib/social/types';
import { useSocial } from '@/components/social/SupabaseProvider';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { UserAvatar } from '@/components/social/UserAvatar';

interface LeaderboardEntry {
  userId: string;
  author: ChantAuthor;
  calls: number;
  decided: number;
  correct: number;
  accuracy: number; // 0..100 over decided calls
}

function rankEntries(rows: LeaderboardCallRow[]): LeaderboardEntry[] {
  const results = new Map(
    FIXTURES.filter((f) => f.isCompleted && f.winnerId).map((f) => [f.id, f.winnerId as string])
  );
  const byUser = new Map<string, LeaderboardEntry>();
  for (const row of rows) {
    let entry = byUser.get(row.userId);
    if (!entry) {
      entry = { userId: row.userId, author: row.author, calls: 0, decided: 0, correct: 0, accuracy: 0 };
      byUser.set(row.userId, entry);
    }
    entry.calls++;
    const winner = results.get(row.matchId);
    if (winner) {
      entry.decided++;
      if (winner === row.predictedTeamId) entry.correct++;
    }
  }
  const entries = [...byUser.values()];
  for (const e of entries) {
    e.accuracy = e.decided > 0 ? (e.correct / e.decided) * 100 : 0;
  }
  // most correct calls first, accuracy breaks ties, then volume
  entries.sort((a, b) => b.correct - a.correct || b.accuracy - a.accuracy || b.calls - a.calls);
  return entries.slice(0, 50);
}

const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#b45309'];

export default function LeaderboardPage() {
  const configured = isSupabaseConfigured();
  const { user } = useSocial();
  const [rows, setRows] = useState<LeaderboardCallRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchAllCalls()
      .then((data) => {
        setRows(data);
        setLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
        setLoaded(true);
      });
  }, []);

  const entries = useMemo(() => rankEntries(rows), [rows]);

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
              <div
                key={entry.userId}
                className="flex items-center gap-3 px-4 py-3"
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
                  </span>
                  <span className="text-[10px] text-muted">
                    {entry.calls} {entry.calls === 1 ? 'call' : 'calls'}
                    {entry.decided > 0 && ` · ${entry.accuracy.toFixed(0)}% on decided`}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {entry.correct}
                  </div>
                  <div className="text-[10px] text-muted">correct</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
