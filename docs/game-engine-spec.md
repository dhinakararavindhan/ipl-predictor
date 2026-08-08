# GAME ENGINE SPECIFICATION

## GUESS IT — Universal Guessing Game Platform

**Document:** 3 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** The five MVP mechanics (BRD §65): Exact Number, Clue Guess, Higher/Lower, Image Reveal, Multiple Choice — plus the shared game lifecycle, scoring, hints, difficulty, and AI opponent behavior they build on.

This document is the source of truth for game rules. If the UI, API, or AI disagrees with this document, this document wins. Every numbered rule (`R-x.y`) must have at least one automated test (§11).

---

## 1. DESIGN CONSTRAINTS

- **R-1.1 Deterministic.** Given the same game definition, seed, and sequence of player actions, the engine produces byte-identical state and scores. All randomness flows through a seeded PRNG owned by the engine; wall-clock time enters only as explicit action timestamps supplied by the caller.
- **R-1.2 UI-independent.** The engine is a pure library (`packages/game-engine`) with no I/O, no network, no rendering. It is driven entirely through the interface in §10.
- **R-1.3 Server-authoritative.** The engine runs on the server for any game that matters (score, XP, multiplayer). A client-side copy may run for optimistic UI only; its results are always replaced by the server's.
- **R-1.4 No answer leakage.** No engine output intended for an in-progress player view may contain the answer, the answer's id, or data from which the answer is derivable beyond what the mechanic's own feedback reveals. Engine outputs are split into `PlayerView` (safe) and `FullState` (server-only); serializing `FullState` to a client is a defect.
- **R-1.5 Mechanic-agnostic core.** The lifecycle (§3), scoring shell (§6), hints (§7), and difficulty (§8) are shared. A mechanic implements only: guess validation, guess evaluation, feedback shape, win/loss detection, and its scoring parameters.

---

## 2. DEFINITIONS

| Term | Meaning |
|---|---|
| **Game definition** | Immutable content: mechanic, world, difficulty, answer, clues/images/options, parameter overrides. Produced by the Content Engine. |
| **Game instance** | One playthrough of a definition by one player (or player vs AI), with a seed and a state. |
| **Action** | A player/AI input: `submitGuess`, `useHint`, `requestClue`, `revealMore`, `forfeit`, `timeout`. |
| **Attempt** | A consumed guess. Invalid guesses (§per mechanic) never consume attempts. |
| **Potential score** | The score the player would receive if they won *right now*. Monotonically non-increasing during a game. |
| **PlayerView** | The client-safe projection of state. |

---

## 3. GAME LIFECYCLE (all mechanics)

```
CREATED ──start()──▶ ACTIVE ──win condition──▶ WON
                       │ ├──attempts exhausted──▶ LOST
                       │ ├──time exhausted──────▶ LOST
                       │ └──forfeit─────────────▶ FORFEITED
                       └──(vs AI: turn alternation / race, §9)
WON | LOST | FORFEITED ──▶ COMPLETED (score finalized, answer revealed)
```

- **R-3.1** Actions are only accepted in `ACTIVE`. Anything else returns a typed error, never mutates state.
- **R-3.2** The answer appears in `PlayerView` only when status ∈ {WON, LOST, FORFEITED}.
- **R-3.3** State transitions are the only mutation path; every transition is recorded in an append-only action log (this powers history replay, PRD GI-8.1, and server-side anti-cheat replay).
- **R-3.4 Timing.** The server stamps each action on receipt. A game with a time limit `T` is lost at the first action received after `startedAt + T`, and a server-side sweep closes expired games within 60 s even with no incoming action.
- **R-3.5 Abandonment.** An `ACTIVE` single-player game with no action for 24 h moves to `FORFEITED` with score 0.

---

## 4. GUESS NORMALIZATION (text-answer mechanics)

Applies to Clue Guess and Image Reveal.

- **R-4.1** Normalize before comparison: Unicode NFKC, casefold, trim, collapse internal whitespace, strip diacritics, strip leading "the ".
- **R-4.2** A guess matches if its normalization equals the normalization of the answer's canonical name **or any registered alias** (e.g. "SRK" → Shah Rukh Khan). Aliases live in the game definition.
- **R-4.3** With the type-ahead namespace (PRD §8 Q3), the client submits an entity id; the engine still re-validates by name server-side.
- **R-4.4** A guess identical (post-normalization) to a previous guess is invalid: rejected, no attempt consumed, reason `DUPLICATE_GUESS`.

