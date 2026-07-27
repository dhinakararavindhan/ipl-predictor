'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchRecentChants } from '@/lib/social/api';
import { AdminChant } from '@/lib/social/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from './UserAvatar';

// Latest chants across all matches — the app's front-door heartbeat.
// Renders nothing when Supabase is unconfigured or the stands are silent.
export function FanWall() {
  const [chants, setChants] = useState<AdminChant[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchRecentChants(6)
      .then(setChants)
      .catch(() => {});
  }, []);

  if (chants.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <MessagesSquare className="w-4 h-4 text-indigo-500" />
          From the Stands
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {chants.map((chant) => {
            const name = chant.author.displayName || chant.author.username;
            return (
              <Link
                key={chant.id}
                href={`/match/${chant.matchId}`}
                className="flex items-start gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-indigo-500/5"
                style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
              >
                <UserAvatar author={chant.author} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-primary truncate">{name}</span>
                    <span className="text-[10px] text-faint whitespace-nowrap">
                      {chant.matchLabel}
                    </span>
                  </div>
                  <p className="text-xs text-primary mt-0.5 truncate">{chant.body}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
