# AI SPECIFICATION

## GUESS IT — Universal Guessing Game Platform

**Document:** 5 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** AI opponents (characters, difficulty, per-mechanic policies, pacing, dialogue) and game-generation AI (Phase 4). Normative gameplay rules live in Game Engine Spec §9; this document supplies the parameters and the character layer. If a number here conflicts with the engine spec, the engine spec wins.

---

## 1. PRINCIPLES (restated from Engine Spec §9.1)

1. The AI is an engine *client*: it sees only `PlayerView`, acts through the public action interface, and has no import path to `FullState` (R-9.1.1, tested by suite §11.5).
2. AI behavior is deterministic given game seed + difficulty (R-9.1.2). All randomness (blunders, solve rolls, think times) uses the seeded PRNG.
3. Difficulty must be *felt*: measured win rates against the AI must be strictly ordered by level (test suite §11.5).
4. The AI must feel like a mind, not a lookup table: it paces itself, sometimes errs at low levels, and can explain its solve afterward.

---

## 2. DIFFICULTY LADDER — CANONICAL PARAMETERS

Single source of truth for the tunables referenced by Engine Spec §9.2–9.4. Stored as versioned config (like R-6.3.3).

| Parameter | Rookie | Easy | Medium | Hard | Expert | Master |
|---|---|---|---|---|---|---|
| `blunderRate` (Exact Number, per turn) | 0.25 | 0.15 | 0 | 0 | 0 | 0 |
| Guess selection (Exact Number) | random candidate | random candidate | random candidate | sampled max-elimination (≤500) | entropy-optimal | entropy-optimal |
| `knowledge` (clue/image/MC solve factor) | 0.20 | 0.35 | 0.55 | 0.75 | 0.90 | 0.97 |
| Think-time per action (seconds, uniform) | 8–20 | 7–16 | 6–14 | 5–12 | 4–10 | 3–8 |
| Hint usage (where mechanic allows AI hints) | never | never | never | strategic | strategic | strategic |

MVP ships **Rookie–Hard** live; Expert/Master implemented and tested but gated off until Phase 3 (they pair naturally with ranked play).

### 2.1 Per-turn solve model (knowledge games)

Each turn after new information arrives, the AI rolls (seeded):

```
p(solve this turn) = knowledge × identifiability(latest revealed clue/level)
```

For Image Reveal, `identifiability` maps from reveal level: 10%→0.1, 25%→0.3, 50%→0.6, 75%→0.85, 100%→0.97. On a failed roll the AI takes the human-plausible progress action (`requestClue`/`revealMore`); on success it submits the correct answer after its think-time. On a *blundering* level (Rookie/Easy) a failed near-solve may emit a plausible wrong guess drawn from the same namespace (same EntityType, similar popularity tier) — at most one wrong guess per game, so low levels feel fallible, not stupid.

### 2.2 Multiple Choice AI

Single roll: `p(correct) = 0.25 + 0.75 × knowledge`. Answer time drawn from think-time range clipped to the timer.

---

## 3. AI CHARACTER ROSTER

Characters are presentation + affinity, never rules (R-9.5.1). A character binds: identity, a default difficulty band, a per-mechanic modifier, and a dialogue pack.

| Character | Avatar | Band (MVP) | Affinity modifier | Personality voice |
|---|---|---|---|---|
| 🕵️ Detective | trench-coat fox | Easy–Hard | +0.10 `knowledge` on CLUE_GUESS; −0.05 on numeric | Dry, methodical, "the clues never lie" |
| 🔢 Calculator | retro robot calculator | Easy–Hard | Exact Number & Higher/Lower use one selection tier higher; −0.10 `knowledge` on clue games | Literal, precise, occasionally smug in binary |
| 🤖 Machine | sleek android | Medium–Hard | No modifiers — the baseline | Calm, minimal, faintly ominous |
| 🧠 Professor *(Phase 3)* | owl with spectacles | Hard–Expert | +0.10 on MULTIPLE_CHOICE and MC-style trivia | Lecturing, kindly |
| 😈 Trickster *(Phase 3)* | grinning imp | Medium–Expert | Uses non-candidate probing guesses early (information plays that look chaotic) | Taunting, playful |

