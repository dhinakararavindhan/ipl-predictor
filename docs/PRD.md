# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## GUESS IT — Universal Guessing Game Platform

**Document:** 2 of 11 (see BRD §81)
**Version:** 0.1 (Draft)
**Status:** For review
**Scope:** MVP launch scope per BRD §65–§67, plus Friend Challenge (BRD §68) as a fast-follow. Everything else is explicitly out of scope for this document version.

This PRD translates the BRD (`docs/BRD.md`) into screens, features, user stories, and acceptance criteria. Exact game rules, scoring math, and AI behavior live in `docs/game-engine-spec.md` — this document references them, never redefines them.

---

## 1. SCOPE

### 1.1 In scope (MVP)

| Area | Contents |
|---|---|
| Worlds (categories) | Actors, Movies, Heroes, Numbers, Anything |
| Mechanics | Clue Guess, Exact Number (5-digit), Higher/Lower, Image Reveal, Multiple Choice |
| Modes | Single Player vs AI; Friend Challenge (async + room code, fast-follow) |
| Platforms | Web (Next.js) first; iOS/Android (Expo) tracking the same API |
| Accounts | Guest-first; upgrade to Apple / Google / Email |
| Progression | XP, levels, daily streak, game history, profile |
| Engagement | Daily Challenge (one shared puzzle/day) |
| Sharing | Result card + challenge link |

### 1.2 Out of scope (this version)

Online matchmaking, ranked/rating, tournaments, weekly challenge, leaderboards beyond the Daily Challenge board, friend graph/social service, user-generated games, creator mode, monetization, admin portal (a minimal internal content tool is a separate mini-spec), personalization/recommendations, offline play.

---

## 2. PERSONAS (working set)

- **Casual Chitra** — plays 1–3 games in a break; guest account; mobile web.
- **Competitive Karthik** — plays the Daily Challenge every day, cares about score and streak.
- **Social Sam** — plays because a friend sent a challenge link.

Every acceptance criterion below should survive the question: *"Does this work for a guest user on a phone?"*

---

## 3. INFORMATION ARCHITECTURE

```
/                     Landing (public) → Home (authenticated/guest)
/play                 World picker → Game picker → Difficulty → AI picker
/game/:gameId         Game screen (mechanic-specific renderer)
/result/:gameId       Result screen
/daily                Daily Challenge entry + leaderboard
/challenge/:code      Friend challenge join (public link)
/profile              Profile, stats, achievements
/history              Game history list → game detail
/settings             Account, notifications, privacy
/how-to-play          Public rules pages (one per mechanic)
```

Mobile app navigation: bottom tabs **HOME · PLAY · FRIENDS · LEADERBOARD · PROFILE** (BRD §42); FRIENDS and LEADERBOARD tabs ship disabled-with-teaser until their phases land.

---

## 4. FEATURES, USER STORIES, ACCEPTANCE CRITERIA

Story IDs are stable references for sprint planning (`GI-x.y`).

### 4.1 Guest-first onboarding

**GI-1.1 — As a new visitor, I can start playing without creating an account.**

Acceptance criteria:

- Tapping PLAY from the landing page starts a game in ≤ 2 taps with no auth wall.
- A guest identity (device-scoped) is created transparently; XP, streak, and history accrue to it.
- No email, name, or permission prompt appears before the first game completes.

**GI-1.2 — As a guest, I can upgrade to a full account without losing progress.**

- Upgrade entry points: after first win, on profile, on second session. Never mid-game.
- Apple, Google, and email sign-up all merge the guest's XP, history, and streak into the new account.
- Declining the upgrade never blocks play.

### 4.2 World / game selection

**GI-2.1 — As a player, I can pick a world, mechanic, and difficulty and be in a game within seconds.**

- World picker shows the 5 launch worlds with icon + name; one tap opens available mechanics for that world.
- Only valid world × mechanic combinations are offered (e.g. Exact Number appears only under Numbers/Anything).
- Difficulty options are EASY / MEDIUM / HARD at MVP (EXPERT/MASTER reserved, per Game Engine Spec §8).
- A "Quick Play" button starts a random valid game at the player's typical difficulty in one tap.
- Time from Home to first interactive game frame: ≤ 3 s on a mid-range phone over 4G.

