/**
 * GUESS IT realtime server — live friend races over WebSocket.
 * In-memory rooms, server-authoritative engine, no database.
 *
 *   PORT           (default 8787)
 *   ALLOWED_ORIGIN (optional; comma-separated origins allowed to connect)
 */
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import { RoomManager, type Player } from './rooms.js';
import type { ClientMsg, ServerMsg } from './protocol.js';

const PORT = Number(process.env.PORT ?? 8787);
const ALLOWED = (process.env.ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const manager = new RoomManager();
setInterval(() => manager.sweep(), 5 * 60 * 1000).unref();

const http = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true, rooms: manager.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: http, path: '/ws' });

function sanitizeName(name: unknown): string {
  return String(name ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 14) || 'Player';
}

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
          manager.create(player, msg.config);
          break;
        case 'join':
          player.name = sanitizeName(msg.name);
          manager.join(player, String(msg.code ?? ''));
          break;
        case 'start':
          manager.start(id);
          break;
        case 'action':
          manager.action(id, msg.action, typeof msg.payload === 'string' ? msg.payload : undefined);
          break;
        case 'rematch':
          manager.rematch(id);
          break;
        case 'leave':
          manager.leave(id);
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
  });
});

http.listen(PORT, () => {
  console.log(`guess-it realtime listening on :${PORT} (ws path /ws)`);
});
