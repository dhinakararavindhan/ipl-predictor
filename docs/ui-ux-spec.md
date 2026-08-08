# UI/UX SPECIFICATION

## GUESS IT — Universal Guessing Game Platform

**Document:** 8 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** Design system, every MVP screen (PRD §5 inventory S1–S14) with states and interactions, motion, haptics, accessibility, and the share card. Design language per BRD §43: a modern 2026 game — dark-first, card-based, big type, motion — never a quiz form.

---

## 1. DESIGN SYSTEM

### 1.1 Tokens (dark-first; light theme derives)

```
--bg            #0B0E14      surface base (near-black blue)
--surface       #131826      cards
--surface-2     #1C2333      elevated cards / sheets
--text          #F2F5FA      primary
--text-dim      #8A93A6      secondary
--accent        #6C5CE7      brand violet (primary actions)
--accent-2      #00D2A8      success / EXACT / win
--warn          #FFB020      MISPLACED / streak flame
--danger        #FF5C7A      MISS / loss
--info          #4DA3FF      links, Higher/Lower range
radius: card 20px · button 14px · chip 999px
spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48
elevation: shadows off in dark; use surface steps + 1px inner border rgba(255,255,255,.06)
```

Feedback colors are **never the only signal** — every EXACT/MISPLACED/MISS also renders a label or glyph (✓ / ↔ / ✕) (PRD §6 accessibility).

### 1.2 Typography

Display: **Clash Display / General Sans class** (700) — screen titles, big numbers. Body/UI: **Inter** (400/600). Scale: 34/28/22/17/15/13. Digits in game screens use tabular figures.

### 1.3 Core components

`BigCard` (home tiles) · `GameChrome` (top bar: close, attempts pips, timer ring, potential score) · `DigitCell` · `Keypad` · `ClueStack` · `RangeBar` · `OptionCard` · `HintButton` (shows cost badge) · `AIBubble` (avatar + dialogue line) · `ResultSheet` · `StreakFlame` · `Toast` · `Sheet` (auth/upgrade). All components ship in `packages/ui` with web + RN implementations and identical props.

### 1.4 Motion (250 ms default, ease-out-quint; respect `prefers-reduced-motion`)

- Screen transitions: horizontal push 250 ms.
- Guess feedback: per-digit flip reveal, 80 ms stagger (Exact Number); clue cards slide-in from top; range bar animates narrowing 400 ms spring.
- Win: confetti burst ≤ 1.5 s + score count-up; Loss: brief shake (200 ms) then calm reveal — losses are quiet, never punishing.
- AI activity: typing-dots in `AIBubble` during think time.

### 1.5 Haptics (mobile)

