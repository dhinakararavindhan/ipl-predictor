# API SPECIFICATION

## GUESS IT — Universal Guessing Game Platform

**Document:** 7 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** Every MVP + Phase 2 endpoint: paths, auth, request/response shapes, errors, and the WebSocket contract. Shapes are TypeScript-notated; `packages/types` is generated from this document and shared by web, mobile, and contract tests.

Base URL: `https://api.guessit.app/v1` · All bodies JSON · All times ISO-8601 UTC.

---

## 1. CONVENTIONS

### 1.1 Auth

`Authorization: Bearer <accessJWT>` on every endpoint except those marked **public**. Guest and full accounts use identical tokens; `user.kind` differentiates.

### 1.2 Error envelope (all non-2xx)

```ts
{ error: { code: string; message: string; details?: object } }
```

Codes: `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `VALIDATION` 400 · `CONFLICT` 409 · `RATE_LIMITED` 429 (+`Retry-After`) · `GAME_NOT_ACTIVE` 409 · engine reasons (`INVALID_GUESS_FORMAT`, `DUPLICATE_GUESS`, `OUT_OF_RANGE`, `NO_HINTS_LEFT` — Engine R-10.2) 422.

### 1.3 Idempotency

Mutating game endpoints require header `Idempotency-Key: <uuid>`; replays return the original response (Architecture §6).

### 1.4 The leakage rule (normative)

No response may contain answer-bearing data for a game with `status: "ACTIVE"` — no `answerEntityId`, secret, `correctIndex`, unrevealed clue text, or full-resolution image URL. CI contract tests walk every endpoint against an active game and assert this (QA Plan §5).

---

## 2. AUTH

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /auth/guest` | public | Create guest → `{ user, tokens }` |
| `POST /auth/oauth` | public | `{ provider: "apple"\|"google", idToken }` → sign in/up → `{ user, tokens, merged? }` |
| `POST /auth/email/start` | public | `{ email }` → sends 6-digit code |
| `POST /auth/email/verify` | public | `{ email, code }` → `{ user, tokens }` |
| `POST /auth/refresh` | public | `{ refreshToken }` → new token pair (rotation + reuse detection) |
| `POST /auth/upgrade` | bearer (guest) | Same bodies as oauth/email; merges guest progress into resulting full account (PRD GI-1.2) |
| `POST /auth/logout` | bearer | Revokes refresh family |

```ts
interface Tokens { access: string; accessExpiresAt: string; refresh: string }
interface User { id: string; kind: 'guest'|'full'; username: string; avatarId: string;
                 level: number; xp: number; createdAt: string }
```

---

## 3. CATALOG (public, cached)

| Method & path | Purpose |
|---|---|
| `GET /catalog/worlds` | Worlds + playable cells: `{ worlds: [{ id, name, icon, mechanics: [{ mechanic, difficulties: Difficulty[] }] }] }` (Content Model §3 bar applied server-side) |
| `GET /catalog/ai-characters` | `[{ id, name, avatar, blurb, levels: Level[] }]` (AI Spec §3) |
| `GET /catalog/namespaces/{world}?v={version}` | Type-ahead index, paginated `{ version, entries: [{ id, name, aliases }], next? }` (Content Model §5.4) |

---

## 4. GAMES (core loop)

### 4.1 Create & read

**`POST /games`**

```ts
{ world: string; mechanic: Mechanic; difficulty: 'EASY'|'MEDIUM'|'HARD';
  mode: 'solo'|'vs_ai'; aiCharacter?: string; aiLevel?: Level }   // ai* required iff vs_ai
→ 201 { game: GameView }
```

Server picks an unplayed published definition for the cell (least-recently-served to this user), creates instance + seed, auto-starts.

**`GET /games/{id}?since={seq}`** → `{ game: GameView; events: GameEvent[] }` — events with `seq > since`, including lazily-materialized AI actions (Architecture §7). This is the versus-mode poll; interval 2 s.

```ts
interface GameView {           // == engine PlayerView + envelope
  id: string; mechanic: Mechanic; world: string; difficulty: Difficulty;
  mode: 'solo'|'vs_ai'|'challenge'; status: Status; seq: number;
  attemptsUsed: number; attemptsMax: number;
  potentialScore: number; hintsRemaining: number;
  timer?: { limitMs: number; startedAt: string };
  mech: ExactNumberView | ClueView | HigherLowerView | ImageRevealView | MultipleChoiceView;
  opponent?: { character: string; level: Level; progress: OpponentProgress };
  result?: GameResult;         // present only when terminal
}

interface ExactNumberView { guesses: { digits: string; perDigit: ('EXACT'|'MISPLACED'|'MISS')[];
                                       exact: number; misplaced: number; miss: number }[] }
interface ClueView        { cluesRevealed: string[]; cluesTotal: number; nextClueCost: number;
                            wrongGuesses: string[] }
interface HigherLowerView { lo: number; hi: number; curLo: number; curHi: number; unit?: string;
                            prompt: string; history: { guess: number; verdict: 'TOO_LOW'|'TOO_HIGH' }[] }
interface ImageRevealView { imageUrl: string;        // URL at CURRENT reveal resolution only (§1.4)
                            level: 1|2|3|4|5; nextRevealCost: number; wrongGuesses: string[] }
interface MultipleChoiceView { question: string; options: string[] }   // seed-shuffled order

interface GameResult { outcome: 'WON'|'LOST'|'FORFEITED';
  answer: { name: string; entityId?: string; imageUrl?: string; attribution?: string };
  score: number; breakdown: ScoreBreakdown; xp: { total: number; parts: {kind:string;amount:number}[] };
  streak: { current: number; extendedToday: boolean };
  opponentLog?: OpponentSolveStep[] }      // "How Detective solved it" (AI Spec §3.2)
```

