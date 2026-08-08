# GUESS IT — Think. Guess. Outsmart.

The universal guessing-game platform. Product docs live in [`../docs/`](../docs/README.md); this
workspace is the MVP implementation.

```
guess-it/
  packages/
    engine/    Deterministic game engine (TS reference impl of docs/game-engine-spec.md) + tests
    content/   Seed content: 80 published game definitions across 5 worlds + daily challenge
  apps/
    web/       Next.js 16 web app (dark-first, all 4 live mechanics, AI battles, daily, profile)
    mobile/    Expo SDK 57 app — Android + iOS, same engine and content
```

## Run the web app

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3100
npm run build      # production build
```

## Run the Android app

```bash
cd apps/mobile
npm install
npx expo start     # scan the QR with Expo Go on Android, or press "a" for an emulator
```

Build an installable APK / Play Store bundle (requires an Expo account):

```bash
npx eas build --platform android --profile preview    # APK for direct install
npx eas build --platform android                       # AAB for Play Store
```

Or a fully local native build (requires Android SDK): `npx expo run:android`.

## Test the engine

```bash
cd packages/engine
npm install
npm test           # 28 tests: evaluation tables, determinism, no-leakage, scoring, AI
```

## What's implemented (MVP scope, BRD §65)

- **Mechanics:** Crack the Code (5-digit), Clue Guess, Higher/Lower, Quick Pick (multiple choice).
  Image Reveal is engine-complete but content-gated until a licensed image library exists
  (Content Model §4).
- **Worlds:** Actors, Movies, Heroes, Numbers, Anything (chaos mode).
- **AI Battle:** Detective / Calculator / Machine at Rookie→Hard — candidate-elimination play for
  the code game, clue-by-clue solve rolls for knowledge games, human-paced thinking, post-game
  "how it solved it" replay.
- **Progression:** XP + levels, daily streaks, achievements, game history, profile, score
  breakdowns.
- **Daily Mystery:** deterministic shared puzzle rotating at 00:00 UTC — same answer for every
  player with no server required.
- **Privacy:** everything stored locally (localStorage / AsyncStorage); export + delete built in.

## Known deviations from the spec set (intentional, tracked)

1. **Client-side engine** — Engine Spec R-1.3 requires server authority; this MVP has no backend
   yet, so the reference engine runs on-device and no shared leaderboards exist. Server authority
   activates with `services/api` (Development Plan Sprint 4+); the engine's PlayerView/FullState
   split and action-log design are already server-shaped.
2. **Versus races, not turns** — Exact Number versus-AI plays as a simultaneous race (like clue
   games) rather than turn-based alternation (PRD GI-4.1); simpler, and the AI's think-time pacing
   makes it feel fair. Revisit with multiplayer.
3. **Guest-only accounts** — auth providers (PRD GI-1.2) arrive with the backend.
4. **iOS** — the Expo app is iOS-capable, but only Android has been bundle-verified in CI here.
