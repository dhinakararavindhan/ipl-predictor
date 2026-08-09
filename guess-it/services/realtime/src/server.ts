/**
 * GUESS IT backend — one deployable service:
 *   • REST API: guest identity, server-authoritative Daily Mystery,
 *     global daily leaderboard          (/api/…)
 *   • WebSocket: live friend races      (/ws)
 *   • Health:                            /health
 *
 * Env:
 *   PORT            (default 8787)
 *   ALLOWED_ORIGIN  comma-separated origins for WS + CORS (default: any)
 *   AUTH_SECRET     HMAC secret for player tokens (set in production!)
 *   DATABASE_URL    Postgres for persistence (else JSON file in DATA_DIR)
 *   DATA_DIR        JSON-store directory (default ./data)
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import { RoomManager, type Player } from './rooms.js';
import { PartyManager, type PartyPlayer } from './party.js';
import type { ClientMsg, ServerMsg } from './protocol.js';
import { createStorage } from './storage.js';
import { DailyApi } from './dailyapi.js';
import { issuePlayer, verifyToken } from './auth.js';

const PORT = Number(process.env.PORT ?? 8787);
const ALLOWED = (process.env.ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const storage = await createStorage();
const daily = new DailyApi(storage);
const manager = new RoomManager(Math.random, storage);
const party = new PartyManager();
setInterval(() => {
  manager.sweep();
  party.sweep();
}, 5 * 60 * 1000).unref();

function sanitizeName(name: unknown): string {
  return (
    String(name ?? '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 14) || 'Player'
  );
}

// ---------------- HTTP API ----------------

function cors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin ?? '';
  const allow = ALLOWED.length === 0 || ALLOWED.includes(origin) ? origin || '*' : ALLOWED[0];
  res.setHeader('access-control-allow-origin', allow);
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,authorization');
  res.setHeader('access-control-max-age', '86400');
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 16_384) throw new Error('body too large');
    chunks.push(c as Buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

function bearer(req: IncomingMessage): string | null {
  const h = req.headers.authorization ?? '';
  return verifyToken(h.startsWith('Bearer ') ? h.slice(7) : undefined);
}

// simple per-IP token bucket for the API
const buckets = new Map<string, { n: number; at: number }>();
function rateLimited(req: IncomingMessage): boolean {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? '?';
  const now = Date.now();
  const b = buckets.get(ip) ?? { n: 0, at: now };
  if (now - b.at > 10_000) {
    b.n = 0;
    b.at = now;
  }
  b.n++;
  buckets.set(ip, b);
  return b.n > 60; // 60 requests / 10 s / IP
}

async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (rateLimited(req)) {
    json(res, 429, { error: 'Slow down.' });
    return;
  }

  try {
    // identity
    if (url.pathname === '/api/players' && req.method === 'POST') {
      const body = await readBody(req);
      const { playerId, token } = issuePlayer();
      await storage.upsertPlayer({ id: playerId, name: sanitizeName(body.name), createdAt: Date.now() });
      json(res, 201, { playerId, token });
      return;
    }

    // daily — auth required
    if (url.pathname.startsWith('/api/daily')) {
      const playerId = bearer(req);
      if (url.pathname === '/api/daily/leaderboard' && req.method === 'GET') {
        json(res, 200, await daily.leaderboard(playerId, url.searchParams.get('date') ?? undefined));
        return;
      }
      if (!playerId) {
        json(res, 401, { error: 'Missing or invalid token.' });
        return;
      }
      if (url.pathname === '/api/daily/start' && req.method === 'POST') {
        const body = await readBody(req);
        json(res, 200, await daily.start(playerId, sanitizeName(body.name)));
        return;
      }
      if (url.pathname === '/api/daily/action' && req.method === 'POST') {
        const body = await readBody(req);
        const out = await daily.action(
          playerId,
          String(body.gameId ?? ''),
          body.action as 'guess' | 'advance' | 'hint' | 'forfeit' | 'tick',
          typeof body.payload === 'string' ? body.payload : undefined,
        );
        json(res, 'error' in out ? 422 : 200, out);
        return;
      }
    }

    json(res, 404, { error: 'Not found.' });
  } catch (e) {
    json(res, 400, { error: e instanceof Error ? e.message : 'Bad request.' });
  }
}

const http = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/health') {
    cors(req, res);
    json(res, 200, { ok: true, rooms: manager.size });
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    void handleApi(req, res, url);
    return;
  }
  res.writeHead(404);
  res.end();
});

// ---------------- WebSocket races ----------------

const wss = new WebSocketServer({ server: http, path: '/ws' });

wss.on('connection', (ws: WebSocket, req) => {
  if (ALLOWED.length > 0) {
    const origin = req.headers.origin ?? '';
    if (!ALLOWED.includes(origin)) {
      ws.close(4003, 'origin not allowed');
      return;
    }
  }

  const id = randomUUID();
  const send = (msg: ServerMsg) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };
  const player: Player = { id, name: 'Player', send };
  const partyPlayer: PartyPlayer = { id, name: 'Player', send, guessesLeft: 0 };

  // basic per-connection rate limit: 20 messages/second
  let bucket = 20;
  const refill = setInterval(() => (bucket = 20), 1000);

  let alive = true;
  ws.on('pong', () => (alive = true));
  const heartbeat = setInterval(() => {
    if (!alive) {
      ws.terminate();
      return;
    }
    alive = false;
    ws.ping();
  }, 30_000);

  ws.on('message', (data) => {
    if (--bucket < 0) return;
    let msg: ClientMsg;
    try {
      msg = JSON.parse(String(data)) as ClientMsg;
    } catch {
      send({ type: 'error', code: 'BAD_JSON', message: 'Malformed message.' });
      return;
    }
    try {
      switch (msg.type) {
        case 'create':
          player.name = sanitizeName(msg.name);
          player.authId = verifyToken(msg.token);
          manager.create(player, msg.config);
          break;
        case 'join':
          player.name = sanitizeName(msg.name);
          player.authId = verifyToken(msg.token);
          manager.join(player, String(msg.code ?? ''));
          break;
        case 'quickmatch':
          player.name = sanitizeName(msg.name);
          player.authId = verifyToken(msg.token);
          manager.quickmatch(player);
          break;
        case 'start':
          manager.start(id);
          break;
        case 'action':
          void manager.action(id, msg.action, typeof msg.payload === 'string' ? msg.payload : undefined);
          break;
        case 'rematch':
          manager.rematch(id);
          break;
        case 'leave':
          manager.leave(id);
          party.leave(id);
          break;
        case 'party_create':
          partyPlayer.name = sanitizeName(msg.name);
          party.create(partyPlayer, msg.mode === 'mystery' ? 'mystery' : 'code');
          break;
        case 'party_join':
          partyPlayer.name = sanitizeName(msg.name);
          party.join(partyPlayer, String(msg.code ?? ''));
          break;
        case 'party_start':
          party.start(id);
          break;
        case 'party_setcode':
          party.setCode(id, String(msg.code ?? ''));
          break;
        case 'party_guess':
          party.guess(id, String(msg.digits ?? ''));
          break;
        case 'party_react':
          party.react(id, String(msg.emoji ?? ''));
          break;
        case 'party_rematch':
          party.rematch(id);
          break;
      }
    } catch {
      // handled errors were already sent to the client; never crash the socket
    }
  });

  ws.on('close', () => {
    clearInterval(refill);
    clearInterval(heartbeat);
    manager.leave(id);
    party.leave(id);
  });
});

http.listen(PORT, () => {
  console.log(`guess-it backend listening on :${PORT} (REST /api, WS /ws)`);
});

process.on('SIGTERM', () => {
  void storage.close().then(() => process.exit(0));
});