---

## 5. MECHANIC RULES

### 5.1 Exact Number (5-digit code) — the original game

**Setup**

- **R-5.1.1** The secret is a sequence of 5 digits, each 0–9, **all distinct** at MVP. Leading zero is allowed (`04871` is valid). Repeated-digit mode is a future variant behind a flag, not MVP.
- **R-5.1.2** Secret space size: 10·9·8·7·6 = **30,240** possibilities.
- **R-5.1.3** Attempts: 10 by default (difficulty may adjust, §8).

**Guess validity**

- **R-5.1.4** A valid guess is exactly 5 digits with all digits distinct. Anything else (wrong length, non-digit, repeated digit, duplicate of a prior guess) is invalid — rejected with a typed reason, no attempt consumed.

**Evaluation** — for secret `S` and guess `G`, both length 5:

- **R-5.1.5** `exact = |{ i : G[i] = S[i] }|`
- **R-5.1.6** `misplaced = |{ i : G[i] ≠ S[i] and G[i] ∈ S }|` (well-defined because digits are distinct on both sides)
- **R-5.1.7** `miss = 5 − exact − misplaced`
- **R-5.1.8** Feedback is the triple `(exact, misplaced, miss)` **plus** a per-position tag for each digit of the guess: `EXACT | MISPLACED | MISS`. (Worked example — secret `78391`, guess `74162`: position 1 `7` EXACT; `4` MISS; `1` MISPLACED; `6` MISS; `2` MISS → `(1, 1, 3)`, matching BRD §53.)

**End conditions**

- **R-5.1.9** Win: `exact = 5`. Loss: 10th valid guess evaluated without a win, or time out where a timer applies.
- **R-5.1.10** On loss, the secret is revealed with the final state.

### 5.2 Clue Guess

**Setup**

- **R-5.2.1** A game definition contains an answer (entity), 3–7 ordered clues (hardest/vaguest first, per difficulty calibration §8), and an alias list.
- **R-5.2.2** Defaults: 5 guess attempts; clue 1 is shown at start; no timer at MVP (difficulty may add one).

**Actions**

- **R-5.2.3** `requestClue` reveals the next clue. It is always allowed while clues remain, costs score (§6.3), and never consumes a guess attempt.
- **R-5.2.4** `submitGuess` follows §4. Wrong valid guesses consume one attempt each.

**End conditions**

- **R-5.2.5** Win: guess matches (R-4.2). Loss: attempts exhausted. Revealing all clues does **not** end the game.

### 5.3 Higher / Lower

**Setup**

- **R-5.3.1** Definition specifies an integer secret `N` and an inclusive range `[lo, hi]` with `lo ≤ N ≤ hi`. Default range 1–1000; attempts default 8 (note ⌈log₂ 1000⌉ = 10, so 8 attempts requires better-than-blind binary search only on unlucky paths — this is the intended difficulty; see §8).
- **R-5.3.2** A valid guess is an integer within the **current** feasible range `[curLo, curHi]`. Out-of-range and duplicate guesses are invalid, no attempt consumed.

**Evaluation**

