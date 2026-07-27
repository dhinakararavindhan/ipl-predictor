'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MonitorPlay } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchRecentVideos, MatchVideo } from '@/lib/social/engage';
import { SupabaseSetupNotice } from '@/components/social/SupabaseSetupNotice';
import { VideoCard } from '@/components/social/VideoSection';

export default function VideosPage() {
  const configured = isSupabaseConfigured();
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchRecentVideos(30)
      .then(setVideos)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!configured) {
    return (
      <div className="max-w-2xl mx-auto">
        <SupabaseSetupNotice feature="Videos" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <MonitorPlay className="w-5 h-5 text-red-500" />
          <h1 className="text-xl font-bold text-primary">Match Videos</h1>
        </div>
        <p className="text-sm text-muted">
          Highlights, pressers, fan cams — added by the crowd on each match hub.
        </p>
      </div>

      {!loaded ? (
        <div className="text-center py-12 text-sm text-muted">Rolling the tape…</div>
      ) : videos.length === 0 ? (
        <div className="card rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm text-primary font-medium">No videos yet</p>
          <p className="text-xs text-muted">
            Open any <Link href="/sports" className="text-indigo-500 hover:underline">match hub</Link>{' '}
            and add the first YouTube link.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {videos.map((video) => (
            <div key={video.id} className="space-y-1">
              <VideoCard video={video} showMatch />
              <Link
                href={`/match/${video.matchId}`}
                className="block text-[10px] text-muted hover:text-indigo-500 px-1"
              >
                Open {video.matchLabel} hub →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
