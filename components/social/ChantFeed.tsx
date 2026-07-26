'use client';

import { useState } from 'react';
import { Flag, ShieldCheck, Trash2, Volume2 } from 'lucide-react';
import { Chant } from '@/lib/social/types';
import { deleteChant, reportChant, toggleRoar } from '@/lib/social/api';
import { useSocial } from './SupabaseProvider';
import { UserAvatar } from './UserAvatar';

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function RoarButton({
  chant,
  onToggled,
  onNeedSignIn,
}: {
  chant: Chant;
  onToggled: (chantId: string, roared: boolean) => void;
  onNeedSignIn: () => void;
}) {
  const { user } = useSocial();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    if (!user) {
      onNeedSignIn();
      return;
    }
    setBusy(true);
    const wasRoared = chant.roaredByMe;
    onToggled(chant.id, !wasRoared); // optimistic
    try {
      await toggleRoar(chant.id, wasRoared);
    } catch {
      onToggled(chant.id, wasRoared); // revert
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all active:scale-95"
      style={{
        background: chant.roaredByMe ? 'rgba(99,102,241,0.12)' : 'transparent',
        border: `1px solid ${chant.roaredByMe ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
        color: chant.roaredByMe ? '#6366f1' : 'var(--text-muted)',
      }}
      title={chant.roaredByMe ? 'Take back your roar' : 'Roar for this chant'}
    >
      <Volume2 className="w-3.5 h-3.5" />
      {chant.roarCount > 0 && chant.roarCount}
      <span className="hidden sm:inline">{chant.roaredByMe ? 'Roared' : 'Roar'}</span>
    </button>
  );
}

function ReportButton({ chantId, onNeedSignIn }: { chantId: string; onNeedSignIn: () => void }) {
  const { user } = useSocial();
  const [reported, setReported] = useState(false);

  if (reported) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="w-3 h-3" /> Reported
      </span>
    );
  }

  return (
    <button
      onClick={async () => {
        if (!user) {
          onNeedSignIn();
          return;
        }
        setReported(true);
        try {
          await reportChant(chantId);
        } catch {
          setReported(false);
        }
      }}
      className="text-faint hover:text-amber-500 transition-colors"
      title="Report this chant"
    >
      <Flag className="w-3.5 h-3.5" />
    </button>
  );
}

export function ChantFeed({
  chants,
  onRoarToggled,
  onDeleted,
  onNeedSignIn,
}: {
  chants: Chant[];
  onRoarToggled: (chantId: string, roared: boolean) => void;
  onDeleted: (chantId: string) => void;
  onNeedSignIn: () => void;
}) {
  const { user, profile } = useSocial();

  if (chants.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted">
        No chants yet — get the crowd going! 🏏
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chants.map((chant) => {
        const isMine = user?.id === chant.userId;
        const canDelete = isMine || profile?.isAdmin;
        const name = chant.author.displayName || chant.author.username;
        return (
          <div
            key={chant.id}
            className="rounded-xl p-3"
            style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-2.5">
              <UserAvatar author={chant.author} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-primary truncate">{name}</span>
                  <span className="text-[10px] text-faint whitespace-nowrap">
                    {timeAgo(chant.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-primary mt-0.5 whitespace-pre-wrap break-words">
                  {chant.body}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <RoarButton chant={chant} onToggled={onRoarToggled} onNeedSignIn={onNeedSignIn} />
                  {canDelete && (
                    <button
                      onClick={async () => {
                        onDeleted(chant.id); // optimistic
                        try {
                          await deleteChant(chant.id);
                        } catch {
                          // feed refetch will restore it if delete failed
                        }
                      }}
                      className="text-faint hover:text-red-500 transition-colors"
                      title={isMine ? 'Delete chant' : 'Remove chant (admin)'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isMine && <ReportButton chantId={chant.id} onNeedSignIn={onNeedSignIn} />}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
