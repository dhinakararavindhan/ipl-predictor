'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Reply, Volume2 } from 'lucide-react';
import { fetchInbox, fetchMyActivity, InboxItem, markInboxSeen } from '@/lib/social/api';
import { ActivityItem } from '@/lib/social/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSocial } from './SupabaseProvider';
import { UserAvatar } from './UserAvatar';

const SEEN_KEY = 'stands-activity-seen';

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationsBell() {
  const { configured, user } = useSocial();
  const userId = user?.id;
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [open, setOpen] = useState(false);
  // safe to read in the initializer: items is [] at hydration, so seenAt
  // can't change the server-rendered output
  const [seenAt, setSeenAt] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem(SEEN_KEY)
  );

  const refresh = useCallback(() => {
    if (!userId) return;
    fetchMyActivity(userId).then(setItems).catch(() => {});
    fetchInbox().then(setInbox).catch(() => {});
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // keep the badge fresh while the tab is open
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 60_000);
    return () => clearInterval(interval);
  }, [userId, refresh]);

  if (!configured || !user) return null;

  const unseen =
    items.filter((i) => !seenAt || i.createdAt > seenAt).length +
    inbox.filter((i) => !i.seen).length;

  const openBell = () => {
    setOpen(true);
    const now = new Date().toISOString();
    localStorage.setItem(SEEN_KEY, now);
    setSeenAt(now);
    if (inbox.some((i) => !i.seen)) {
      markInboxSeen()
        .then(() => setInbox((prev) => prev.map((i) => ({ ...i, seen: true }))))
        .catch(() => {});
    }
  };

  return (
    <>
      <button
        onClick={openBell}
        className="relative p-1.5 rounded-lg text-muted hover:text-primary transition-colors"
        aria-label="Notifications"
        title="Crowd noise on your chants"
      >
        <Bell className="w-4 h-4" />
        {unseen > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Crowd noise" description="Replies and roars on your chants.">
          {inbox.length > 0 && (
            <div className="space-y-2 mb-2">
              {inbox.slice(0, 8).map((note) => (
                <Link
                  key={note.id}
                  href={note.matchId ? `/match/${note.matchId}` : '/'}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl p-2.5 transition-colors hover:bg-indigo-500/5"
                  style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-semibold text-primary">{note.title}</p>
                  {note.body && <p className="text-[11px] text-muted mt-0.5">{note.body}</p>}
                  <span className="text-[10px] text-faint">{timeAgo(note.createdAt)} ago</span>
                </Link>
              ))}
            </div>
          )}
          {items.length === 0 && inbox.length === 0 ? (
            <p className="text-sm text-muted py-2">
              All quiet for now — post a chant and get the crowd going.
            </p>
          ) : items.length === 0 ? null : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {items.map((item) => {
                const name = item.actor.displayName || item.actor.username;
                return (
                  <Link
                    key={item.id}
                    href={`/match/${item.matchId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-indigo-500/5"
                    style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
                  >
                    <UserAvatar author={item.actor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 text-xs">
                        <span className="font-semibold text-primary truncate">{name}</span>
                        <span className="text-muted inline-flex items-center gap-1 whitespace-nowrap">
                          {item.type === 'reply' ? (
                            <>
                              <Reply className="w-3 h-3" /> replied
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" /> roared
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-faint ml-auto whitespace-nowrap">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-primary mt-0.5 truncate">
                        {item.type === 'roar' && <span className="text-muted">your chant: </span>}
                        {item.body}
                      </p>
                      <span className="text-[10px] text-faint">{item.matchLabel}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
