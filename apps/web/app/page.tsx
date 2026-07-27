'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BookOpen,
  ChevronRight,
  Crown,
  FlaskConical,
  Heart,
  Megaphone,
  Radio,
  MonitorPlay,
} from 'lucide-react';
import { FIXTURES } from '@/lib/data/fixtures';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchPosts, fetchRecentVideos, MatchVideo, Post } from '@/lib/social/engage';
import { fetchTrendingMatches, MatchInfo, sportMeta } from '@/lib/social/matches';
import { FanWall } from '@/components/social/FanWall';
import { AroundTheGrounds } from '@/components/social/AroundTheGrounds';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { TeamBadge } from '@/components/social/TeamBadge';
import { VideoCard } from '@/components/social/VideoSection';
import { UserAvatar } from '@/components/social/UserAvatar';

const TABS = [
  { href: '/predict', icon: Megaphone, label: 'Predict', blurb: 'Match, over, half — call it all' },
  { href: '/live', icon: Radio, label: 'Live', blurb: 'In-play matches and live stands' },
  { href: '/support', icon: Heart, label: 'Support', blurb: 'Pick your side, be counted' },
  { href: '/blogs', icon: BookOpen, label: 'Blogs', blurb: 'Fan takes, long form' },
  { href: '/videos', icon: MonitorPlay, label: 'Videos', blurb: 'Highlights and match links' },
  { href: '/lab', icon: FlaskConical, label: 'IPL Lab', blurb: 'Standings and playoff odds' },
];

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function HomePage() {
  const configured = isSupabaseConfigured();
  const [trending, setTrending] = useState<Array<{ match: MatchInfo; chantCount: number }>>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [videos, setVideos] = useState<MatchVideo[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchTrendingMatches(3).then(setTrending).catch(() => {});
    fetchPosts(3).then(setPosts).catch(() => {});
    fetchRecentVideos(4).then(setVideos).catch(() => {});
  }, []);

  const upcomingCricket = FIXTURES.filter((f) => !f.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
          Welcome to <span className="gradient-text">The Stands</span>
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-lg mx-auto">
          The home crowd for every sport. Predict every phase, back your side, chant live, write
          your take, share the footage.
        </p>
      </div>

      {/* The tabs, as cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="card rounded-2xl p-4 flex flex-col gap-1.5 transition-transform hover:-translate-y-0.5"
          >
            <tab.icon className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-semibold text-primary">{tab.label}</span>
            <span className="text-[11px] text-muted leading-snug">{tab.blurb}</span>
          </Link>
        ))}
      </div>

      {!configured && <SupabaseSetupNotice feature="The fan features" />}

      {/* Loudest stands */}
      {trending.length > 0 && (
        <div className="card rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">🔥 Loudest stands right now</span>
            <Link
              href="/sports"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All sports <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {trending.map(({ match, chantCount }) => (
            <Link
              key={match.id}
              href={`/match/${match.id}`}
              className="flex items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-indigo-500/5"
              style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
            >
              <span className="text-sm">{sportMeta(match.sport).emoji}</span>
              <TeamBadge team={match.team1} size="xs" />
              <span className="text-xs font-bold text-primary">{match.team1.short}</span>
              <span className="text-[10px] text-muted">vs</span>
              <span className="text-xs font-bold text-primary">{match.team2.short}</span>
              <TeamBadge team={match.team2} size="xs" />
              <span className="flex-1 text-right text-[10px] text-faint truncate">{match.league}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {chantCount} chants
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Latest blogs */}
        <div className="card rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> From the blogs
            </span>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All blogs <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className="text-xs text-muted py-2">
              No blogs yet —{' '}
              <Link href="/blogs/new" className="text-indigo-500 hover:underline">
                write the first one
              </Link>
              .
            </p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/blogs/${post.id}`}
                className="block rounded-xl p-3 transition-colors hover:bg-indigo-500/5"
                style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
              >
                <p className="text-sm font-semibold text-primary line-clamp-1">{post.title}</p>
                <p className="text-xs text-muted line-clamp-2 mt-0.5">{post.body}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <UserAvatar author={post.author} size="sm" />
                  <span className="text-[10px] text-muted">
                    {post.author.displayName || post.author.username} · {timeAgo(post.createdAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Latest videos */}
        <div className="card rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary inline-flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-red-500" /> Fresh footage
            </span>
            <Link
              href="/videos"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All videos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {videos.length === 0 ? (
            <p className="text-xs text-muted py-2">
              No videos yet — drop a YouTube link on any match hub.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} showMatch />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Other sports + fan wall */}
      <AroundTheGrounds />
      <FanWall />

      {/* Cricket lab teaser */}
      <Link
        href="/lab"
        className="card rounded-2xl p-4 flex items-center gap-3 transition-transform hover:-translate-y-0.5"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
          🏏
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">The IPL Playoff Lab</p>
          <p className="text-xs text-muted">
            {upcomingCricket} matches left — live standings, 10,000-run Monte Carlo playoff odds,
            simulators, and analytics.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-faint" />
      </Link>

      {/* Leaderboard teaser */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted">
        <Link href="/leaderboard" className="inline-flex items-center gap-1 hover:text-primary">
          <Crown className="w-3.5 h-3.5 text-amber-500" /> Fan leaderboard
        </Link>
        <span>·</span>
        <Link href="/sports" className="inline-flex items-center gap-1 hover:text-primary">
          <Activity className="w-3.5 h-3.5" /> All sports
        </Link>
      </div>
    </div>
  );
}
