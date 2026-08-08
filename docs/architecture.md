# SYSTEM ARCHITECTURE

## GUESS IT — Universal Guessing Game Platform

**Document:** 6 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** Runtime topology, technology choices, data model, real-time design, environments, CI/CD, observability, and the scaling path. Follows BRD §49–§51, §57–§58; keeps the MVP deliberately simple.

---

## 1. TOPOLOGY (MVP)

```
        ┌──────────────┐        ┌───────────────┐
        │  Web (Next.js)│        │ Mobile (Expo) │
        └───────┬──────┘        └───────┬───────┘
                │      HTTPS (REST)      │
                │   WSS (Phase 2 rooms)  │
                └───────────┬────────────┘
                            │
                   ┌────────▼────────┐
                   │  API — Spring   │   Modular monolith (§3)
                   │  Boot (Java 21) │
                   └────────┬────────┘
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼──────┐
        │ PostgreSQL │ │   Redis   │ │  S3 + CDN  │
        │   (RDS)    │ │(ElastiCache)│ │  (images) │
        └───────────┘ └───────────┘ └────────────┘
```

One backend deployable at MVP. No microservices, no queues, no Kubernetes. Everything below is designed so the split-out path (§9) is a refactor, not a rewrite.

---

## 2. TECHNOLOGY (per BRD §50, with MVP decisions)

| Layer | Choice | Decision notes |
|---|---|---|
| Web | Next.js (App Router) + React + TypeScript + Tailwind | SSR for public/SEO pages (landing, how-to-play, daily teaser); client components for game screens |
| Mobile | React Native + Expo + TypeScript | EAS build/submit; shares `packages/types` + API client with web |
| Backend | Java 21 + Spring Boot 3 | Virtual threads on; single Gradle project, module-per-service package |
| Game engine | **TypeScript** (`packages/game-engine`) executed server-side via GraalVM polyglot — **rejected.** Decision: the engine is implemented **twice-by-contract**: normative TypeScript reference (drives web optimistic UI + the conformance fixture suite) and the authoritative Java implementation inside the API. Both must pass the same JSON fixture corpus (QA Plan §3). This honors Engine R-1.3 without polyglot runtime risk |
| DB | PostgreSQL 16 (RDS) | jsonb for attributes/content; no second database at MVP |
| Cache / RT | Redis 7 (ElastiCache) | Sessions-adjacent caches, daily leaderboard ZSET, room pub/sub (Phase 2) |
| Real-time | Spring WebSocket + STOMP over WSS (Phase 2) | REST-only for MVP single-player |
| Infra | AWS: App Runner (API), Vercel or Amplify (web), RDS, ElastiCache, S3+CloudFront, Route 53 | App Runner over ECS/EKS: zero-ops, scales to the beta easily |
| Auth | JWT access (15 min) + rotating refresh (30 d), Apple/Google via OIDC, guest tokens | §6 |
| Analytics | PostHog (self-serve tier) | All BRD §59 events |
| Errors/monitoring | Sentry (web+mobile+JVM), CloudWatch alarms | Release gate per PRD §7 |

---

## 3. BACKEND MODULES (BRD §51 mapped to packages)

```
com.guessit.api
 ├─ user/          auth, guest identity, profile, privacy ops
 ├─ game/          game lifecycle endpoints, PlayerView projection
 ├─ engine/        authoritative rules (mirrors Engine Spec §10)
 ├─ content/       entities, definitions, namespaces, publish workflow
 ├─ ai/            opponent policies + pacing scheduler (AI Spec)
 ├─ social/        challenges/room codes (Phase 2)
 ├─ ranking/       XP, levels, streaks, daily leaderboard
 ├─ notification/  push (Phase 2+, Expo push service)
 ├─ analytics/     event ingestion relay → PostHog
 └─ admin/         minimal content tooling (Content Model §5.1)
```

Module rules: `engine` depends on nothing but `content` DTOs; `ai` may import `engine`'s *client* API only (enforced with ArchUnit tests — implements AI Spec §1.1). Matchmaking service is Phase 3 and absent from MVP code.

---

## 4. DATA MODEL (Postgres, MVP tables)

```
users(id, kind guest|full, email?, auth_provider?, created_at, deleted_at)
guest_links(guest_user_id, full_user_id, merged_at)          -- upgrade audit (PRD GI-1.2)
entity_types(id, name, world, schema jsonb)
entities(id, type_id, canonical_name, aliases text[], popularity_tier,
         locale_tags text[], status, attributes jsonb)
relationships(from_id, to_id, type, meta jsonb)
images(id, entity_id, url, license, attribution, safe_crop jsonb)
game_definitions(id, mechanic, world, difficulty, answer_entity_id?,
                 content jsonb, overrides jsonb, source, confidence?,
                 status, version, rule_config_version)
games(id, definition_id, user_id, mode solo|vs_ai|challenge, ai_character?,
      ai_level?, seed, status, score, xp_awarded, started_at, ended_at)
game_actions(game_id, seq, actor player|ai|system, type, payload jsonb, at)  -- append-only (R-3.3)
daily_challenges(date, definition_id)                        -- one row/day, picked ahead
daily_results(date, user_id, game_id, score, rank_cached?)
challenges(code, creator_game_id, definition_id, seed, created_at, expires_at)  -- Phase 2
challenge_results(code, user_id, game_id, score)
xp_events(user_id, game_id?, kind, amount, at)
streaks(user_id, current, best, last_played_local_date, tz)
achievements(user_id, key, unlocked_at)
```