Light impact on keypad tap · success notification on win · warning on invalid guess · none on opponent events (don't buzz the pocket for the AI).

---

## 2. SCREENS

Format: **Layout → States → Interactions → Analytics events** (names per QA Plan §9).

### S1 — Landing (public, web)

Hero: logo, tagline "Think. Guess. Outsmart.", one primary button **PLAY NOW** (→ guest flow, PRD GI-1.1), below-fold: 3 mechanic teaser cards (animated demo loops), Daily teaser, How-to-play links, footer (privacy/terms). SSR, indexable. *Events:* `app_opened`, `landing_play_tapped`.

### S2 — Home

Per BRD §44 exactly: greeting + local-time salutation, `StreakFlame` with count, **Daily Mystery** `BigCard` (state: unplayed → PLAY / played → score + rank + "see leaderboard"), then rows: PLAY SOLO (AI Battle), PLAY WITH FRIEND (Phase 2; pre-Phase-2 shows "Soon" chip), EXPLORE world chips (🎬 🎥 🦸 🔢 🎲). Pull-to-refresh. *States:* first-run (greeting genericized until username set), streak-at-risk (flame pulses after 18:00 local if unplayed). *Events:* `home_viewed`, `daily_opened`.

### S3 — World picker

5 `BigCard`s with world icon + name + "N games" count. Locked cells never shown (server-filtered catalog, API §3). One tap → S4.

### S4 — Game picker

Mechanic cards valid for the world (icon, name, one-line rule, "~2 min" duration chip). "How to play" link per mechanic → S13 sheet.

### S5 — Difficulty + AI picker (one screen)

Difficulty chips EASY/MEDIUM/HARD (default: player's last choice; first-run MEDIUM). If versus mechanic: AI character cards (avatar, name, one-liner, level selector; first-ever game forces Rookie — AI Spec §4.4). Primary button **START**. *Events:* `game_started` (with config props).

### S6 — Game screens (shared `GameChrome` + mechanic body)

Chrome always shows (PRD GI-3.1): close (confirm-forfeit dialog), attempts as pips, timer ring when applicable, potential score ticking down on cost events, `HintButton` with remaining count.

- **S6a Exact Number:** 5 `DigitCell`s, custom `Keypad` (digits grey out once placed — distinct-digit rule R-5.1.4 enforced at input), history rows with per-digit ✓/↔/✕ coloring + (exact, misplaced, miss) counts. Invalid input shakes the row, shows one-line reason, consumes nothing.
- **S6b Clue Guess:** `ClueStack` (revealed clues as cards), **GET NEXT CLUE** button with −150 cost badge, guess field with namespace type-ahead (min 2 chars, top 6 results, keyboard-navigable), wrong guesses listed struck-through.
- **S6c Higher/Lower:** prompt, `RangeBar` visualizing [curLo, curHi] narrowing, numeric input clamped to current range, history chips "500 ↑".
- **S6d Image Reveal:** image at current level, **REVEAL MORE** with −175 badge and level dots (10/25/50/75/100%), guess field as S6b.
- **S6e Multiple Choice:** question, 4 `OptionCard`s, timer ring prominent; tap → 300 ms undo window ("locking in…") → lock (PRD GI-3.3).

Versus overlay (S6a/b/d): opponent `AIBubble` docked top — avatar, name, progress line ("used 2 clues"), typing-dots during think time, dialogue lines as toasts. *Events per action:* `guess_submitted`, `hint_used`, `clue_requested`, `reveal_advanced`.

*Error/offline states:* action fails → inline toast "Connection hiccup — retrying", optimistic state held; on reconnect, `GET ?since=` reconciles (BRD §48). Never lose typed input.

### S7 — Result

`ResultSheet` slides up over the frozen game. Win: 🎉 headline, answer card (name + image + attribution), solve stats, **score breakdown expandable** (base − costs × multipliers + bonuses — builds scoring literacy), +XP bar animating into level progress, streak line. Loss: quiet header "GAME OVER", answer reveal, "How Detective solved it" link (versus, AI Spec §3.2), participation score. Buttons: **PLAY AGAIN** (same config, new game) · **SHARE** (→ §4) · HOME. First-win variant appends the account-upgrade `Sheet` (PRD GI-1.2 — after result, never before). *Events:* `game_won`/`game_lost`, `share_result`, `rematch`.

### S8 — Daily Challenge

Unplayed: mystery card (world/mechanic/difficulty teaser, "everyone gets the same puzzle"), PLAY. Played: my score + rank, top-100 leaderboard (me-row pinned), countdown to next daily (UTC rollover, D-8.2). *Events:* `daily_played`, `daily_leaderboard_viewed`.

### S9 — Challenge join (Phase 2, public link)

Creator avatar + "Aravind challenged you — Clue Guess · Movies · HARD". CTA **ACCEPT** → guest flow if logged out → game with same seed. After finishing: head-to-head comparison screen (two score columns, winner crowned). Already-played → straight to comparison (PRD GI-7.1).

### S10 — Profile

Header (avatar picker, username, level ring), stat grid (BRD §28 minus rating), achievements grid (locked = silhouette + progress "7/10"), settings gear → S12.

### S11 — History

Reverse-chron list (world icon, mechanic, outcome pill, score, date); infinite scroll. Detail: terminal game view + step-through replay slider over the action log.

### S12 — Settings

Account (upgrade CTA for guests; email/provider row for full), Notifications toggles (Phase 2+ rows hidden until live), Privacy: **Export my data / Delete history / Delete account** (destructive = red, typed confirmation "DELETE"), About (version, terms, privacy, licenses).

### S13 — How to play (public, per mechanic)

One screen each: 3-step visual rule explainer + 15-second silent demo animation + worked example (Exact Number uses the 78391/74162 example from Engine R-5.1.8). Reachable pre-auth (SEO) and in-game via sheet.

### S14 — Auth / upgrade sheet

Bottom sheet, never a full-screen wall: "Save your progress" + Apple / Google / Email buttons + **Continue as guest** always visible (PRD GI-1.2). Email path: single field → 6-digit code. Merge success toast: "Progress saved to your account".

---

## 3. NAVIGATION & PLATFORM NOTES

- Mobile: bottom tabs HOME · PLAY · FRIENDS (Phase 2, teaser state) · LEADERBOARD (Phase 3, teaser) · PROFILE. Teaser tabs open a "coming soon" card — visible roadmap, zero dead ends.
- Web: top nav mirroring tabs; game screens use a centered 480 px column — the game is portrait-shaped everywhere.
- One-handed reach: all primary game actions in the bottom 40% of the viewport (BRD §42).
- Deep links: `guessit.app/challenge/{code}`, `/daily`, `/game/{id}` — universal links on iOS/Android.

---

## 4. SHARE CARD (PRD GI-5.1, BRD §27)

Server-rendered 1200×630 (OG) + 1080×1920 (story) PNG: dark card, logo, world icon, spoiler-free result — "Cracked it in 3 clues 🔥 · 842 pts", CTA "Can you beat me? guessit.app/challenge/{code}". **Never includes the answer** (the recipient plays the same puzzle). Emoji-grid text variant for clipboard (Wordle-style): e.g. Exact Number rows as ✓↔✕ strings.

---

## 5. ACCESSIBILITY CHECKLIST (release-gating, QA Plan §7)

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for feedback glyphs on both themes.
- All feedback dual-coded (color + glyph/label); Exact Number playable in grayscale.
- Touch targets ≥ 44 px; keypad ≥ 56 px.
- Screen reader: every game action announces result ("One exact, one misplaced, three miss; six guesses left"); timer announces at 50% and 10%.
- System font scaling to 130% without layout breakage; `prefers-reduced-motion` disables confetti/flips (fade substitutes).
- No information conveyed by haptics alone.