Modifiers clamp to [0.05, 0.97] on `knowledge` and never alter the *engine's* legality of moves — only policy parameters. Character × difficulty is the matchup shown to the player ("Detective · Hard").

### 3.1 Dialogue pack

Each character ships lines for: game start, after own wrong guess, after player's wrong guess, when AI solves, when player solves, close game, rematch offer. Rules:

- Max 60 characters per line, no more than one line per game event, mutable via content deploy (no app release).
- Never taunt on player *losses* beyond the single loss line; tone stays warm-competitive (safety review in QA Plan §7).
- Lines are selected with the seeded PRNG so replays are stable.

### 3.2 Post-game explainability

"How Detective solved it" (PRD GI-4.1) renders from the AI's action log: for Exact Number, candidate-count after each guess ("2,431 codes remained → guessed 40 715"); for clue games, which clue triggered the solve roll. No new engine surface needed — it's a projection of the log.

---

## 4. FAIRNESS & ANTI-FRUSTRATION GUARDS

1. **No oracle:** the AI's correct answer at solve time comes from the definition only at the moment the engine validates the guess — the AI module holds an entity *reference* it may only submit, never inspect attributes of, pre-solve. (Implementation: the AI receives an opaque `solveToken` it can submit as a guess; the token is issued by the host, not readable.)
2. **Rubber-band OFF by default:** the AI never adjusts mid-game to player performance. Difficulty honesty > drama. (A future "story mode" may revisit; out of scope.)
3. **Rage-quit dampener:** if a player loses 3 consecutive versus games at a level, the next matchup screen pre-selects one level lower (suggestion only, never forced).
4. **First-session guarantee:** the first-ever versus game for a new account uses Rookie regardless of selection UI defaults elsewhere.

---

## 5. TELEMETRY FOR TUNING

Per versus game, log (analytics, not gameplay): character, level, mechanic, player win/loss, margin (attempts/clues delta), and pre-quit abandonment. Weekly tuning review compares measured win rates to targets:

| Level | Target player win rate |
|---|---|
| Rookie | 85–95% |
| Easy | 70–85% |
| Medium | 50–65% |
| Hard | 30–45% |

Out-of-band cells get parameter (not rule) adjustments via config version bump.

---

## 6. GAME-GENERATION AI (Phase 4 — spec'd now, built later)

Pipeline (BRD §33–34), consuming the Content Model:

```
Entity + attributes + relationships
  → clue candidate generation (LLM, structured prompt, cites source attribute per clue)
  → self-check pass (fact grounded in a stored attribute? unique answer in namespace?)
  → rule validation (Content Model §8: monotone identifiability, dedup, final clue ≥ 0.8)
  → safety screen (offensive content, living-person sensitivity, copyright)
  → confidence score ∈ [0,1]
  → publish if ≥ 0.85, else review queue
```

Hard rules:

1. Every generated clue must cite the entity attribute/relationship it derives from; uncited clues are rejected (prevents hallucinated facts — BRD §34 fact correctness).
2. Generated definitions carry `source: "generated"` + `confidence` forever (Content Model §2) and are excluded from Daily Challenge until they have ≥ 50 organic plays with completion rate within 1σ of manual content.
3. Model/prompt versions are stamped on each definition for recall — a bad prompt version can be unpublished in one query.
4. Living-person policy: generated clues about real people limit themselves to public-career facts (roles, awards, dates, works); never appearance, relationships, controversy, or health.

---

## 7. WHAT THE AI IS *NOT* (MVP)

- Not an LLM at runtime: all MVP opponent logic is the deterministic policy above — no inference cost, no latency, no nondeterminism, works offline-adjacent.
- Not a chatbot: dialogue is canned lines; there is no free-text conversation with characters.
- Not adaptive per-player (see §4.2).

LLM-powered opponents ("play against Claude") are a Phase 4+ exploration and require their own safety review.