**GI-2.2 — As a player, I choose an AI opponent for versus mechanics.**

- AI characters shown with avatar, name, and difficulty label (BRD §14); MVP ships Detective, Calculator, Machine.
- Non-versus mechanics (solo puzzles) skip this step entirely.

### 4.3 Core game loop (all mechanics)

**GI-3.1 — As a player, I always understand the state of my game.**

The game screen must always show (BRD §45): the challenge, remaining attempts, timer (when the mechanic uses one), current potential score, hint button with remaining hints, guess input, and previous guesses with their feedback. Nothing else.

- Every guess produces feedback in ≤ 500 ms (perceived; optimistic UI allowed, server-confirmed).
- Submitting an invalid guess (wrong format, repeated guess) is rejected inline without consuming an attempt, with a one-line reason.
- Leaving mid-game and returning within the session resumes the game exactly (server is source of truth).
- The answer is never present in any client payload before the game ends (BRD §58; verified by an automated test that inspects all API responses for an in-progress game).

**GI-3.2 — As a player, I can use hints at a visible, fixed cost.**

- Hint types and score costs are defined per-mechanic in Game Engine Spec §7; the UI shows the cost *before* confirming the hint.
- Hints are disabled when none remain or when the mechanic forbids them at the chosen difficulty.

**GI-3.3 — Mechanic-specific screens** (rules in Game Engine Spec §5):

- **Clue Guess:** clues appear as a stack; "Get next clue" shows the score decrement it will cost; free-text guess input with type-ahead against the candidate namespace.
- **Exact Number:** 5 digit cells, custom keypad, per-guess feedback rendered as EXACT / MISPLACED / MISS counts plus per-digit coloring of past guesses.
- **Higher/Lower:** range visualization that narrows with each guess; shows remaining attempts.
- **Image Reveal:** image at current reveal level; "Reveal more" button shows its score cost; guess input as in Clue Guess.
- **Multiple Choice:** 4 large option cards; lock-in on tap with 300 ms undo window; timer visible.

### 4.4 AI opponent (versus play)

**GI-4.1 — As a player, I can race an AI on the same puzzle.**

- Turn-based alternation for Exact Number; simultaneous race with visible opponent progress ("Detective has used 2 clues") for Clue Guess and Image Reveal.
- The AI's moves stream in with human-like delays (per Game Engine Spec §9.4) — never instant.
- The AI plays only from information a player would have (BRD §55); this is enforced in the engine, not the prompt.
- Post-game, the player can see the AI's guess sequence ("How Detective solved it").

### 4.5 Result, XP, streak

**GI-5.1 — As a player, I get a clear result the moment the game ends.**

- Result screen shows: outcome, the answer, solve stats (attempts/clues/time), score breakdown (base × multipliers − hint costs, per Game Engine Spec §6), XP earned, and streak state — matching BRD §46.
- Primary actions: PLAY AGAIN (same config, new answer), SHARE, HOME.
- XP awards follow BRD §19 values; level-ups (BRD §20) get a distinct celebratory moment.

**GI-5.2 — As a player, my daily streak is honest and forgiving.**

- Completing any game (win or lose) preserves the streak for that calendar day in the player's local timezone.
- The streak counter and next milestone (BRD §21) are visible on Home.
- One "streak freeze" is earned per 7-day streak (design lever; confirm in review).

### 4.6 Daily Challenge

**GI-6.1 — As a player, I get one shared puzzle per day.**

- Same answer, mechanic, and difficulty for all players, rotating daily at 00:00 UTC (BRD §22).
- Playable exactly once per day per account; result is locked in.
- A daily leaderboard shows rank, name, score for the top 100 plus the player's own rank.
- Completing it awards +200 XP and maintains the streak.

### 4.7 Friend Challenge (fast-follow, Phase 2)

**GI-7.1 — As a player, I can challenge a friend to the exact game I just played.**

- SHARE on the result screen generates a link/room code (BRD §16.1, §27); opening it lets the friend play the *same* answer and config.
- The challenger's result is hidden until the friend finishes; then both see the head-to-head comparison.
- Works for recipients without the app/account (guest flow, GI-1.1).
- A player cannot open a challenge link for a game they already played (sees comparison instead).

