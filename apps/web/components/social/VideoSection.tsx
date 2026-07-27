'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, MonitorPlay } from 'lucide-react';
import { addVideo, deleteVideo, fetchMatchVideos, MatchVideo } from '@/lib/social/engage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSocial } from './SupabaseProvider';

export function VideoCard({
  video,
  onDeleted,
  showMatch = false,
}: {
  video: MatchVideo;
  onDeleted?: (id: string) => void;
  showMatch?: boolean;
}) {
  const { user, profile } = useSocial();
  const canDelete = onDeleted && (user?.id === video.userId || profile?.isAdmin);
  const name = video.author.displayName || video.author.username;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
    >
      <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="block group">
        {video.youtubeId ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt={video.title}
              loading="lazy"
              width={480}
              height={270}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                <MonitorPlay className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center">
            <MonitorPlay className="w-8 h-8 text-red-500" />
          </div>
        )}
      </a>
      <div className="p-2.5 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary leading-snug line-clamp-2">{video.title}</p>
          <p className="text-[10px] text-muted mt-0.5">
            {showMatch && <span>{video.matchLabel} · </span>}
            added by {name}
          </p>
        </div>
        {canDelete && (
          <button
            onClick={async () => {
              onDeleted(video.id);
              try {
                await deleteVideo(video.id);
              } catch { /* refetch will restore */ }
            }}
            className="text-faint hover:text-red-500 transition-colors shrink-0"
            title="Remove video"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function VideoSection({
  matchId,
  onNeedSignIn,
}: {
  matchId: string;
  onNeedSignIn: () => void;
}) {
  const { user } = useSocial();
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    fetchMatchVideos(matchId).then(setVideos).catch(() => {});
  }, [matchId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await addVideo(matchId, title, url);
      setTitle('');
      setUrl('');
      setAdding(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the video');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-primary">Match videos</span>
          {videos.length > 0 && <span className="text-xs text-muted">({videos.length})</span>}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (!user) {
              onNeedSignIn();
              return;
            }
            setAdding((a) => !a);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add video
        </Button>
      </div>

      {adding && (
        <form onSubmit={submit} className="space-y-2">
          <Input
            required
            maxLength={120}
            placeholder="Title — e.g. Full highlights, Post-match presser"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              required
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Adding…' : 'Add'}
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      )}

      {videos.length === 0 ? (
        <p className="text-sm text-muted py-1">
          No videos yet — drop a YouTube link: highlights, press conferences, fan cams.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDeleted={(id) => setVideos((prev) => prev.filter((v) => v.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
