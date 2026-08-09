/**
 * Storage layer — pluggable persistence for the GUESS IT backend.
 *
 *   DATABASE_URL set  → Postgres (Neon/Supabase/RDS… anything wire-compatible)
 *   otherwise         → JSON file at DATA_DIR/guessit-data.json (zero-config;
 *                       survives restarts, not host rebuilds — fine for beta)
 *
 * The interface is the contract; both implementations pass the same tests.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PlayerRecord {
  id: string;
  name: string;
  createdAt: number;
  rating?: number; // Elo, default 1000 (BRD §25)
}

export const INITIAL_RATING = 1000;

export interface DailyScoreRow {
  playerId: string;
  name: string;
  score: number;
  outcome: string;
  attemptsUsed: number;
  durationMs: number;
  submittedAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isYou?: boolean;
}

export interface Storage {
  upsertPlayer(p: PlayerRecord): Promise<void>;
  renamePlayer(id: string, name: string): Promise<void>;
  getPlayer(id: string): Promise<PlayerRecord | null>;
  /** Returns false if this player already has a score for the date (once/day). */
  getRating(id: string): Promise<number>;
  setRating(id: string, rating: number): Promise<void>;
  submitDailyScore(dateKey: string, row: DailyScoreRow): Promise<boolean>;
  hasDailyScore(dateKey: string, playerId: string): Promise<DailyScoreRow | null>;
  topDaily(dateKey: string, limit: number): Promise<DailyScoreRow[]>;
  rankFor(dateKey: string, playerId: string): Promise<{ rank: number; total: number } | null>;
  close(): Promise<void>;
}

// ---------------- JSON file store (default) ----------------

interface JsonData {
  players: Record<string, PlayerRecord>;
  daily: Record<string, DailyScoreRow[]>; // dateKey → rows
}

export class JsonFileStore implements Storage {
  private data: JsonData = { players: {}, daily: {} };
  private file: string;
  private dirty = false;
  private timer: ReturnType<typeof setInterval>;

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this.file = join(dataDir, 'guessit-data.json');
    try {
      this.data = JSON.parse(readFileSync(this.file, 'utf8')) as JsonData;
    } catch {
      /* first boot */
    }
    this.timer = setInterval(() => this.flush(), 5000);
    this.timer.unref?.();
  }

  private flush(): void {
    if (!this.dirty) return;
    this.dirty = false;
    try {
      writeFileSync(this.file, JSON.stringify(this.data));
    } catch (e) {
      console.error('storage flush failed:', e);
    }
  }

  async upsertPlayer(p: PlayerRecord): Promise<void> {
    this.data.players[p.id] = { ...this.data.players[p.id], ...p };
    this.dirty = true;
  }

  async renamePlayer(id: string, name: string): Promise<void> {
    const p = this.data.players[id];
    if (p) {
      p.name = name;
      this.dirty = true;
    }
  }

  async getPlayer(id: string): Promise<PlayerRecord | null> {
    return this.data.players[id] ?? null;
  }

  async getRating(id: string): Promise<number> {
    return this.data.players[id]?.rating ?? INITIAL_RATING;
  }

  async setRating(id: string, rating: number): Promise<void> {
    const p = this.data.players[id];
    if (p) {
      p.rating = rating;
      this.dirty = true;
    }
  }

  async submitDailyScore(dateKey: string, row: DailyScoreRow): Promise<boolean> {
    const rows = (this.data.daily[dateKey] ??= []);
    if (rows.some((r) => r.playerId === row.playerId)) return false;
    rows.push(row);
    this.dirty = true;
    return true;
  }

  async hasDailyScore(dateKey: string, playerId: string): Promise<DailyScoreRow | null> {
    return this.data.daily[dateKey]?.find((r) => r.playerId === playerId) ?? null;
  }

  async topDaily(dateKey: string, limit: number): Promise<DailyScoreRow[]> {
    return [...(this.data.daily[dateKey] ?? [])]
      .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs)
      .slice(0, limit);
  }

  async rankFor(dateKey: string, playerId: string): Promise<{ rank: number; total: number } | null> {
    const rows = [...(this.data.daily[dateKey] ?? [])].sort(
      (a, b) => b.score - a.score || a.durationMs - b.durationMs,
    );
    const i = rows.findIndex((r) => r.playerId === playerId);
    return i === -1 ? null : { rank: i + 1, total: rows.length };
  }

  async close(): Promise<void> {
    clearInterval(this.timer);
    this.flush();
  }
}

// ---------------- Postgres store (DATABASE_URL) ----------------

export class PgStore implements Storage {
  // pg is imported lazily so the default path has zero native/network deps
  private pool: import('pg').Pool;