### 4.8 Profile & history

**GI-8.1 — As a player, I can see my profile and past games.**

- Profile shows the BRD §28 field set (rating fields hidden until Phase 3).
- History lists games with category, mechanic, result, score, date (BRD §47); tapping shows the full guess-by-guess replay.
- Achievements grid shows the BRD §29 set with locked/unlocked states; MVP ships First Guess, Code Breaker, Detective, Number Wizard, Perfect, Streak Master.

### 4.9 Settings, privacy, safety

**GI-9.1 — As a user, I control my data.**

- Settings expose: delete account, delete game history, disable notifications (BRD §38, §40).
- Account deletion completes within the session and removes PII; anonymized aggregates may remain.
- All auth flows over HTTPS with JWT + refresh tokens per BRD §58.

---

## 5. SCREEN INVENTORY (MVP)

| # | Screen | Key elements | Notes |
|---|---|---|---|
| S1 | Landing (public) | Value prop, PLAY, How to play, Daily teaser | SEO-indexable |
| S2 | Home | Greeting, streak, Daily Mystery card, Play Solo / Friend / Explore rows | Per BRD §44 |
| S3 | World picker | 5 world cards | |
| S4 | Game picker | Mechanics valid for world | |
| S5 | Difficulty + AI picker | Difficulty chips, AI character cards | Combined screen |
| S6a–e | Game screens | One renderer per mechanic (see GI-3.3) | Shared chrome, mechanic body |
| S7 | Result | Win/lose states per BRD §46 | Share card generation |
| S8 | Daily Challenge | Entry state, played state + leaderboard | |
| S9 | Challenge join | Accept screen from link/code | Phase 2 |
| S10 | Profile | Stats, achievements | |
| S11 | History + game detail | List + replay | |
| S12 | Settings | Account, privacy, notifications | |
| S13 | How to play | One page per mechanic | Public |
| S14 | Auth / upgrade sheet | Apple, Google, email, "continue as guest" | Modal, never a wall |

Design language per BRD §43: dark-first, card-based, large type, motion. A separate UI/UX Specification (Document 8) will detail visuals; this PRD fixes only content and behavior.

---

## 6. NON-FUNCTIONAL REQUIREMENTS

- **Performance:** interactive game frame ≤ 3 s (4G, mid-range device); guess round-trip ≤ 500 ms perceived.
- **Server authority:** all outcomes, scores, and answers computed server-side (BRD §17); the client renders, never decides.
- **Resilience:** on disconnect, show reconnect state; in-progress single-player games resume with full state (BRD §48).
- **Security:** BRD §58 in full; specifically, automated tests assert no answer leakage pre-completion.
- **Analytics:** all BRD §59 events instrumented from day one; North Star = completed games per active player (BRD §60).
- **Accessibility:** all mechanics playable without color as the only signal (Exact Number feedback uses labels + color); touch targets ≥ 44 px; supports system font scaling.
- **Localization:** English at launch; all strings externalized.

---

## 7. RELEASE CRITERIA

MVP ships when every item in BRD §74 is demonstrably true, plus:

1. All GI-1 through GI-6 and GI-8, GI-9 acceptance criteria pass on web and both mobile platforms.
2. Game Engine Spec conformance test suite is green (Game Engine Spec §11).
3. 100+ published games exist across the 5 worlds (Phase 0 content bar, BRD §66).
4. Crash-free sessions > 99.5% in the final beta week.

---

## 8. OPEN QUESTIONS (to resolve before Sprint 3)

1. Streak freeze (GI-5.2): include at MVP or defer?
2. Daily Challenge rollover: 00:00 UTC vs. local midnight — UTC is simpler and keeps one shared board; confirm.
3. Type-ahead answer namespace for Clue/Image games: curated per-world list (recommended) vs. free text with fuzzy matching.
4. Guest identity persistence on web (localStorage) — acceptable loss risk vs. forcing earlier sign-up?
5. Minimum content bar per world × mechanic × difficulty cell before a cell is playable (proposal: 10 games per cell).