### 4.2 Actions

| Method & path | Body | Notes |
|---|---|---|
| `POST /games/{id}/guesses` | `{ guess: string }` — digits for numeric mechanics, entity id or text for clue/image, option index for MC | Engine-validated; invalid → 422 typed reason, no attempt consumed |
| `POST /games/{id}/hints` | `{ type: HintType }` | Cost pre-declared in `GameView`; 422 `NO_HINTS_LEFT` |
| `POST /games/{id}/advance` | `{}` | `requestClue` / `revealMore`; 409 if not applicable |
| `POST /games/{id}/forfeit` | `{}` | Terminal, score 0 |

All return `{ game: GameView; events: GameEvent[] }`.

```ts
type GameEvent =
  | { seq: number; at: string; type: 'AI_GUESSED'; exact?: number; misplaced?: number }  // never the digits pre-terminal
  | { seq: number; at: string; type: 'AI_ADVANCED' }        // AI took a clue/reveal
  | { seq: number; at: string; type: 'AI_SOLVED' }
  | { seq: number; at: string; type: 'DIALOGUE'; line: string }
  | { seq: number; at: string; type: 'TIMEOUT' };
```

(Opponent guess *content* is revealed only in `result.opponentLog` — mid-game you see progress, not information you could free-ride on.)

---

## 5. DAILY CHALLENGE

| Method & path | Auth | Notes |
|---|---|---|
| `GET /daily` | bearer | `{ date, played: boolean, teaser: { world, mechanic, difficulty }, myResult? }` |
| `POST /daily/play` | bearer | Creates today's game (one per user per UTC date — 409 `CONFLICT` if played); then normal §4 endpoints |
| `GET /daily/leaderboard?date=` | bearer | `{ top: [{ rank, username, avatarId, score }], me: { rank, score }? }` — top 100 + caller (Redis ZSET) |

---

## 6. CHALLENGES (Phase 2)

| Method & path | Auth | Notes |
|---|---|---|
| `POST /challenges` | bearer | `{ gameId }` (a finished game) → `{ code, url, expiresAt }` — same definition + seed for recipients |
| `GET /challenges/{code}` | **public** | Teaser: `{ world, mechanic, difficulty, creator: { username, avatarId }, played: boolean }` — never creator's score pre-play (PRD GI-7.1) |
| `POST /challenges/{code}/play` | bearer | Creates the recipient's game; 409 if this user already played this code or is the creator |
| `GET /challenges/{code}/result` | bearer | After caller finished: head-to-head `{ me, them }` comparison |

---

## 7. PROFILE, HISTORY, PRIVACY

| Method & path | Notes |
|---|---|
| `GET /me` | Profile per BRD §28 (rating fields omitted until Phase 3) + streak + achievements summary |
| `PATCH /me` | `{ username?, avatarId? }` — username uniqueness 409 |
| `GET /me/history?cursor=` | Paginated `[{ gameId, world, mechanic, difficulty, mode, outcome, score, endedAt }]` |
| `GET /me/history/{gameId}` | Full replay: `GameView(terminal)` + ordered action log (PRD GI-8.1) |
| `GET /me/achievements` | Full grid with locked/unlocked + progress counters |
| `DELETE /me/history` | Irreversible; 204 |
| `DELETE /me` | Account deletion (PRD GI-9.1); revokes tokens; 204 |
| `GET /me/export` | JSON export of user data (privacy, BRD §38) |

---

## 8. ANALYTICS RELAY

`POST /events` — batched client events `[{ name, at, props }]`, fire-and-forget (202). Server stamps user/session and forwards to PostHog. Event names fixed in QA Plan §9 to the BRD §59 list.

---

## 9. WEBSOCKET (Phase 2)

`wss://api.guessit.app/ws` — STOMP. JWT in CONNECT header (Architecture §6).

- Subscribe `/topic/room.{code}`: server pushes the same `GameEvent` union as §4.2 plus `{ type: 'OPPONENT_JOINED'|'OPPONENT_LEFT'|'OPPONENT_FINISHED' }`.
- Send `/app/room.{code}/ping` for presence.
- REST remains the write path — WSS is receive-only at Phase 2 (BRD §57: REST for persistent ops), which keeps idempotency and authz in one place.
- Reconnect contract: client resumes with `GET /games/{id}?since=seq` — no event loss (PRD/BRD §48).

---

## 10. RATE LIMITS (headers `X-RateLimit-*` on all)

Per Architecture §6: guesses 5/s/game · game creation 10/min · auth 5/min/IP · challenge creation 20/day · events 60/min. 429 with `Retry-After`.

---

## 11. VERSIONING & COMPATIBILITY

- Path-versioned (`/v1`). Additive changes (new fields) are non-breaking; clients must tolerate unknown fields.
- Mobile clients send `X-Client-Version`; server may respond `426 Upgrade Required` past a support floor (store-release lag protection).
- `packages/types` is the contract artifact; CI fails if server DTOs and this spec's generated types drift (QA Plan §4).
