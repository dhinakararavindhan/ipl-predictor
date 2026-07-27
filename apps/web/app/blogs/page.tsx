'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, PenLine } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchPosts, Post } from '@/lib/social/engage';
import { sportMeta } from '@/lib/social/matches';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { UserAvatar } from '@/components/social/UserAvatar';
import { Button } from '@/components/ui/button';

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function BlogsPage() {
  const configured = isSupabaseConfigured();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchPosts()
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="Blogs" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <h1 className="text-xl font-bold text-primary">Blogs</h1>
        </div>
        <Link href="/blogs/new">
          <Button size="sm">
            <PenLine className="w-3.5 h-3.5" />
            Write a blog
          </Button>
        </Link>
      </div>
      <p className="text-sm text-muted -mt-3">Long-form takes from the stands, any sport.</p>

      {!loaded ? (
        <div className="text-center py-12 text-sm text-muted">Opening the press box…</div>
      ) : posts.length === 0 ? (
        <div className="card rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm text-primary font-medium">No blogs yet</p>
          <p className="text-xs text-muted">Got a take the group chat can&apos;t handle? Write it up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blogs/${post.id}`}
              className="card rounded-2xl p-4 block transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 text-[10px] text-muted mb-1">
                {post.sport && <span>{sportMeta(post.sport).emoji} {sportMeta(post.sport).label}</span>}
                {post.matchLabel && <span>· {post.matchLabel}</span>}
              </div>
              <h2 className="text-base font-bold text-primary leading-snug">{post.title}</h2>
              <p className="text-sm text-muted line-clamp-2 mt-1">{post.body}</p>
              <div className="flex items-center gap-2 mt-3">
                <UserAvatar author={post.author} size="sm" />
                <Link
                  href={`/fan/${post.author.username}`}
                  className="text-xs font-semibold text-primary hover:text-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.author.displayName || post.author.username}
                </Link>
                <span className="text-[10px] text-faint">{timeAgo(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
