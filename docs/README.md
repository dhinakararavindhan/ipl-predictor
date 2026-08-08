# GUESS IT — Product Documentation

Master document set for the Universal Guessing Game Platform (working name: **GUESS IT**), in the order defined in [BRD §81](./BRD.md#81-immediate-next-steps).

**Status: COMPLETE — all 11 documents approved for build. The package is launch-ready: build begins at Development Plan Sprint 1.**

| # | Document | File | Status |
|---|---|---|---|
| 1 | Business Requirements (BRD) | [BRD.md](./BRD.md) | ✅ v1.0 |
| 2 | Product Requirements (PRD) | [PRD.md](./PRD.md) | ✅ v1.0 |
| 3 | Game Engine Specification | [game-engine-spec.md](./game-engine-spec.md) | ✅ v1.0 |
| 4 | Content Model | [content-model.md](./content-model.md) | ✅ v1.0 |
| 5 | AI Specification | [ai-spec.md](./ai-spec.md) | ✅ v1.0 |
| 6 | System Architecture | [architecture.md](./architecture.md) | ✅ v1.0 |
| 7 | API Specification | [api.md](./api.md) | ✅ v1.0 |
| 8 | UI/UX Specification | [ui-ux-spec.md](./ui-ux-spec.md) | ✅ v1.0 |
| 9 | Development Plan | [development-plan.md](./development-plan.md) | ✅ v1.0 |
| 10 | QA / Test Plan | [qa-test-plan.md](./qa-test-plan.md) | ✅ v1.0 |
| 11 | Beta & Launch Plan | [beta-launch-plan.md](./beta-launch-plan.md) | ✅ v1.0 |

## Precedence

The BRD defines *what and why*; the PRD defines *screens and acceptance criteria*; the **Game Engine Spec is the source of truth for game rules, scoring, and AI behavior** — if any document or code disagrees with it, it wins. The API Spec is the contract between clients and server (`packages/types` is generated from it). All open questions are resolved: PRD §8 (D-8.x) and Engine Spec §12 (D-12.x) are decision registers, not question lists.

## How the documents connect

```
BRD ──▶ PRD ──▶ UI/UX Spec ─────────┐
  │       │                          │
  │       └──▶ Game Engine Spec ──▶ API Spec ──▶ Development Plan ──▶ QA/Test Plan ──▶ Beta & Launch Plan
  │              ▲        ▲
  ├──▶ Content Model      │
  └──▶ AI Spec ───────────┘
```

## Launch-readiness summary

- **Rules:** every game rule is a numbered, testable `R-x.y` with six mandatory test suites (Engine §11) and a dual-implementation fixture corpus (QA §3).
- **Scope discipline:** MVP = 5 worlds × 5 mechanics × solo-vs-AI (+ Friend Challenge fast-follow); everything else is explicitly phased (BRD §67–§71).
- **Content bar:** ≥ 260 seed definitions by Sprint 7, ≥ 300 + a 30-day Daily queue before launch (Content Model §6, Beta Plan §5).
- **Ship gates:** Sprint DoDs (Development Plan), release gates (QA §10), beta exit criteria and the launch checklist (Beta Plan §5–§6).

## Next action

**Development Plan — Sprint 1** (repository & foundations), then the vertical slice: game engine → 5-digit Number Game end-to-end → AI opponent (Sprints 3–5), with the fun-factor playtest gate at Sprint 4.
