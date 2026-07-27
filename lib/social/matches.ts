// MatchInfo: the sport-agnostic match shape the social layer runs on.
// Cricket (IPL) matches come from the app's fixture data; every other sport
// comes from the `matches` table — any row there gets a hub automatically.

import { Fixture } from '@/lib/types';
import { FIXTURES } from '@/lib/data/fixtures';
import { getTeamById } from '@/lib/data/teams';
import { getSupabase } from '@/lib/supabase/client';

export interface MatchTeam {
  id: string; // value stored in calls.predicted_team_id
  name: string;
  short: string;
  color: string;
}

export interface MatchInfo {
  id: string;
  sport: string;
  league: string;
  team1: MatchTeam;
  team2: MatchTeam;
  date: string; // ISO date or datetime
  venue: string | null;
  isCompleted: boolean;
  winnerId: string | null;
  isLive: boolean;
  score1?: string;
  score2?: string;
}

export const SPORT_META: Record<string, { label: string; emoji: string }> = {
  cricket: { label: 'Cricket', emoji: '🏏' },
  football: { label: 'Football', emoji: '⚽' },
  basketball: { label: 'Basketball', emoji: '🏀' },
  kabaddi: { label: 'Kabaddi', emoji: '🤼' },
  tennis: { label: 'Tennis', emoji: '🎾' },
  hockey: { label: 'Hockey', emoji: '🏑' },
};

export function sportMeta(sport: string) {
  return SPORT_META[sport] ?? { label: sport.charAt(0).toUpperCase() + sport.slice(1), emoji: '🏟️' };
}

const FALLBACK_COLOR = '#6366f1';

export function cricketMatchInfo(fixture: Fixture): MatchInfo {
  const t1 = getTeamById(fixture.team1Id);
  const t2 = getTeamById(fixture.team2Id);
  return {
    id: fixture.id,
    sport: 'cricket',
    league: 'IPL 2026',
    team1: {
      id: fixture.team1Id,
      name: t1?.name ?? fixture.team1Id,
      short: t1?.shortName ?? fixture.team1Id.toUpperCase(),
      color: t1?.color ?? FALLBACK_COLOR,
    },
    team2: {
      id: fixture.team2Id,
      name: t2?.name ?? fixture.team2Id,
      short: t2?.shortName ?? fixture.team2Id.toUpperCase(),
      color: t2?.color ?? FALLBACK_COLOR,
    },
    date: fixture.date,
    venue: fixture.venue,
    isCompleted: fixture.isCompleted,
    winnerId: fixture.winnerId ?? null,
    isLive: !fixture.isCompleted && Boolean(fixture.score_1 || fixture.score_2),
    score1: fixture.score_1,
    score2: fixture.score_2,
  };
}

export function getCricketMatchInfo(id: string): MatchInfo | null {
  const fixture = FIXTURES.find((f) => f.id === id);
  return fixture ? cricketMatchInfo(fixture) : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapDbMatch(row: any): MatchInfo {
  // cricket rows may carry no display info — resolve via app team data
  const t1 = row.sport === 'cricket' ? getTeamById(row.team1_id) : undefined;
  const t2 = row.sport === 'cricket' ? getTeamById(row.team2_id) : undefined;
  return {
    id: row.id,
    sport: row.sport ?? 'cricket',
    league: row.league ?? '',
    team1: {
      id: row.team1_id,
      name: row.team1_name ?? t1?.name ?? row.team1_id,
      short: row.team1_short ?? t1?.shortName ?? String(row.team1_id).toUpperCase(),
      color: row.team1_color ?? t1?.color ?? FALLBACK_COLOR,
    },
    team2: {
      id: row.team2_id,
      name: row.team2_name ?? t2?.name ?? row.team2_id,
      short: row.team2_short ?? t2?.shortName ?? String(row.team2_id).toUpperCase(),
      color: row.team2_color ?? t2?.color ?? FALLBACK_COLOR,
    },
    date: row.starts_at,
    venue: row.venue ?? null,
    isCompleted: Boolean(row.is_completed),
    winnerId: row.winner_id ?? null,
    isLive: false,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchDbMatch(id: string): Promise<MatchInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('matches').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapDbMatch(data);
}

// All non-cricket matches, grouped for the sports directory.
export async function fetchOtherSportMatches(): Promise<MatchInfo[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .neq('sport', 'cricket')
    .order('starts_at', { ascending: true })
    .limit(200);
  if (error) return [];
  return (data ?? []).map(mapDbMatch);
}

// Results for grading Calls across every sport: matchId -> winnerId,
// plus season ordering for streaks. Falls back to cricket fixtures when
// Supabase is unreachable.
export async function fetchMatchResults(): Promise<{
  winners: Map<string, string>;
  order: Map<string, number>;
}> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('matches')
      .select('id, winner_id, starts_at')
      .order('starts_at', { ascending: true });
    if (!error && data && data.length > 0) {
      const winners = new Map<string, string>();
      const order = new Map<string, number>();
      data.forEach((row, i) => {
        order.set(row.id, i);
        if (row.winner_id) winners.set(row.id, row.winner_id);
      });
      return { winners, order };
    }
  }
  const winners = new Map<string, string>();
  const order = new Map<string, number>();
  FIXTURES.forEach((f, i) => {
    order.set(f.id, i);
    if (f.isCompleted && f.winnerId) winners.set(f.id, f.winnerId);
  });
  return { winners, order };
}

// Short label like "KKR vs GT" for any match id; cricket resolves locally,
// other sports use the embedded shorts when a row is provided.
export function matchLabel(
  matchId: string,
  embedded?: { team1_short?: string | null; team2_short?: string | null } | null
): string {
  if (embedded?.team1_short && embedded?.team2_short) {
    return `${embedded.team1_short} vs ${embedded.team2_short}`;
  }
  const cricket = getCricketMatchInfo(matchId);
  if (cricket) return `${cricket.team1.short} vs ${cricket.team2.short}`;
  return matchId;
}
