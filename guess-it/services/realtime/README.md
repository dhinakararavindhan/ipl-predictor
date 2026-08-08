# GUESS IT backend — races, identity, global daily leaderboard

One deployable service, three jobs — all server-authoritative via `@guess-it/engine`
(clients only ever receive `PlayerView`; there is no score-submission endpoint):

- **Live friend races** — WebSocket rooms (`/ws`), in-memory, no database needed
- **Guest identity** — `POST /api/players` issues a player id + HMAC-signed token (no PII)
- **Global Daily Mystery** — `POST /api/daily/start` + `/api/daily/action` run the daily
  through the server engine; finishing persists the score; `GET /api/daily/leaderboard`
  serves the worldwide top 50 + your rank. One play per player per UTC day, enforced
  server-side and surviving restarts.

**Storage** is pluggable (`src/storage.ts`): set `DATABASE_URL` (any Postgres — Neon and
Supabase free tiers work) for real persistence with the schema auto-created, or run with
zero config and scores persist to a JSON file under `DATA_DIR` (fine for beta; resets when
the host rebuilds the instance). Both implementations pass the same test suite.

Set `AUTH_SECRET` in production so player tokens survive restarts (render.yaml generates one).

## Architecture note (deviation from docs/architecture.md, intentional)

The System Architecture doc specifies a Java Spring Boot monolith for the full backend
(accounts, leaderboards, persistence). Live racing needs none of that, so this service is
Node + TypeScript reusing the reference engine — zero rule re-implementation, free-tier
deployable. When the full backend is built, this service either stays as the realtime tier
(Architecture §9 scaling path) or folds into it.

## Run locally

```bash
npm install
npm run dev          # ws://localhost:8787/ws · GET /health
npm test             # 8 race tests: identical puzzles, progress-not-content, win/loss/walkover/rematch
```

The web app connects to `ws://localhost:8787/ws` automatically in dev.

## Deploy (pick one — both free-tier friendly)

**Render** (easiest): dashboard → New → Blueprint → this repo (uses `render.yaml`).
**Fly.io**: `cd guess-it && fly launch --copy-config --no-deploy && fly deploy` (uses `fly.toml`).

Then point the web app at it: set `NEXT_PUBLIC_REALTIME_URL=wss://<your-host>/ws` in
`.github/workflows/deploy-web.yml`'s build env and push — the hosted game's Live Race goes live.
Optionally set `ALLOWED_ORIGIN=https://dhinakararavindhan.github.io` on the server to restrict
connections to your site.

## Protocol

One WebSocket (`/ws`), JSON messages — see `src/protocol.ts`. Flow:
`create` → room code → friend `join`s → host `start` → both get identical boards (same seed) →
`action` (guess/advance/hint) → own `view` updates + opponent `progress` events (counts only,
never content) → `game_over` (WIN / LOSS / DRAW / WALKOVER on disconnect) → `rematch`.

Raceable mechanics: Crack the Code, Clue Guess, Higher/Lower.
