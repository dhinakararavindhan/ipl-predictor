// Supabase reads/writes for Pulse Calls, Support, Blogs, and Videos.
// Postgres RLS is the trust boundary — these calls run in the browser.

import { getSupabase } from '@/lib/supabase/client';
import { matchLabel } from './matches';
import { ChantAuthor } from './types';

function supabaseOrThrow() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapAuthor(raw: any): ChantAuthor {
  return {
    username: raw?.username ?? 'unknown',
    displayName: raw?.display_name ?? null,
    favoriteTeamId: raw?.favorite_team_id ?? null,
    avatarUrl: raw?.avatar_url ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Pulse Calls ─────────────────────────────────────────────────────────────

export interface PulseState {
  myPicks: Record<string, string>; // segment -> teamId
  splits: Record<string, Record<string, number>>; // segment -> teamId -> count
  results: Record<string, string>; // segment -> winner team id
}

export async function fetchPulseState(matchId: string, userId?: string): Promise<PulseState> {
  const supabase = supabaseOrThrow();
  const [calls, results] = await Promise.all([
    supabase.from('pulse_calls').select('segment, predicted_team_id, user_id').eq('match_id', matchId),
    supabase.from('segment_results').select('segment, winner_team_id').eq('match_id', matchId),
  ]);
  if (calls.error) throw calls.error;
  if (results.error) throw results.error;

  const myPicks: Record<string, string> = {};
  const splits: Record<string, Record<string, number>> = {};
  for (const row of calls.data ?? []) {
    const seg = (splits[row.segment] ??= {});
    seg[row.predicted_team_id] = (seg[row.predicted_team_id] ?? 0) + 1;
    if (userId && row.user_id === userId) myPicks[row.segment] = row.predicted_team_id;
  }
  const resultMap: Record<string, string> = {};
  for (const row of results.data ?? []) resultMap[row.segment] = row.winner_team_id;
  return { myPicks, splits, results: resultMap };
}

export async function upsertPulseCall(
  matchId: string,
  segment: string,
  predictedTeamId: string
): Promise<void> {
  const supabase = supabaseOrThrow();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to make pulse calls');
  const { error } = await supabase.from('pulse_calls').upsert(
    { match_id: matchId, user_id: auth.user.id, segment, predicted_team_id: predictedTeamId },
    { onConflict: 'match_id,user_id,segment' }
  );
  if (error) throw error;
}

// admin: record who won a segment
export async function decideSegment(
  matchId: string,
  segment: string,
  winnerTeamId: string
): Promise<void> {
  const supabase = supabaseOrThrow();
  const { error } = await supabase.from('segment_results').upsert(
    { match_id: matchId, segment, winner_team_id: winnerTeamId },
    { onConflict: 'match_id,segment' }
  );
  if (error) throw error;
}

// ── Support ─────────────────────────────────────────────────────────────────

export interface SupportState {
  mySide: string | null;
  byTeam: Record<string, number>;
}

export async function fetchSupport(matchId: string, userId?: string): Promise<SupportState> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('supports')
    .select('team_id, user_id')
    .eq('match_id', matchId);
  if (error) throw error;
  const byTeam: Record<string, number> = {};
  let mySide: string | null = null;
  for (const row of data ?? []) {
    byTeam[row.team_id] = (byTeam[row.team_id] ?? 0) + 1;
    if (userId && row.user_id === userId) mySide = row.team_id;
  }
  return { mySide, byTeam };
}

export async function pickSide(matchId: string, teamId: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to pick your side');
  const { error } = await supabase.from('supports').upsert(
    { match_id: matchId, user_id: auth.user.id, team_id: teamId },
    { onConflict: 'match_id,user_id' }
  );
  if (error) throw error;
}

// fanbase totals across all matches — the Support tab standings
export async function fetchFanbaseTotals(): Promise<Record<string, number>> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase.from('supports').select('team_id').limit(5000);
  if (error) throw error;
  const totals: Record<string, number> = {};
  for (const row of data ?? []) totals[row.team_id] = (totals[row.team_id] ?? 0) + 1;
  return totals;
}

// ── Blogs ───────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  title: string;
  body: string;
  matchId: string | null;
  matchLabel: string | null;
  sport: string | null;
  createdAt: string;
  authorId: string;
  author: ChantAuthor;
}

const POST_SELECT =
  'id, title, body, match_id, sport, created_at, author_id, match:matches(team1_short, team2_short), author:profiles(username, display_name, favorite_team_id, avatar_url)';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPost(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    matchId: row.match_id ?? null,
    matchLabel: row.match_id ? matchLabel(row.match_id, row.match) : null,
    sport: row.sport ?? null,
    createdAt: row.created_at,
    authorId: row.author_id,
    author: mapAuthor(row.author),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchPosts(limit = 30): Promise<Post[]> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function fetchPost(id: string): Promise<Post | null> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapPost(data) : null;
}

export async function createPost(input: {
  title: string;
  body: string;
  matchId?: string | null;
  sport?: string | null;
}): Promise<string> {
  const supabase = supabaseOrThrow();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to write a blog');
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: auth.user.id,
      title: input.title.trim(),
      body: input.body.trim(),
      match_id: input.matchId || null,
      sport: input.sport || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ── Videos ──────────────────────────────────────────────────────────────────

export interface MatchVideo {
  id: string;
  matchId: string;
  matchLabel: string;
  userId: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string | null;
  createdAt: string;
  author: ChantAuthor;
}

// pull the 11-char video id out of any youtube url shape
export function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

const VIDEO_SELECT =
  'id, match_id, user_id, title, youtube_url, created_at, match:matches(team1_short, team2_short), author:profiles(username, display_name, favorite_team_id, avatar_url)';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapVideo(row: any): MatchVideo {
  return {
    id: row.id,
    matchId: row.match_id,
    matchLabel: matchLabel(row.match_id, row.match),
    userId: row.user_id,
    title: row.title,
    youtubeUrl: row.youtube_url,
    youtubeId: youtubeId(row.youtube_url),
    createdAt: row.created_at,
    author: mapAuthor(row.author),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchMatchVideos(matchId: string): Promise<MatchVideo[]> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map(mapVideo);
}

export async function fetchRecentVideos(limit = 24): Promise<MatchVideo[]> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapVideo);
}

export async function addVideo(matchId: string, title: string, url: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to add a video');
  if (!youtubeId(url)) throw new Error('That does not look like a YouTube link');
  const { error } = await supabase
    .from('videos')
    .insert({ match_id: matchId, user_id: auth.user.id, title: title.trim(), youtube_url: url.trim() });
  if (error && error.code === '23505') throw new Error('That video is already on this match');
  if (error) throw error;
}

export async function deleteVideo(id: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) throw error;
}
