// All Supabase reads/writes for the social layer live here.
// Postgres RLS is the trust boundary — these calls run in the browser.

import { getSupabase } from '@/lib/supabase/client';
import { AdminChant, AdminStats, Call, CallSplit, Chant, ChantAuthor, Profile, Report } from './types';

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

export function mapProfile(raw: any): Profile {
  return {
    id: raw.id,
    username: raw.username,
    displayName: raw.display_name ?? null,
    favoriteTeamId: raw.favorite_team_id ?? null,
    avatarUrl: raw.avatar_url ?? null,
    isAdmin: raw.is_admin ?? false,
    isBanned: raw.is_banned ?? false,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Chants ──────────────────────────────────────────────────────────────────

export async function fetchChants(matchId: string, myUserId?: string): Promise<Chant[]> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('chants')
    .select('id, match_id, user_id, body, created_at, author:profiles(username, display_name, favorite_team_id, avatar_url), roars(user_id)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const roars: { user_id: string }[] = row.roars ?? [];
    return {
      id: row.id,
      matchId: row.match_id,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      author: mapAuthor(row.author),
      roarCount: roars.length,
      roaredByMe: myUserId ? roars.some((r) => r.user_id === myUserId) : false,
    };
  });
}

export async function postChant(matchId: string, body: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to chant');
  const { error } = await supabase
    .from('chants')
    .insert({ match_id: matchId, user_id: auth.user.id, body: body.trim() });
  if (error) throw error;
}

export async function deleteChant(chantId: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { error } = await supabase.from('chants').delete().eq('id', chantId);
  if (error) throw error;
}

// ── Roars ───────────────────────────────────────────────────────────────────

export async function toggleRoar(chantId: string, currentlyRoared: boolean): Promise<void> {
  const supabase = supabaseOrThrow();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to roar');
  if (currentlyRoared) {
    const { error } = await supabase
      .from('roars')
      .delete()
      .eq('chant_id', chantId)
      .eq('user_id', auth.user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('roars')
      .insert({ chant_id: chantId, user_id: auth.user.id });
    // A double-click can race the optimistic state; already-roared is success.
    if (error && error.code !== '23505') throw error;
  }
}

// ── Calls ───────────────────────────────────────────────────────────────────

export async function fetchMyCall(matchId: string, userId: string): Promise<Call | null> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('calls')
    .select('match_id, predicted_team_id, created_at')
    .eq('match_id', matchId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { matchId: data.match_id, predictedTeamId: data.predicted_team_id, createdAt: data.created_at };
}

export async function fetchMyCalls(userId: string): Promise<Call[]> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('calls')
    .select('match_id, predicted_team_id, created_at')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    matchId: row.match_id,
    predictedTeamId: row.predicted_team_id,
    createdAt: row.created_at,
  }));
}

export async function upsertCall(matchId: string, predictedTeamId: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to make your call');
  const { error } = await supabase.from('calls').upsert(
    {
      match_id: matchId,
      user_id: auth.user.id,
      predicted_team_id: predictedTeamId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'match_id,user_id' }
  );
  if (error) throw error;
}

export async function fetchCallSplit(matchId: string): Promise<CallSplit> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('calls')
    .select('predicted_team_id')
    .eq('match_id', matchId);
  if (error) throw error;
  const byTeam: Record<string, number> = {};
  for (const row of data ?? []) {
    byTeam[row.predicted_team_id] = (byTeam[row.predicted_team_id] ?? 0) + 1;
  }
  return { total: data?.length ?? 0, byTeam };
}

// ── Chant counts (fixture card badges) ──────────────────────────────────────

export async function fetchChantCounts(matchIds: string[]): Promise<Record<string, number>> {
  if (matchIds.length === 0) return {};
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('chants')
    .select('match_id')
    .in('match_id', matchIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.match_id] = (counts[row.match_id] ?? 0) + 1;
  }
  return counts;
}

// ── Profiles ────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = supabaseOrThrow();
  // select * so this works whether or not the 0002_admin migration has run
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

// ── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardCallRow {
  userId: string;
  matchId: string;
  predictedTeamId: string;
  author: ChantAuthor;
}

export async function fetchAllCalls(): Promise<LeaderboardCallRow[]> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('calls')
    .select('user_id, match_id, predicted_team_id, author:profiles(username, display_name, favorite_team_id, avatar_url)')
    .limit(5000);
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((row: any) => ({
    userId: row.user_id,
    matchId: row.match_id,
    predictedTeamId: row.predicted_team_id,
    author: mapAuthor(row.author),
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// ── Reports & moderation ────────────────────────────────────────────────────

export async function reportChant(chantId: string, reason?: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to report');
  const { error } = await supabase
    .from('reports')
    .insert({ chant_id: chantId, reporter_id: auth.user.id, reason: reason?.trim() || null });
  // Reporting twice is a no-op, not an error
  if (error && error.code !== '23505') throw error;
}

const REPORT_SELECT =
  'id, chant_id, reason, created_at, reporter:profiles!reports_reporter_id_fkey(username, display_name, favorite_team_id, avatar_url), chant:chants(id, match_id, user_id, body, created_at, author:profiles(username, display_name, favorite_team_id, avatar_url, is_banned))';

export async function fetchReports(): Promise<Report[]> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((row: any) => ({
    id: row.id,
    chantId: row.chant_id,
    reason: row.reason ?? null,
    createdAt: row.created_at,
    reporter: mapAuthor(row.reporter),
    chant: row.chant
      ? {
          id: row.chant.id,
          matchId: row.chant.match_id,
          userId: row.chant.user_id,
          body: row.chant.body,
          createdAt: row.chant.created_at,
          author: {
            ...mapAuthor(row.chant.author),
            userId: row.chant.user_id,
            isBanned: row.chant.author?.is_banned ?? false,
          },
        }
      : null,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function dismissReport(reportId: string): Promise<void> {
  const supabase = supabaseOrThrow();
  const { error } = await supabase.from('reports').delete().eq('id', reportId);
  if (error) throw error;
}

export async function fetchRecentChants(limit = 50): Promise<AdminChant[]> {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from('chants')
    .select('id, match_id, user_id, body, created_at, author:profiles(username, display_name, favorite_team_id, avatar_url, is_banned)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((row: any) => ({
    id: row.id,
    matchId: row.match_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    author: { ...mapAuthor(row.author), isBanned: row.author?.is_banned ?? false },
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function setUserBanned(userId: string, banned: boolean): Promise<void> {
  const supabase = supabaseOrThrow();
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: banned })
    .eq('id', userId);
  if (error) throw error;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = supabaseOrThrow();
  const count = async (table: string) => {
    const { count: n, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return n ?? 0;
  };
  const [fans, chants, roars, calls, reports] = await Promise.all([
    count('profiles'),
    count('chants'),
    count('roars'),
    count('calls'),
    count('reports'),
  ]);
  return { fans, chants, roars, calls, reports };
}

export async function updateProfile(
  userId: string,
  patch: { username?: string; displayName?: string | null; favoriteTeamId?: string | null }
): Promise<void> {
  const supabase = supabaseOrThrow();
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(patch.username !== undefined && { username: patch.username }),
      ...(patch.displayName !== undefined && { display_name: patch.displayName }),
      ...(patch.favoriteTeamId !== undefined && { favorite_team_id: patch.favoriteTeamId }),
    })
    .eq('id', userId);
  if (error) throw error;
}