- **R-5.3.3** Feedback: `TOO_LOW` (guess < N, sets `curLo = guess + 1`), `TOO_HIGH` (guess > N, sets `curHi = guess − 1`), or `CORRECT`.
- **R-5.3.4** The engine reports the updated `[curLo, curHi]` in `PlayerView` (the UI's narrowing bar).

**End conditions**

- **R-5.3.5** Win: `CORRECT`. Loss: attempts exhausted; secret revealed.

### 5.4 Image Reveal

**Setup**

- **R-5.4.1** Definition: an answer entity, one image, aliases, and a reveal ladder of 5 levels: **10% → 25% → 50% → 75% → 100%**. The reveal method (blur radius, tile unmasking) is a rendering concern; the engine only tracks the level.
- **R-5.4.2** Level 1 (10%) is shown at start. Attempts: 5.

**Actions**

- **R-5.4.3** `revealMore` advances one level; always allowed below level 5; costs score (§6.3); never consumes an attempt.
- **R-5.4.4** Guessing follows §4; wrong valid guesses consume one attempt.

**End conditions**

- **R-5.4.5** Win: match. Loss: attempts exhausted. Reaching 100% reveal does not end the game.

### 5.5 Multiple Choice

**Setup**

- **R-5.5.1** Definition: a question, exactly 4 options in a definition-fixed order, one correct. The engine shuffles presentation order with the game seed (R-1.1) so replays are stable but definitions aren't position-biased.
- **R-5.5.2** Single attempt; timer default 15 s (difficulty adjusts, §8).

**Evaluation & end**

- **R-5.5.3** First lock-in ends the game: correct → WON, incorrect → LOST (correct option identified in the result). Timer expiry → LOST with reason `TIMEOUT`.
- **R-5.5.4** The 300 ms undo window (PRD GI-3.3) is client UX only; the engine sees a single final lock-in.

---

## 6. SCORING

### 6.1 Shell formula (BRD §18)

```
finalScore = round( clamp(baseScore − hintCosts − progressCosts, floor, baseScore)
              × difficultyMult × speedMult ) + bonuses     — if WON
finalScore = participationScore                            — if LOST
finalScore = 0                                             — if FORFEITED
```

- **R-6.1.1** `baseScore = 1000` for every mechanic. `floor = 100`: a win never scores below 100 before multipliers.
- **R-6.1.2** `difficultyMult`: EASY ×1.0, MEDIUM ×1.25, HARD ×1.5, EXPERT ×2.0, MASTER ×2.5.
- **R-6.1.3** `speedMult` applies only to mechanics with a timer: ×1.0 at MVP except Multiple Choice (§6.4). (Accuracy is already captured by progress costs, so the BRD's accuracy multiplier is folded into §6.3 rather than double-counted.)
- **R-6.1.4** `participationScore` on a loss: `50 × (information revealed fraction)` — concretely, Exact Number: `10 × best exact count achieved`; others: 0 at MVP. Keep losses low-value so score is meaningful.
- **R-6.1.5** Potential score (§2) = the formula evaluated as if the next guess won; it is what the game screen displays and it never increases (R-6.3.4).

### 6.2 Bonuses (post-multiplier, flat)

- **R-6.2.1** First-guess win: +250. No hints used: +100. Both stack.
- **R-6.2.2** Streak/opponent-rating bonuses are Phase 3; the field exists in the score breakdown from day one.

### 6.3 Progress costs (the "accuracy" lever, per mechanic)

| Mechanic | Cost event | Cost |
|---|---|---|
| Exact Number | each wrong guess after the 1st | −90 (so a 10th-guess win ≈ 1000 − 810 → clamped path stays ≥ floor) |
| Clue Guess | each clue beyond clue 1 | −150 |
| Clue Guess | each wrong guess | −50 |
| Higher/Lower | each wrong guess | −110 |
| Image Reveal | each reveal level beyond 10% | −175 |
| Image Reveal | each wrong guess | −50 |
| Multiple Choice | — (single attempt) | 0 |

- **R-6.3.1** Costs are deducted from base before multipliers.
- **R-6.3.2** Hint costs (§7) are additional and shown before the hint is confirmed.
- **R-6.3.3** All constants live in one tunable config object versioned with the engine; games store the config version they were scored under so history never retro-changes.
- **R-6.3.4** Invariant: no action may increase potential score.

### 6.4 Multiple Choice speed multiplier

- **R-6.4.1** `speedMult = 0.5 + 0.5 × (timeRemaining / timeLimit)`, i.e. instant answer ×1.0 → last-moment answer ×0.5, linear.

### 6.5 XP (distinct from score, BRD §19/§25)

- **R-6.5.1** XP per BRD §19: correct answer +100, win +150 (versus modes), HARD-or-above game +50, perfect (no hints, no wrong guesses) +100, daily challenge +200. XP is never deducted.
- **R-6.5.2** Level thresholds: level `n` requires cumulative XP `500 × n × (n−1) / 2` (level 2 at 500, level 5 at 5,000, level 10 at 22,500). Tunable, versioned like R-6.3.3.

---

## 7. HINTS (BRD §30)

- **R-7.1** Hint budget per game: EASY 3, MEDIUM 2, HARD 1, EXPERT/MASTER 0.
- **R-7.2** Hint catalog and score costs (deducted like progress costs):

| Hint | Mechanics | Effect | Cost |
|---|---|---|---|
| Reveal digit | Exact Number | Marks one secret position's digit (engine-chosen: leftmost unresolved) | −200 |
| Reveal category | Clue, Image (Anything world) | "This is an actor." | −100 |
| First letter | Clue, Image | First letter of canonical answer | −150 |
| Shrink range | Higher/Lower | Halves the feasible range around N (engine picks the half containing N) | −200 |
| 50/50 | Multiple Choice | Removes 2 wrong options | −300 |

- **R-7.3** A hint never consumes an attempt and is recorded in the action log.
- **R-7.4** Using any hint voids the no-hint bonus and the "Perfect" achievement for that game.

---

## 8. DIFFICULTY (BRD §31)

Difficulty is a *game definition* property assembled from levers, not a runtime multiplier alone:

| Lever | EASY | MEDIUM | HARD |
|---|---|---|---|
| Answer popularity (content tier) | top-tier famous | mid | deep cut |
| Clue ambiguity (Clue Guess) | clue 2 near-identifying | clue 3–4 identifying | only clue 5+ identifying |
| Attempts (Exact Number) | 12 | 10 | 8 |
| Attempts (Higher/Lower, range 1–1000) | 10 | 8 | 7 |
| Timer (Multiple Choice) | 20 s | 15 s | 10 s |
| Hints | 3 | 2 | 1 |

- **R-8.1** EXPERT/MASTER are reserved post-MVP; the enum exists now so content and scores don't migrate later.
- **R-8.2** Content tiering (popularity) is owned by the Content Model doc (Document 4); the engine only consumes the resulting difficulty label and parameter overrides.

---

## 9. AI OPPONENT

### 9.1 Principles

- **R-9.1.1** The AI is an engine client: it acts through the same action interface, sees only `PlayerView`, and cannot read `FullState` (BRD §55). Enforced by module boundary, tested in §11.
- **R-9.1.2** AI behavior is deterministic given the game seed and difficulty (R-1.1).

### 9.2 Exact Number AI (BRD §54)

Candidate-elimination over the 30,240-code space:

```
candidates ← all valid codes
loop: pick guess (per difficulty policy below)
      receive (exact, misplaced) feedback
      candidates ← { c ∈ candidates : evaluate(c as secret, guess) = feedback }
```

- **R-9.2.1** Difficulty policies:
  - **Rookie/Easy:** random candidate, plus a `blunderRate` (Rookie 0.25, Easy 0.15) chance per turn of guessing a random *non*-candidate valid code.
  - **Medium:** random consistent candidate, no blunders.
  - **Hard:** consistent candidate maximizing expected elimination over a sampled subset (≤ 500 candidates sampled for cost).
  - **Expert/Master:** full minimax/entropy guess selection (may guess non-candidates when informationally optimal).
- **R-9.2.2** The set-filtering step is exact and shared across difficulties; only guess *selection* varies.

### 9.3 Knowledge-game AI (Clue, Image, Multiple Choice)

- **R-9.3.1** The AI receives the same clue/reveal stream as the player, plus a per-difficulty *knowledge score* — the probability it can convert an identifying clue into the right answer: Rookie 0.2, Easy 0.35, Medium 0.55, Hard 0.75, Expert 0.9, Master 0.97. Each clue in a definition is annotated (by content tooling) with an `identifiability` value; the AI's solve roll per turn is `knowledge × identifiability`, using the seeded PRNG.
- **R-9.3.2** Until it solves, the AI takes the human-plausible action: request the next clue / reveal, at a pace set by §9.4.

### 9.4 Pacing

- **R-9.4.1** AI actions are scheduled with think-time delays drawn (seeded) from a per-difficulty range — Rookie 8–20 s, Master 3–8 s per action — so races feel human. Delays are simulation-time, injected by the host, keeping the engine clock-free (R-1.1).

### 9.5 Character skin

- **R-9.5.1** AI characters (Detective, Calculator, Machine — BRD §14) are presentation + a difficulty/mechanic affinity mapping. Character choice never changes the rules, only which policy parameters (§9.2–9.4) and dialogue set load.

---

## 10. ENGINE INTERFACE (normative shape)

TypeScript is used as the specification language; the production backend (BRD §50) mirrors this API. The engine ships as `packages/game-engine` with zero runtime dependencies.

```ts
type Mechanic = 'EXACT_NUMBER' | 'CLUE_GUESS' | 'HIGHER_LOWER' | 'IMAGE_REVEAL' | 'MULTIPLE_CHOICE';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MASTER';
type Status = 'CREATED' | 'ACTIVE' | 'WON' | 'LOST' | 'FORFEITED';

interface GameDefinition { id: string; mechanic: Mechanic; world: string; difficulty: Difficulty;
  answer: AnswerSpec; content: MechanicContent; overrides?: Partial<RuleConfig>; }

interface GameInstance { readonly id: string; readonly seed: string; }

// Every action returns the same envelope; engine is a pure state machine.
interface ActionResult { view: PlayerView; events: EngineEvent[]; }

createGame(def: GameDefinition, seed: string, config: RuleConfig): GameInstance;
startGame(g: GameInstance, at: Timestamp): ActionResult;
submitGuess(g: GameInstance, guess: Guess, at: Timestamp): ActionResult;   // includes evaluateGuess
useHint(g: GameInstance, hint: HintType, at: Timestamp): ActionResult;
advance(g: GameInstance, at: Timestamp): ActionResult;                     // requestClue / revealMore
forfeit(g: GameInstance, at: Timestamp): ActionResult;
tick(g: GameInstance, at: Timestamp): ActionResult;                        // timeout sweep (R-3.4)

playerView(g: GameInstance): PlayerView;      // never contains answer while ACTIVE (R-1.4)
fullState(g: GameInstance): FullState;        // server-only
scoreBreakdown(g: GameInstance): ScoreBreakdown; // base, costs[], multipliers, bonuses, final
replay(def: GameDefinition, seed: string, log: Action[]): FullState;       // determinism anchor
```

- **R-10.1** `replay` of any action log reproduces the exact final state and score (this is the anti-cheat and audit primitive, R-3.3).
- **R-10.2** Invalid actions return typed errors (`INVALID_GUESS_FORMAT`, `DUPLICATE_GUESS`, `OUT_OF_RANGE`, `NO_HINTS_LEFT`, `GAME_NOT_ACTIVE`, …) — never exceptions for expected misuse, never state mutation.

---

## 11. TEST REQUIREMENTS

Every `R-` rule above maps to at least one test. Mandatory suites:

1. **Evaluation tables.** Exact Number: exhaustive property test — for random secret/guess pairs, `exact + misplaced + miss = 5`, symmetry checks, plus the BRD §53 worked example as a fixture. Higher/Lower range-narrowing invariants (`curLo ≤ N ≤ curHi` always).
2. **Determinism.** For each mechanic: 1,000 random action logs → `replay` twice → identical serialized `FullState` (R-10.1).
3. **Leakage.** Serialize `PlayerView` at every step of every fixture game; assert the answer (id, canonical name, all aliases, secret digits) appears nowhere until terminal status (R-1.4). This test also runs against real API responses in integration (PRD GI-3.1).
4. **Score monotonicity.** Property test: potential score never increases across any action sequence (R-6.3.4); win score ≥ floor × multiplier (R-6.1.1).
5. **AI fairness.** The AI module compiles with no import path to `FullState`; behavioral test: AI vs. engine over 500 seeded Exact Number games — candidate set always contains the true secret after filtering (R-9.2.2), and win-rate ordering Rookie < Easy < Medium < Hard < Expert < Master holds with statistical significance.
6. **Lifecycle.** Every invalid action in every non-ACTIVE state returns the typed error and leaves state untouched (R-3.1, R-10.2).

---

## 12. RESOLVED DECISIONS (v1.0)

| ID | Decision |
|---|---|
| **D-12.1** | Exact Number keeps the **flat −90/wrong-guess** slope at launch. A pressure-curve variant is validated as a beta experiment (Beta & Launch Plan §4.2); any change ships as a `rule_config_version` bump (R-6.3.3), never a retro-rescore. |
| **D-12.2** | Clue `identifiability` is **hand-authored at MVP** using the Content Model §5.3 rubric; solve-rate estimation replaces it in Phase 4 when play volume exists. |
| **D-12.3** | Higher/Lower ships **integer-range only**; "Closest Guess" (BRD §10.7) is deferred to Phase 3 multiplayer, where it naturally belongs. |
| **D-12.4** | Mobile app-backgrounding **pauses nothing with a timer** (Multiple Choice runs on), and untimed mechanics have nothing to pause; the R-3.5 24 h abandonment sweep is the only clock on them. Simplest honest rule. |
