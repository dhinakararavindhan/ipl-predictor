'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { deletePost, fetchPost, Post } from '@/lib/social/engage';
import { sportMeta } from '@/lib/social/matches';
import { useSocial } from '@/components/social/SupabaseProvider';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { ShareButton } from '@/components/social/ShareButton';
import { UserAvatar } from '@/components/social/UserAvatar';

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const { user, profile } = useSocial();
  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchPost(id)
      .then((p) => {
        if (p) {
          setPost(p);
          setState('ready');
        } else {
          setState('missing');
        }
      })
      .catch(() => setState('missing'));
  }, [id]);

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="Blogs" />
      </div>
    );
  }

  if (state === 'loading') {
    return <div className="text-center py-16 text-sm text-muted">Fetching the take…</div>;
  }

  if (state === 'missing' || !post) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-2">
        <h1 className="text-lg font-bold text-primary">No such blog</h1>
        <Link href="/blogs" className="text-sm text-indigo-500 hover:underline">
          Back to all blogs
        </Link>
      </div>
    );
  }

  const canDelete = user?.id === post.authorId || profile?.isAdmin;
  const date = new Date(post.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All blogs
        </Link>
        <div className="flex items-center gap-3">
          {canDelete && (
            <button
              onClick={async () => {
                try {
                  await deletePost(post.id);
                  router.push('/blogs');
                } catch { /* leave the page as is */ }
              }}
              className="text-faint hover:text-red-500 transition-colors"
              title="Delete blog"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <ShareButton title={`${post.title} — The Stands`} />
        </div>
      </div>

      <article className="card rounded-2xl p-6 space-y-4">
        <div>
          {(post.sport || post.matchLabel) && (
            <div className="flex items-center gap-2 text-xs text-muted mb-2">
              {post.sport && (
                <span>
                  {sportMeta(post.sport).emoji} {sportMeta(post.sport).label}
                </span>
              )}
              {post.matchId && post.matchLabel && (
                <Link
                  href={`/match/${post.matchId}`}
                  className="inline-flex items-center gap-1 hover:text-indigo-500"
                >
                  {post.matchLabel} <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
          <h1 className="text-2xl font-bold text-primary leading-tight">{post.title}</h1>
          <div className="flex items-center gap-2 mt-3">
            <UserAvatar author={post.author} size="sm" />
            <Link
              href={`/fan/${post.author.username}`}
              className="text-sm font-semibold text-primary hover:text-indigo-500"
            >
              {post.author.displayName || post.author.username}
            </Link>
            <span className="text-xs text-faint">· {date}</span>
          </div>
        </div>
        <div
          className="text-[15px] text-primary leading-relaxed whitespace-pre-wrap break-words"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}
        >
          {post.body}
        </div>
      </article>
    </div>
  );
}
