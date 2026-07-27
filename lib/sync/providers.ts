// Fixture providers for the sync worker (app/api/sync-fixtures).
// Each provider returns rows shaped for the `matches` table; the worker
// upserts them. Add a provider per data source you subscribe to.

export interface MatchUpsert {
  id: string;
  sport: string;
  league: string;
  team1_id: string;
  team2_id: string;
  team1_name: string;
  team2_name: string;
  team1_short: string;
  team2_short: string;
  team1_color: string | null;
  team2_color: string | null;
  venue: string | null;
  starts_at: string;
  is_live: boolean;
  is_completed: boolean;
  winner_id: string | null;
}

// ── football-data.org (free tier) ───────────────────────────────────────────
// Set FOOTBALL_DATA_TOKEN and FOOTBALL_DATA_COMPETITIONS (e.g. "PL,PD,CL").

const FD_STATUS_LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE']);
const FD_STATUS_DONE = new Set(['FINISHED', 'AWARDED']);

// three-letter slug from a club name, e.g. "Manchester United FC" -> "MUN"
function shortFrom(name: string): string {
  const cleaned = name.replace(/\b(FC|AFC|CF|SC|Club)\b/gi, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0] + (words[1][1] ?? '')).toUpperCase();
  return cleaned.slice(0, 3).toUpperCase();
}

function slugFrom(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchFootballData(): Promise<MatchUpsert[]> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) return [];
  const competitions = (process.env.FOOTBALL_DATA_COMPETITIONS || 'PL').split(',');
  const rows: MatchUpsert[] = [];

  for (const comp of competitions) {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/${comp.trim()}/matches?dateFrom=${dateOffset(-2)}&dateTo=${dateOffset(14)}`,
      { headers: { 'X-Auth-Token': token }, cache: 'no-store' }
    );
    if (!res.ok) continue;
    const data: any = await res.json();
    const league = data?.competition?.name ?? comp;
    for (const m of data?.matches ?? []) {
      const home = m.homeTeam ?? {};
      const away = m.awayTeam ?? {};
      if (!home.name || !away.name) continue;
      const t1 = slugFrom(home.name);
      const t2 = slugFrom(away.name);
      const done = FD_STATUS_DONE.has(m.status);
      let winner: string | null = null;
      if (done && m.score?.winner === 'HOME_TEAM') winner = t1;
      if (done && m.score?.winner === 'AWAY_TEAM') winner = t2;
      rows.push({
        id: `fd${m.id}`,
        sport: 'football',
        league,
        team1_id: t1,
        team2_id: t2,
        team1_name: home.name,
        team2_name: away.name,
        team1_short: home.tla || shortFrom(home.name),
        team2_short: away.tla || shortFrom(away.name),
        team1_color: null,
        team2_color: null,
        venue: m.venue ?? null,
        starts_at: m.utcDate,
        is_live: FD_STATUS_LIVE.has(m.status),
        is_completed: done,
        winner_id: winner,
      });
    }
  }
  return rows;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function dateOffset(days: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  return d.toISOString().slice(0, 10);
}

// ── Clock provider (no API key) ─────────────────────────────────────────────
// Flips is_live purely from starts_at: a match is live from its start time
// until a sport-typical duration has passed. Never completes matches (that
// needs a result source or an admin) — it only keeps the Live tab honest.

const SPORT_DURATION_MS: Record<string, number> = {
  cricket: 4.5 * 3600_000,
  football: 2 * 3600_000,
  basketball: 2.5 * 3600_000,
  kabaddi: 1.5 * 3600_000,
};

export function clockLiveWindow(sport: string): number {
  return SPORT_DURATION_MS[sport] ?? 2.5 * 3600_000;
}
