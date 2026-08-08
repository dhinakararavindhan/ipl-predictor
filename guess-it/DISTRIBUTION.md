# Getting GUESS IT into players' hands

Three distribution paths, from instant to store-grade.

## Path A — Live now: hosted app + install (no accounts needed)

The web app auto-deploys to **GitHub Pages** on every push (`.github/workflows/deploy-web.yml`):

> **https://dhinakararavindhan.github.io/ipl-predictor/**

Share that link (or the QR below). What players see:

- **Android / desktop Chrome:** an "Install app" banner on the home screen → one tap installs
  GUESS IT with its icon, full-screen, offline-capable. Functionally an app download.
- **iPhone:** Safari → Share → *Add to Home Screen* (the banner shows this hint automatically).

Share kit: `guess-it/get-the-game-qr.png` — print it, post it, drop it in a group chat:

![Get the game](./get-the-game-qr.png)

Suggested share message:

> 🎯 I built a game — GUESS IT. Crack codes, guess actors from clues, race AI minds.
> Free, no signup, 2 minutes a game: https://dhinakararavindhan.github.io/ipl-predictor/

**Custom domain (optional, later):** point a domain (e.g. `guessit.app`) at Pages in repo
Settings → Pages, then change `NEXT_PUBLIC_BASE_PATH` to empty in the workflow. Nothing else
changes.

## Path B — Direct APK (shareable file, ~30 min, free Expo account)

```bash
cd guess-it/apps/mobile
npm install -g eas-cli
eas login                      # free account at expo.dev
eas build --platform android --profile preview
```

EAS builds in the cloud and hands you an **APK download link** — send it to anyone; they enable
"install from unknown sources" and play the native app. The `preview` profile in `eas.json` is
already configured for this.

## Path C — Google Play Store (store-grade)

One-time setup on your side:

1. **Google Play Console** account — $25 one-time, https://play.google.com/console
2. `eas build --platform android` (production profile → AAB, auto-versioned)
3. In Play Console: create app → upload the AAB to *Internal testing* first
4. Fill the listing: name **GUESS IT**, short/full description, screenshots (use the session
   screenshots or capture from a device), the icon (`assets/icon.png`), content rating
   questionnaire (trivia/casual, no user content at MVP), data-safety form (**no data collected
   or shared** — everything is on-device, this makes the form trivial), privacy policy URL
   (host `docs/` privacy text on the Pages site)
5. Promote Internal → Closed testing (your beta cohort, Beta & Launch Plan §1) → Production

Subsequent releases are one command: `eas build --platform android && eas submit -p android`.

**iOS / App Store** works the same via `eas build --platform ios` + `eas submit`, but needs the
$99/yr Apple Developer account. The Expo project is already iOS-clean (bundle verified).

## Which to use when

| Goal | Path |
|---|---|
| "Try my game **today**" — friends, beta testers, the Sprint 4 fun gate | **A** (link/QR) |
| Testers who insist on "a real app file" | **B** (APK) |
| Public launch, discoverability, reviews | **C** (+ keep A for the web) |

Recommended sequence: A now → collect the Beta Plan §2 metrics → B for the beta cohort →
C when the fun bar is proven (BRD §75: optimize for "do people come back?", not downloads).
