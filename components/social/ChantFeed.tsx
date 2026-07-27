'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flag, Reply, Send, ShieldCheck, Trash2, Volume2 } from 'lucide-react';
import { Chant } from '@/lib/social/types';
import { deleteChant, postChant, reportChant, toggleRoar } from '@/lib/social/api';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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

interface FeedHandlers {
  onRoarToggled: (chantId: string, roared: boolean) => void;
  onDeleted: (chantId: string) => void;
  onReplied: () => void;
  onNeedSignIn: () => void;
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

function ReplyComposer({
  matchId,
  parentId,
  onReplied,
  onClose,
}: {
  matchId: string;
  parentId: string;
  onReplied: () => void;
  onClose: () => void;
}) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await postChant(matchId, trimmed, parentId);
      setBody('');
      onClose();
      onReplied();
    } catch {
      // keep the text so the fan can retry
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 flex gap-2 items-start">
      <Textarea
        rows={1}
        maxLength={500}
        autoFocus
        placeholder="Chant back…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') onClose();
        }}
      />
      <Button size="sm" onClick={submit} disabled={busy || !body.trim()}>
        <Send className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function ChantCard({
  chant,
  isReply,
  handlers,
}: {
  chant: Chant;
  isReply?: boolean;
  handlers: FeedHandlers;
}) {
  const { user, profile } = useSocial();
  const [replying, setReplying] = useState(false);
  const isMine = user?.id === chant.userId;
  const canDelete = isMine || profile?.isAdmin;
  const name = chant.author.displayName || chant.author.username;

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: isReply ? 'transparent' : 'var(--row-hover)',
        border: `1px solid ${isReply ? 'transparent' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <UserAvatar author={chant.author} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <Link
              href={`/fan/${chant.author.username}`}
              className="text-xs font-semibold text-primary truncate hover:text-indigo-500 transition-colors"
            >
              {name}
            </Link>
            <span className="text-[10px] text-faint whitespace-nowrap">
              {timeAgo(chant.createdAt)}
            </span>
          </div>
          <p className="text-sm text-primary mt-0.5 whitespace-pre-wrap break-words">
            {chant.body}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <RoarButton chant={chant} onToggled={handlers.onRoarToggled} onNeedSignIn={handlers.onNeedSignIn} />
            {!isReply && (
              <button
                onClick={() => {
                  if (!user) {
                    handlers.onNeedSignIn();
                    return;
                  }
                  setReplying((r) => !r);
                }}
                className="inline-flex items-center gap-1 text-xs text-faint hover:text-indigo-500 transition-colors"
                title="Reply to this chant"
              >
                <Reply className="w-3.5 h-3.5" />
                {chant.replies.length > 0 && chant.replies.length}
              </button>
            )}
            {canDelete && (
              <button
                onClick={async () => {
                  handlers.onDeleted(chant.id); // optimistic
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
            {!isMine && <ReportButton chantId={chant.id} onNeedSignIn={handlers.onNeedSignIn} />}
          </div>
          {replying && (
            <ReplyComposer
              matchId={chant.matchId}
              parentId={chant.id}
              onReplied={handlers.onReplied}
              onClose={() => setReplying(false)}
            />
          )}
          {chant.replies.length > 0 && (
            <div className="mt-2 space-y-1 border-l-2 pl-1" style={{ borderColor: 'var(--border)' }}>
              {chant.replies.map((reply) => (
                <ChantCard key={reply.id} chant={reply} isReply handlers={handlers} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChantFeed({
  chants,
  onRoarToggled,
  onDeleted,
  onReplied,
  onNeedSignIn,
}: {
  chants: Chant[];
  onRoarToggled: (chantId: string, roared: boolean) => void;
  onDeleted: (chantId: string) => void;
  onReplied: () => void;
  onNeedSignIn: () => void;
}) {
  const handlers: FeedHandlers = { onRoarToggled, onDeleted, onReplied, onNeedSignIn };

  if (chants.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted">
        No chants yet — get the crowd going! 🏏
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chants.map((chant) => (
        <ChantCard key={chant.id} chant={chant} handlers={handlers} />
      ))}
    </div>
  );
}
