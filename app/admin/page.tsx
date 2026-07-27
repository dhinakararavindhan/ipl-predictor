'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ban,
  ExternalLink,
  Flag,
  Megaphone,
  MessagesSquare,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Undo2,
  Users,
  Volume2,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  deleteChant,
  dismissReport,
  fetchAdminStats,
  fetchRecentChants,
  fetchReports,
  setUserBanned,
} from '@/lib/social/api';
import { AdminChant, AdminStats, Report } from '@/lib/social/types';
import { useSocial } from '@/components/social/SupabaseProvider';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { UserAvatar } from '@/components/social/UserAvatar';
import { Button } from '@/components/ui/button';

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-center gap-1.5 text-indigo-500 mb-1">{icon}</div>
      <div className="text-lg font-bold text-primary">{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}

function ChantRow({
  chant,
  onDeleteChant,
  onToggleBan,
  extra,
}: {
  chant: {
    id: string;
    matchId: string;
    matchLabel: string;
    userId: string;
    body: string;
    author: AdminChant['author'];
  };
  onDeleteChant: (chantId: string) => void;
  onToggleBan: (userId: string, banned: boolean) => void;
  extra?: React.ReactNode;
}) {
  const name = chant.author.displayName || chant.author.username;
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-2.5">
        <UserAvatar author={chant.author} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-primary">{name}</span>
            {chant.author.isBanned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                banned
              </span>
            )}
            <Link
              href={`/match/${chant.matchId}`}
              className="text-[10px] text-muted hover:text-indigo-500 inline-flex items-center gap-0.5"
            >
              {chant.matchLabel}
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
          <p className="text-sm text-primary mt-0.5 whitespace-pre-wrap break-words">{chant.body}</p>
          {extra}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => onDeleteChant(chant.id)}
            className="text-faint hover:text-red-500 transition-colors"
            title="Remove chant"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleBan(chant.userId, !chant.author.isBanned)}
            className={`transition-colors ${chant.author.isBanned ? 'text-red-500 hover:text-emerald-500' : 'text-faint hover:text-amber-500'}`}
            title={chant.author.isBanned ? 'Unban this fan' : 'Ban this fan'}
          >
            {chant.author.isBanned ? <Undo2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const configured = isSupabaseConfigured();
  const { loading, user, profile } = useSocial();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [chants, setChants] = useState<AdminChant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = Boolean(profile?.isAdmin);

  // All setState happens inside promise callbacks so the effect stays clean
  const loadData = useCallback(() => {
    if (!isAdmin) return Promise.resolve();
    return Promise.all([fetchAdminStats(), fetchReports(), fetchRecentChants(50)])
      .then(([s, r, c]) => {
        setStats(s);
        setReports(r);
        setChants(c);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load moderation data')
      );
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="Admin tools" />
      </div>
    );
  }

  // profile loads after the session — don't flash "Admins only" at real admins
  if (loading || (user && !profile)) {
    return <div className="text-center py-16 text-sm text-muted">Loading…</div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-2">
        <ShieldCheck className="w-8 h-8 mx-auto text-muted opacity-50" />
        <h1 className="text-lg font-bold text-primary">Admins only</h1>
        <p className="text-sm text-muted">
          {user
            ? 'This account does not have admin access. Grant it in the Supabase SQL editor (see README).'
            : 'Sign in with an admin account to moderate chants.'}
        </p>
      </div>
    );
  }

  const handleDeleteChant = async (chantId: string) => {
    setChants((prev) => prev.filter((c) => c.id !== chantId));
    setReports((prev) => prev.filter((r) => r.chant?.id !== chantId));
    try {
      await deleteChant(chantId);
    } catch {
      refresh();
    }
  };

  const handleToggleBan = async (userId: string, banned: boolean) => {
    const apply = (isBanned: boolean) => {
      setChants((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, author: { ...c.author, isBanned } } : c))
      );
      setReports((prev) =>
        prev.map((r) =>
          r.chant && r.chant.userId === userId
            ? { ...r, chant: { ...r.chant, author: { ...r.chant.author, isBanned } } }
            : r
        )
      );
    };
    apply(banned);
    try {
      await setUserBanned(userId, banned);
    } catch {
      apply(!banned);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    try {
      await dismissReport(reportId);
    } catch {
      refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <h1 className="text-xl font-bold text-primary">Moderation</h1>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-2">
          <StatTile icon={<Users className="w-3.5 h-3.5" />} label="Fans" value={stats.fans} />
          <StatTile icon={<MessagesSquare className="w-3.5 h-3.5" />} label="Chants" value={stats.chants} />
          <StatTile icon={<Volume2 className="w-3.5 h-3.5" />} label="Roars" value={stats.roars} />
          <StatTile icon={<Megaphone className="w-3.5 h-3.5" />} label="Calls" value={stats.calls} />
          <StatTile icon={<Flag className="w-3.5 h-3.5" />} label="Reports" value={stats.reports} />
        </div>
      )}

      {/* Reports queue */}
      <div className="card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-primary">Reported chants</span>
          {reports.length > 0 && <span className="text-xs text-muted">({reports.length})</span>}
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-muted py-2">No open reports — all clear. 🎉</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="space-y-1.5">
                {report.chant ? (
                  <ChantRow
                    chant={report.chant}
                    onDeleteChant={handleDeleteChant}
                    onToggleBan={handleToggleBan}
                    extra={
                      <p className="text-[10px] text-muted mt-1">
                        Reported by {report.reporter.displayName || report.reporter.username}
                        {report.reason ? ` — “${report.reason}”` : ''}
                      </p>
                    }
                  />
                ) : (
                  <p className="text-xs text-muted">Chant already removed.</p>
                )}
                <button
                  onClick={() => handleDismissReport(report.id)}
                  className="text-[10px] text-muted hover:text-primary transition-colors"
                >
                  Dismiss report — chant is fine
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent chants */}
      <div className="card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessagesSquare className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-primary">Latest chants</span>
        </div>
        {chants.length === 0 ? (
          <p className="text-sm text-muted py-2">No chants yet.</p>
        ) : (
          <div className="space-y-2">
            {chants.map((chant) => (
              <ChantRow
                key={chant.id}
                chant={chant}
                onDeleteChant={handleDeleteChant}
                onToggleBan={handleToggleBan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
