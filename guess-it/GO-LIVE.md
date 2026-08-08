# 🚀 GO-LIVE — the exact remaining clicks

Everything is built, tested and deployed to the `gh-pages` branch. These are the only human
steps left, in order. Total time: ~10 minutes.

## 1. Turn the site on (~20 seconds) — REQUIRED

1. Open **https://github.com/dhinakararavindhan/ipl-predictor/settings/pages**
2. Build and deployment → Source: **Deploy from a branch**
3. Branch: **`gh-pages`**, folder **`/ (root)`** → **Save**

✅ Verify (1–2 min later): https://dhinakararavindhan.github.io/ipl-predictor/ loads the game.
On an Android phone in Chrome, the home screen shows **"Get the app → INSTALL"**.

## 2. Turn on live two-phone racing (~5 minutes) — RECOMMENDED

1. https://render.com → sign up (free) → **New → Blueprint** → connect this repo
   (it reads `guess-it/services/realtime/render.yaml`) → Apply.
2. Copy the service URL, e.g. `https://guessit-realtime.onrender.com`.
3. In GitHub: **Settings → Secrets and variables → Actions → Variables → New variable**
   Name: `REALTIME_URL` · Value: `wss://guessit-realtime.onrender.com/ws`
4. Actions → **deploy-web** → Run workflow.

✅ Verify: 🌎 Live Race on the site creates a room with a code; a second device joins with it.
(Free Render instances sleep when idle — first race of the day takes ~30 s to wake. Fine for
beta; upgrade later if it annoys.)

## 3. Merge PR #1 — main becomes the launch state

https://github.com/dhinakararavindhan/ipl-predictor/pull/1 — CI is green; merging changes no
behavior (deploys already run from this branch too, and keep running from main after merge).

## 4. Tell people (the actual launch)

Send the link or the QR (`guess-it/get-the-game-qr.png`):

> 🎯 I built a game — GUESS IT. Crack codes, guess movies & stars from clues, race AI minds —
> or race ME live. Free, no signup, 2 minutes a game:
> https://dhinakararavindhan.github.io/ipl-predictor/

Start with ~10 people (Beta Plan Wave 0). Watch for the only metric that matters right now:
**do they play a second game without being asked?**

## Optional, when ready

- **Measurement**: create a free https://posthog.com project, add repo variable
  `NEXT_PUBLIC_POSTHOG_KEY` (and `NEXT_PUBLIC_POSTHOG_HOST` if EU), re-run deploy-web →
  anonymous gameplay events flow into dashboards (games started/completed, races, challenges).
  Without the key, zero analytics run — as the privacy page promises.
- **Play Store**: everything you need is in `store-kit/` (descriptions, feature graphic,
  screenshots, form answers) + `DISTRIBUTION.md` Path C. Needs the $25 Play Console account.
- **Review contact email**: the privacy/terms pages list aravindhanott@gmail.com — edit
  `apps/web/app/privacy/page.tsx` + `terms/page.tsx` if you'd rather use a different address.

## If something looks wrong after launch

- Site 404 → step 1 not saved, or wait 2 minutes.
- Live Race says "server not connected" → step 2's variable missing or deploy-web not re-run.
- Any game bug → open an issue; CI + tests will catch regressions on the fix PR.