  private constructor(pool: import('pg').Pool) {
    this.pool = pool;
  }

  static async create(databaseUrl: string): Promise<PgStore> {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: databaseUrl, max: 5 });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        rating INT NOT NULL DEFAULT 1000
      );
      ALTER TABLE players ADD COLUMN IF NOT EXISTS rating INT NOT NULL DEFAULT 1000;
      CREATE TABLE IF NOT EXISTS daily_scores (
        date_key TEXT NOT NULL,
        player_id TEXT NOT NULL REFERENCES players(id),
        name TEXT NOT NULL,
        score INT NOT NULL,
        outcome TEXT NOT NULL,
        attempts_used INT NOT NULL,
        duration_ms BIGINT NOT NULL,
        submitted_at BIGINT NOT NULL,
        PRIMARY KEY (date_key, player_id)
      );
      CREATE INDEX IF NOT EXISTS daily_scores_board
        ON daily_scores (date_key, score DESC, duration_ms ASC);
    `);
    return new PgStore(pool);
  }

  async upsertPlayer(p: PlayerRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO players (id, name, created_at) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [p.id, p.name, p.createdAt],
    );
  }

  async renamePlayer(id: string, name: string): Promise<void> {
    await this.pool.query(`UPDATE players SET name = $2 WHERE id = $1`, [id, name]);
  }

  async getPlayer(id: string): Promise<PlayerRecord | null> {
    const r = await this.pool.query(`SELECT id, name, created_at, rating FROM players WHERE id = $1`, [id]);
    if (!r.rows[0]) return null;
    return {
      id: r.rows[0].id,
      name: r.rows[0].name,
      createdAt: Number(r.rows[0].created_at),
      rating: r.rows[0].rating,
    };
  }

  async getRating(id: string): Promise<number> {
    const r = await this.pool.query(`SELECT rating FROM players WHERE id = $1`, [id]);
    return r.rows[0]?.rating ?? INITIAL_RATING;
  }

  async setRating(id: string, rating: number): Promise<void> {
    await this.pool.query(`UPDATE players SET rating = $2 WHERE id = $1`, [id, rating]);
  }

  async submitDailyScore(dateKey: string, row: DailyScoreRow): Promise<boolean> {
    const r = await this.pool.query(
      `INSERT INTO daily_scores (date_key, player_id, name, score, outcome, attempts_used, duration_ms, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (date_key, player_id) DO NOTHING`,
      [dateKey, row.playerId, row.name, row.score, row.outcome, row.attemptsUsed, row.durationMs, row.submittedAt],
    );
    return (r.rowCount ?? 0) > 0;
  }

  async hasDailyScore(dateKey: string, playerId: string): Promise<DailyScoreRow | null> {
    const r = await this.pool.query(
      `SELECT * FROM daily_scores WHERE date_key = $1 AND player_id = $2`,
      [dateKey, playerId],
    );
    const x = r.rows[0];
    if (!x) return null;
    return {
      playerId: x.player_id,
      name: x.name,
      score: x.score,
      outcome: x.outcome,
      attemptsUsed: x.attempts_used,
      durationMs: Number(x.duration_ms),
      submittedAt: Number(x.submitted_at),
    };
  }

  async topDaily(dateKey: string, limit: number): Promise<DailyScoreRow[]> {
    const r = await this.pool.query(
      `SELECT * FROM daily_scores WHERE date_key = $1 ORDER BY score DESC, duration_ms ASC LIMIT $2`,
      [dateKey, limit],
    );
    return r.rows.map((x) => ({
      playerId: x.player_id,
      name: x.name,
      score: x.score,
      outcome: x.outcome,
      attemptsUsed: x.attempts_used,
      durationMs: Number(x.duration_ms),
      submittedAt: Number(x.submitted_at),
    }));
  }

  async rankFor(dateKey: string, playerId: string): Promise<{ rank: number; total: number } | null> {
    const r = await this.pool.query(
      `WITH ranked AS (
         SELECT player_id, RANK() OVER (ORDER BY score DESC, duration_ms ASC) AS rnk,
                COUNT(*) OVER () AS total
         FROM daily_scores WHERE date_key = $1
       ) SELECT rnk, total FROM ranked WHERE player_id = $2`,
      [dateKey, playerId],
    );
    if (!r.rows[0]) return null;
    return { rank: Number(r.rows[0].rnk), total: Number(r.rows[0].total) };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export async function createStorage(): Promise<Storage> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const store = await PgStore.create(url);
    console.log('storage: postgres');
    return store;
  }
  const dir = process.env.DATA_DIR ?? './data';
  console.log(`storage: json file (${dir}) — set DATABASE_URL for real persistence`);
  return new JsonFileStore(dir);
}
