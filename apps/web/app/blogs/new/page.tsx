'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PenLine } from 'lucide-react';
import { FIXTURES } from '@/lib/data/fixtures';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createPost } from '@/lib/social/engage';
import { getCricketMatchInfo, SPORT_META } from '@/lib/social/matches';
import { useSocial } from '@/components/social/SupabaseProvider';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { SignInDialog } from '@/components/social/SignInDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function NewBlogPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const { user } = useSocial();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sport, setSport] = useState('');
  const [matchId, setMatchId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="Blogs" />
      </div>
    );
  }

  const cricketMatches = FIXTURES.filter((f) => !f.isCompleted).slice(0, 20);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSignInOpen(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await createPost({
        title,
        body,
        sport: sport || (matchId ? 'cricket' : null),
        matchId: matchId || null,
      });
      router.push(`/blogs/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(
        msg.includes('row-level security')
          ? "You can't post right now — your account may be restricted."
          : msg || 'Could not publish'
      );
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/blogs"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All blogs
      </Link>

      <div className="flex items-center gap-2">
        <PenLine className="w-5 h-5 text-indigo-500" />
        <h1 className="text-xl font-bold text-primary">Write a blog</h1>
      </div>

      <form onSubmit={submit} className="card rounded-2xl p-4 space-y-3">
        <Input
          required
          minLength={3}
          maxLength={120}
          placeholder="Title — make them click"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          required
          minLength={10}
          maxLength={10000}
          rows={12}
          placeholder="Your take. Paragraphs welcome — this is the long-form stand."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted mb-1 block">Sport (optional)</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-primary"
              style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
            >
              <option value="">—</option>
              {Object.entries(SPORT_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.emoji} {meta.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">About a match? (optional)</label>
            <select
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-primary"
              style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
            >
              <option value="">—</option>
              {cricketMatches.map((f) => {
                const info = getCricketMatchInfo(f.id);
                return (
                  <option key={f.id} value={f.id}>
                    {info ? `${info.team1.short} vs ${info.team2.short}` : f.id}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-faint">{body.length}/10000</span>
          <Button type="submit" disabled={busy}>
            {busy ? 'Publishing…' : user ? 'Publish' : 'Sign in to publish'}
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
