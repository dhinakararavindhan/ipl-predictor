# GUESS IT — Product Documentation

Master document set for the Universal Guessing Game Platform (working name: **GUESS IT**), in the order defined in [BRD §81](./BRD.md#81-immediate-next-steps).

| # | Document | File | Status |
|---|---|---|---|
| 1 | Business Requirements (BRD) | [BRD.md](./BRD.md) | ✅ v1.0 |
| 2 | Product Requirements (PRD) | [PRD.md](./PRD.md) | 🟡 v0.1 draft — for review |
| 3 | Game Engine Specification | [game-engine-spec.md](./game-engine-spec.md) | 🟡 v0.1 draft — for review |
| 4 | Content Model | — | ⬜ not started |
| 5 | AI Specification | — | ⬜ not started (interim rules in Game Engine Spec §9) |
| 6 | System Architecture | — | ⬜ not started |
| 7 | API Specification | — | ⬜ not started |
| 8 | UI/UX Specification | — | ⬜ not started |
| 9 | Development Plan | — | ⬜ not started (sprint outline in BRD §72) |
| 10 | QA / Test Plan | — | ⬜ not started (engine test suites in Game Engine Spec §11) |
| 11 | Beta & Launch Plan | — | ⬜ not started (outline in BRD §75–§76) |

**Precedence:** the BRD defines *what and why*; the PRD defines *screens and acceptance criteria*; the Game Engine Spec is the source of truth for *game rules, scoring, and AI behavior*. No code should be written against a rule that isn't in the Game Engine Spec.

**Next actions:** resolve the open questions at the end of PRD (§8) and Game Engine Spec (§12), then begin with the vertical slice per BRD §82 — game engine + 5-digit Number Game + one AI opponent.
