# DEVELOPMENT PLAN

## GUESS IT — Universal Guessing Game Platform

**Document:** 9 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** Sprint-by-sprint build instructions for the AI builder (Claude) and human reviewers, implementing BRD §72/§82. One sprint = one reviewable milestone with an explicit Definition of Done (DoD). **No sprint starts until the previous sprint's DoD is green.**

Golden rule (BRD §82): build a beautiful, fully playable **vertical slice** first — one game, one AI opponent, one complete loop — then widen. Sprints 1–4 are that slice.

Working agreements for the AI builder:

1. Read the referenced spec sections before writing code; the spec wins over training-data conventions.
2. Every engine rule change lands with its test in the same commit (Engine §11).
3. Each sprint ends with: green CI, updated `docs/` if reality diverged (spec PR, not silent drift), and a 1-page demo note.
4. No feature ahead of its sprint — resist scaffolding Phase-3 code "while we're here".

---

## SPRINT 1 — Repository & foundations *(specs: Architecture §1–3, §8; BRD §73)*

Monorepo per BRD §73 (`apps/web`, `apps/mobile`, `services/api`, `packages/{game-engine,types,ui,validation}`), toolchain (pnpm workspaces + Gradle), CI pipeline skeleton (lint, typecheck, test, build on PR), environments bootstrapped (dev deploy of a hello-world API + web), Flyway baseline migration with the Architecture §4 schema, Sentry + PostHog wired with a heartbeat event.

**DoD:** a PR merges through green CI and auto-deploys "hello" web+API to dev; schema migrated; one analytics event visible in PostHog.

## SPRINT 2 — Design system & navigation shell *(UI/UX §1, §3; PRD §3)*

`packages/ui` tokens + core components (BigCard, GameChrome, DigitCell, Keypad, OptionCard, HintButton, ResultSheet, Sheet, Toast) with web implementations + Storybook; app shell: Landing (S1), Home (S2, static data), world/game/difficulty pickers (S3–S5, catalog-driven from a stub), How-to-play (S13). Dark theme only this sprint.

**DoD:** click from Landing → Home → picker flow → an empty game screen; Storybook deployed; accessibility lint passing on all components.

## SPRINT 3 — Game engine (TypeScript reference) *(Engine Spec, entire)*

`packages/game-engine`: lifecycle state machine (§3), all five mechanics (§5), scoring (§6), hints (§7), difficulty config (§8), seeded PRNG, `PlayerView`/`FullState` split, `replay()`. **All six test suites from Engine §11**, plus the JSON fixture corpus generator (fixtures are the cross-implementation contract, Architecture §2).

**DoD:** 100% of R-rules mapped to passing tests (traceability table in the package README); fixture corpus (≥ 200 games across mechanics) committed; mutation-testing score ≥ 85% on evaluation code.

## SPRINT 4 — Vertical slice: 5-digit Number Game, end to end *(Engine §5.1; API §2, §4; UI/UX S6a, S7)*

Java engine port for EXACT_NUMBER passing the fixture corpus; API: guest auth, `POST /games`, guess/forfeit endpoints, GameView projection, action log + replay-verified scoring; web: S6a game screen + S7 result, optimistic UI via the TS engine; leakage contract test live in CI.

**DoD:** **a stranger can play a complete, polished Number Game in the browser on dev, from landing to share-less result, in under 3 minutes.** This is the fun checkpoint — a human playtest (≥ 5 people) happens now; findings feed a tuning PR before Sprint 5.

## SPRINT 5 — AI opponent *(AI Spec §1–5; Engine §9; Architecture §7)*

AI module (candidate-elimination Exact Number policies, pacing scheduler, Rookie–Hard params), lazy materialization on poll, versus flow UI (AI picker S5 complete, AIBubble overlay, opponent progress, "how it solved it" in result), dialogue packs for Detective/Calculator/Machine, ArchUnit no-FullState-import rule, AI win-rate ordering test.

**DoD:** versus Number Game playable at 4 levels; measured win rates in the AI Spec §5 target bands over a 200-game scripted playtest; AI feels paced (no instant moves — verified in E2E timing assertions).

## SPRINT 6 — Content engine + Clue Guess *(Content Model, entire; Engine §5.2; UI/UX S6b)*

Content schema live (entities, definitions, namespaces, publish workflow, quality rules §8), CSV/JSON bulk import + minimal admin forms, namespace type-ahead API + component; Clue Guess in both engine implementations (fixtures extended) + S6b screen; knowledge-game AI (solve-roll model). Seed content sprint runs **in parallel**: author the §6 seed plan for Actors + Movies clue games.