Key invariants:

- `games.seed` + `game_actions` replay to the final state (Engine R-10.1) — this is the anti-cheat audit trail; `score` is always recomputed from replay before XP is granted.
- Answer-bearing columns (`game_definitions.content`, `answer_entity_id`) are never selected by any endpoint serving an ACTIVE game (repository-layer guard + leakage tests, QA Plan §5).
- `streaks` stores the user's IANA timezone; streak day = local calendar date (PRD GI-5.2), while Daily Challenge date = UTC (PRD decision D-8.2). These are intentionally different clocks.

Redis keys:

```
daily:lb:{date}        ZSET score→user (top-100 + rank queries), TTL 40 days
ns:{world}:{version}   cached namespace index (Content Model §5.4)
room:{code}            Phase 2 room state channel (pub/sub)
ratelimit:{user}:{op}  token buckets (§6)
```

---

## 5. REQUEST FLOW — ONE GUESS (the critical path)

```
client ──POST /v1/games/{id}/guesses {guess}──▶ api.game
  1. authz: game belongs to caller, status ACTIVE (R-3.1)
  2. engine.submitGuess(instance, guess, server_ts)   ← authoritative
  3. append game_actions row (same tx as state update)
  4. if terminal: finalize score via replay, grant XP, update streak,
     daily leaderboard ZADD if daily     (same tx; ZADD after commit)
  5. return PlayerView (+ ai events since last poll, §7)
```

p95 budget: 120 ms server-side; the PRD's 500 ms perceived budget leaves room for mobile RTT. Optimistic UI runs the TS reference engine client-side and reconciles on response.

---

## 6. SECURITY (BRD §58 → concrete)

- TLS everywhere; HSTS on web.
- **Guest auth:** `POST /v1/auth/guest` issues a JWT bound to a server-generated guest id; token stored in localStorage (web, accepted-risk decision D-8.4) / SecureStore (mobile).
- **Upgrade:** OIDC (Apple/Google) or email+code; server merges guest → full atomically (`guest_links`).
- JWT: 15-min access, 30-day rotating refresh with reuse detection (revoke family on reuse).
- Rate limits (Redis token bucket): guesses 5/s/game, game creation 10/min, auth 5/min/IP, share-card render 10/min.
- Input validation at the edge (Bean Validation) *and* in the engine (typed errors, R-10.2).
- Anti-cheat: server-authoritative engine + replay verification before XP; challenge seeds are single-use per user; daily result immutable once written.
- Replay protection: action endpoints carry a client-generated idempotency key; duplicates return the original result.
- WebSocket auth (Phase 2): JWT in the STOMP CONNECT frame, re-validated on subscribe to `room:{code}`.
- Secrets in AWS Secrets Manager; no secrets in the repo or client bundles.

---

## 7. AI OPPONENT EXECUTION

The AI runs **server-side inside the API** (module `ai`). Pacing (Engine R-9.4.1): on versus-game creation the AI's full think-time schedule is drawn from the seed; AI actions are materialized lazily — when the client polls (`GET /v1/games/{id}?since=seq`) or acts, the server executes all AI actions whose scheduled time ≤ now, appends them to the log, and returns them as events. No background workers, no timers, fully deterministic, and an idle game costs nothing. (Phase 2 rooms push the same events over WSS instead of poll.)

---

## 8. ENVIRONMENTS, CI/CD, OBSERVABILITY

- **Envs:** `dev` (shared), `staging` (prod-shaped, seeded content), `prod`. One AWS account per env boundary (dev+staging share).
- **CI (GitHub Actions):** on PR — lint, typecheck, unit tests, engine fixture conformance (both implementations), leakage tests, build. On main — deploy staging, run E2E (Playwright) + API contract tests, manual promote to prod.
- **Migrations:** Flyway, forward-only, applied on deploy before traffic shift.
- **Observability:** Sentry release tracking tied to CI SHA; CloudWatch alarms on p95 latency, 5xx rate, DB connections; PostHog dashboards for the BRD §59 KPI set; a `north-star` dashboard = completed games / DAU (BRD §60).
- **Backups:** RDS PITR 7 days + nightly snapshot 30 days; restore drill before beta (QA Plan §8).

---

## 9. SCALING PATH (write once, so nobody panics later)

| Trigger | Move |
|---|---|
| API CPU-bound on AI/engine | Extract `engine`+`ai` into a stateless service (they're dependency-clean by ArchUnit rule) |
| WSS connections > App Runner comfort | Dedicated realtime gateway (same STOMP contract) behind NLB |
| Leaderboard/matchmaking load | Redis Cluster; matchmaking service (Phase 3) starts separate from day one |
| Content team growth | Admin portal as separate app on the existing `content` module API |
| Read scaling | RDS read replicas for history/profile/namespace reads |

Nothing in the MVP schema or module layout blocks any row of this table — that's the architectural acceptance criterion.
