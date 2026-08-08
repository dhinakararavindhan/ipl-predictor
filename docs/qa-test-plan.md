# QA / TEST PLAN

## GUESS IT — Universal Guessing Game Platform

**Document:** 10 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** Test strategy, suites, gates, device matrix, security checklist, and the analytics event registry. Engine-internal suites are normative in Engine Spec §11; this document adds everything around them and defines *when a build may ship*.

---

## 1. STRATEGY

Test pyramid, strictest at the bottom:

```
        E2E (Playwright web · Maestro mobile)     — few, golden paths
      API contract + integration (Testcontainers) — every endpoint, every error
    Engine conformance (fixture corpus, 2 impls)  — the product's physics
  Unit tests (TS + Java)                          — everything else
```

Two properties are **non-negotiable release blockers** at every layer: determinism (same seed + actions ⇒ same outcome) and non-leakage (no answer data before terminal state).

---

## 2. UNIT

- TS packages: Vitest; Java: JUnit 5. Coverage floor 80% lines overall; **engine evaluation code 100% branch + mutation testing (Stryker/PIT) ≥ 85% kill rate** (Sprint 3 DoD).
- Property-based tests (fast-check / jqwik) for: guess evaluation invariants, normalization idempotence (R-4.1), score monotonicity (R-6.3.4), range narrowing (R-5.3.3).

## 3. ENGINE CONFORMANCE (the dual-implementation contract)

The TS reference engine generates the **fixture corpus**: ≥ 600 games (Sprint 7 bar) as JSON — definition, seed, action log, expected `PlayerView` after every step, expected final score breakdown. CI runs the corpus against **both** implementations; any diff fails the build. Corpus regenerates only via explicit `rule_config_version` bump PRs (Engine R-6.3.3), which must state the gameplay consequence in the PR description.

## 4. API CONTRACT & INTEGRATION

- Testcontainers (Postgres + Redis) integration suite: every endpoint in API Spec §2–§10 — happy path, every declared error code, authz matrix (guest/full/other-user/expired token), idempotency replay, rate-limit 429s.
- Contract drift gate: server DTOs vs generated `packages/types` — mismatch fails CI (API §11).
- Concurrency tests: double-submit same guess (idempotency), simultaneous daily `POST /daily/play` (exactly one 201), challenge join races.
- Time-edge suite (clock-mocked): streak across local midnight in Kathmandu (UTC+5:45), UTC−11, and a DST spring-forward; daily rollover at 00:00 UTC; game timeout sweep (R-3.4); 24 h abandonment (R-3.5).

## 5. SECURITY (BRD §58 checklist → executable)

| # | Check | Method |
|---|---|---|
| 1 | **No answer leakage** | Automated walker: for every mechanic, plays a game step-by-step, dumps every API response + WSS frame, greps for answer id/name/aliases/secret/correct index (Engine R-1.4, API §1.4). Runs on every PR |
| 2 | Full-resolution image not served pre-reveal | Fetch image URL variants at each level; assert resolution ceiling |
| 3 | AuthZ | Cross-user access attempts on every resource → 403/404 |
| 4 | JWT | Expired/garbage/none; refresh reuse → family revocation |
| 5 | Rate limits | Burst scripts hit configured ceilings → 429 + Retry-After |
| 6 | Replay/idempotency | Duplicate keys return byte-identical responses; forged seq rejected |
| 7 | Score tampering | Client-supplied score fields ignored (server replays log — Architecture §5); mutated action log fails replay verification |
| 8 | Injection | SQLi/XSS payloads through guess text, username, clue search; CSP on web |
| 9 | WSS auth (Phase 2) | Connect without JWT / subscribe to foreign room → refused |
| 10 | Secrets | gitleaks in CI; client bundles scanned for API secrets |
| 11 | Dependency audit | osv-scanner / npm audit / OWASP dep-check in CI, fail on critical |
| 12 | Privacy ops | Delete account → login fails, PII gone (DB assertion), history purged; export contains only caller's data |

A structured external pen test is scheduled before Phase 3 (ranked/rating raises stakes); MVP relies on this checklist + the Sprint 12 hardening pass.

## 6. E2E & DEVICE MATRIX

**Web (Playwright):** golden paths — guest first game (each mechanic once); versus AI win + loss; daily play + leaderboard; upgrade flow with progress merge; challenge create/join (Phase 2); delete account. Visual regression on S2, S6a–e, S7 via snapshots.

**Mobile (Maestro):** same golden paths on:

| Device | Why |
|---|---|
| iPhone SE 3 | smallest supported iOS screen |
| iPhone 15/16 | mainstream iOS |
| Pixel 8 | reference Android |
| Galaxy A15 | low-RAM Android mainstream |
| iPad mini / small tablet | layout sanity only |

Floors: iOS 16+, Android 10+. Network chaos in E2E: offline toggle mid-game, 3G throttle, kill-app-resume — state recovers per BRD §48/PRD GI-3.1.

## 7. UX QUALITY GATES

- Accessibility audit per UI/UX §5 checklist (axe-core automated + manual screen-reader pass on S6a and S7) — release gating.
- Copy/tone review of all AI dialogue packs (AI Spec §3.1 rules: no loss-taunting) — before each dialogue content deploy.
- Performance budgets (Lighthouse + custom timers): interactive game frame ≤ 3 s on Moto G-class over 4G; guess round-trip perceived ≤ 500 ms; app cold start ≤ 2.5 s mid-range.

## 8. LOAD, RESILIENCE, OPS

- k6 load: 500 concurrent active games, 50 rps guesses — API p95 ≤ 120 ms server-side (Architecture §5), error rate < 0.1%.
- Daily-spike sim: 2,000 users playing the daily within 10 min of rollover (the realistic worst case).
- Chaos: kill API instance mid-game (state intact via DB), Redis flush (leaderboard rebuilds from `daily_results`), WSS disconnect storm (Phase 2).
- RDS restore drill executed once before beta (Architecture §8).

## 9. ANALYTICS EVENT REGISTRY (single source of truth; names frozen)

`app_opened · game_started · game_completed · game_abandoned · guess_submitted · hint_used · clue_requested · reveal_advanced · game_won · game_lost · daily_played · daily_leaderboard_viewed · share_result · challenge_created · challenge_accepted · rematch · account_upgraded · streak_extended · streak_lost · level_up · achievement_unlocked`

Each with fixed prop schema (world, mechanic, difficulty, mode, aiCharacter?, aiLevel?, score?, durationMs). Sprint 12 audit: fire every event on staging, verify shape in PostHog; a missing/misshapen event is a P1.

## 10. TRIAGE & GATES

Severity: **P0** data loss / leakage / crash-loop / cheating vector → fix before any deploy. **P1** golden-path broken, KPI event broken → blocks release train. **P2** degraded UX with workaround → next sprint. **P3** polish → backlog.

**Release gates (every prod deploy):** CI fully green (units, conformance, contract, leakage walker) · E2E golden paths green on staging · no open P0/P1 · Sentry crash-free ≥ 99.5% on the prior build · performance budgets met. **Beta entry** additionally requires Sprint 12 DoD; **public launch** additionally requires Beta exit criteria (Beta & Launch Plan §5).