**DoD:** Clue Guess playable solo + versus with ≥ 60 published definitions across difficulties; publish-time validation rejects each Content Model §8 violation (test per rule).

## SPRINT 7 — Remaining mechanics *(Engine §5.3–5.5; UI/UX S6c–e)*

Higher/Lower, Image Reveal (incl. per-level image resolution serving, Content Model §4), Multiple Choice (incl. speed multiplier + undo window) — engine (both impls), API, UI, AI policies, fixtures, seed content per the Content Model §6 table.

**DoD:** all 5 mechanics × valid worlds playable; full seed-content bar met (≥ 260 definitions, every cell ≥ 10); Engine fixture corpus ≥ 600 games, both implementations green.

## SPRINT 8 — Progression: profiles, XP, streaks, history, daily *(PRD GI-5, GI-6, GI-8; API §5, §7)*

XP events + levels (R-6.5), streaks (local-tz logic + at-risk state), achievements (MVP six), profile S10, history + replay S11, Daily Challenge (selection job, one-play enforcement, Redis leaderboard, S8), account upgrade flow (S14, guest merge), settings/privacy S12 (export, delete history, delete account).

**DoD:** every PRD GI-5/6/8/9 acceptance criterion demonstrably passing on web; a full week of simulated dailies (clock-mocked) keeps streaks/leaderboards correct across tz edge cases (Kathmandu, UTC−11, DST transition).

## SPRINT 9 — Mobile *(UI/UX throughout; Architecture §2)*

Expo app consuming `packages/ui` RN implementations + shared API client: full flow parity with web (S1→S14), haptics, deep links, EAS build pipeline, device matrix smoke (QA Plan §6).

**DoD:** TestFlight + Play internal builds installable; complete loop (guest → daily → versus game → result → profile) passes on the QA §6 device matrix; crash-free ≥ 99.5% over internal dogfood week.

## SPRINT 10 — Friend Challenge *(PRD GI-7; API §6; UI/UX S9, §4)*

Challenge create/join/compare endpoints, share cards (server-rendered PNG + emoji-grid text), S9 join flow incl. logged-out guest path, result comparison, share sheet integration on all platforms.

**DoD:** two phones, one link: create → send → friend plays same seed → both see head-to-head; challenge link opens correctly from iMessage/WhatsApp/Slack previews (OG cards render).

## SPRINT 11 — Realtime rooms *(API §9; Architecture §6–7)*

WSS/STOMP gateway, room channel events, presence, live opponent progress for friend races, reconnect-via-`since` contract, WebSocket auth.

**DoD:** live race between two clients with kill-and-reconnect chaos test losing zero events; latency overlay shows event delivery p95 < 500 ms on staging.

## SPRINT 12 — Hardening: security, performance, resilience *(Architecture §6; QA Plan §5–8; BRD §58, §74)*

Full QA Plan execution: pen-style pass on the §5 security checklist, rate limits verified, replay/idempotency chaos tests, load test (500 concurrent games, p95 budgets), backup restore drill, accessibility audit (UI/UX §5), analytics event audit vs QA §9 registry, store-compliance pass (privacy manifests, data-safety forms).

**DoD:** every BRD §74 line item checked off with evidence links in a tracking issue; zero open P0/P1.

## SPRINT 13 — Beta *(Beta & Launch Plan §1–5)*

Run the closed beta per Document 11: cohort onboarding, KPI dashboards, weekly triage, tuning PRs (scoring slopes, AI bands, difficulty calibration — config-version bumps only).

**DoD:** Beta exit criteria (Beta & Launch Plan §5) met.

## SPRINT 14 — Launch *(Beta & Launch Plan §6–8)*

Execute the launch checklist: store submissions, prod cutover, rollout monitoring, day-1/7 ops.

**DoD:** publicly downloadable/playable on web + both stores; North Star dashboard live; on-call rotation active.

---

## CROSS-SPRINT TRACKS

- **Content authoring** runs continuously from Sprint 6 (owner: content lead), targeting the Content Model §6 plan by Sprint 7 end.
- **Spec maintenance:** any divergence discovered while building → PR against `docs/` in the same sprint. The traceability table (engine README) and this plan are living documents.
- **Risk watchlist:** dual-engine drift (mitigated by fixture corpus in CI), seed-content shortfall (weekly count vs bar), fun-factor (Sprint 4 playtest gate — if the slice isn't fun, Sprints 5+ pause for a tuning cycle; this is the plan's only intentional stop-the-line).
