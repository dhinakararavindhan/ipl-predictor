# 🏟️ The Stands

**The home crowd for every sport.** Every match — cricket, football, basketball, anything — gets a hub where fans **Chant** (post, with threaded replies), **Roar** (like), and make their **Call** (predict the winner). Cricket is the flagship: a full IPL 2026 playoff lab with Monte Carlo simulation and AI insights.

## Features

### The tabs
- **Home** — everything in one place: trending stands, live matches, latest blogs and videos, the fan wall
- **Predict** — the Call (match winner) and the Pulse (over-by-over, half-by-half, quarter-by-quarter) on every match
- **Live** — in-play matches across sports, each one a live chant stream
- **Support** — pick your side on every match (heart, not head); fanbase standings
- **Blogs** — long-form fan takes, tied to a sport or match
- **Videos** — YouTube links (highlights, pressers, fan cams) on every match hub
- **IPL Lab** — the original cricket engine: standings, Monte Carlo odds, simulators

### Social — any sport
- **Match Hubs** — Every match has a shareable page (`/match/<id>`) with Support, Calls, Pulse predictions, Videos, and Chants. Add a row to the `matches` table for *any* sport and it gets a hub automatically
- **Sports Directory** — `/sports` lists every league and match with an open hub
- **Fan Profiles** — Every fan has a public page (`/fan/<username>`) with their call record, streaks, badges, and recent chants
- **Fan Leaderboard** — Fans ranked by correct Calls across all sports (`/leaderboard`), with badges like 🔥 On fire and 🎯 Sharpshooter
- **From the Stands** — Latest chants across all matches surface on the home page
- **Admin Moderation** — Report flags on chants, an admin dashboard (`/admin`) to review reports, remove chants, and ban accounts

### Cricket — the flagship lab
- **Live Points Table** — Real-time IPL standings with NRR, form, and qualification probability
- **Monte Carlo Simulation** — 10,000 simulations to compute Top 4/Top 2/Elimination probabilities
- **Match Simulator** — Toggle match results and instantly see how the playoff picture changes
- **AI Insights** — Natural-language analysis of the playoff race (OpenAI or local fallback)
- **Team Pages & Analytics** — Qualification paths, scenarios, strength ratings, probability charts
- **Dark Mode** — Premium sports aesthetic, mobile-first

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Zustand** (state management)
- **Recharts** (data visualization)
- **OpenAI API** (optional AI insights)
- **Supabase** (optional persistence)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
# Optional — app works without these
OPENAI_API_KEY=sk-...           # For AI insights
NEXT_PUBLIC_SUPABASE_URL=...    # For social features (Chants, Roars, Calls)
NEXT_PUBLIC_SUPABASE_ANON_KEY=... 
```

The app works fully without any API keys using local simulation and fallback insights.

## Social Features (Supabase)

Every match gets a hub at `/match/<id>` (e.g. `/match/m56`) where signed-in fans can:

- **Chant** — post under the match (up to 500 characters)
- **Roar** — like a Chant (one Roar per fan per Chant)
- **Call** — predict the winner; Calls lock once the match result is recorded, and the hub shows the crowd's split

Setup:

1. Create a free project at [supabase.com](https://supabase.com/dashboard).
2. Open the SQL editor and run the files in `supabase/migrations/` in order (`0001` through `0005`) — tables, row-level security, signup trigger, fixture seed, moderation, threaded replies, multi-sport matches, and the pulse/support/blogs/videos features.
3. For development, disable **Authentication → Sign In / Up → Confirm email** so password sign-ups work instantly. Leave it on in production.
4. Copy the project URL and anon key from **Project Settings → API** into `.env.local`.

### Sign-in options

The sign-in dialog offers **Google**, **Apple**, **Facebook**, **email + password**, and **mobile (SMS OTP)**. Email works out of the box; the rest are switched on in the Supabase dashboard (the app shows a friendly message if a fan taps a provider that isn't enabled yet):

1. **Google / Apple / Facebook** — Supabase → Authentication → Providers: paste the client ID/secret from each platform's developer console ([provider guides](https://supabase.com/docs/guides/auth/social-login)). Add your site URL (and the app's deep-link) to **Authentication → URL Configuration → Redirect URLs**.
2. **Mobile OTP** — Authentication → Providers → Phone: connect an SMS provider (Twilio, MessageBird, Vonage…). Locally no SMS provider is needed — `supabase/config.toml` ships test numbers (`+919876543210`, `+14155551234`) that accept the code `123456`.
3. OAuth fans arrive with their name and profile photo pre-filled (`0006_auth_providers.sql` teaches the signup trigger to read provider metadata); phone-only fans start as `Fan` and pick a name in onboarding.

> Apple sign-in is required by App Store policy when any other social login is offered in the iOS app — that's why it's included.

### Android & iOS apps

The `android/` and `ios/` folders are native [Capacitor](https://capacitorjs.com) shells around the deployed web app — one codebase, app-store presence, with the mobile bottom tab bar giving it a native feel.

```bash
# 1. Deploy the web app (e.g. Vercel), then point the shells at it:
STANDS_APP_URL=https://your-deployment.vercel.app npx cap sync

# 2. Build & run
npm run mobile:android   # opens Android Studio → Run ▶ / Build > Generate Signed App Bundle
npm run mobile:ios       # opens Xcode (macOS) → Run ▶ / Product > Archive for the App Store
```

- App id `app.thestands.fan`, name **The Stands**, on both platforms.
- Android needs Android Studio; iOS needs Xcode on macOS (`cd ios/App && pod install` first).
- Store listing needs your own icons/splash screens — `npx @capacitor/assets generate` builds them all from one logo.
- OAuth logins in the shells use the same hosted redirect flow as the web; add your deployment URL to Supabase's redirect allow-list.

### Admin & moderation

Admins keep the feeds clean: they can remove any Chant, review fan reports, and ban/unban accounts. Fans see a flag button on every Chant to report it.

1. Sign up in the app with the account you want as admin.
2. In the Supabase SQL editor, run:

   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```

3. Reload the app — a **Moderation** entry appears in your account menu (or go to `/admin`).

Admins also grade **Pulse** segments as a match unfolds (locks that phase and scores everyone's picks):

```sql
insert into public.segment_results (match_id, segment, winner_team_id)
values ('m60', 'ov1_5', 'kkr')
on conflict (match_id, segment) do update set winner_team_id = excluded.winner_team_id;
```

And can feature a match on the Live tab with `update public.matches set is_live = true where id = 'fb1';`

The dashboard shows totals (fans, chants, roars, calls, reports), the reported-chants queue (delete the chant, ban the author, or dismiss the report), and the latest chants across all matches. All admin powers are enforced by row-level security, and privilege flags (`is_admin`, `is_banned`) are trigger-guarded so users cannot change them through the API. Banned fans keep read access but cannot post, roar, call, or report.

Local development (no cloud project needed): with Docker running, `npx supabase start` boots a full local stack (`supabase/config.toml` is checked in; migrations apply automatically — use `npx supabase db reset` to reapply). Point `.env.local` at the printed `API_URL` and anon key.

### Adding a sport or match

Any row in the `matches` table gets a hub automatically. In the SQL editor:

```sql
insert into public.matches
  (id, sport, league, team1_id, team2_id, team1_name, team2_name,
   team1_short, team2_short, team1_color, team2_color, venue, starts_at, is_completed)
values
  ('fb9', 'football', 'Premier League', 'liv', 'eve',
   'Liverpool', 'Everton', 'LIV', 'EVE', '#C8102E', '#003399',
   'Anfield', '2026-09-20T15:00:00Z', false);
```

It appears on `/sports` and gets a hub at `/match/fb9` instantly. When the match is decided, set `is_completed = true` and `winner_id` to the winning team id — Calls lock and the leaderboard grades them. `0004_multisport.sql` ships sample football, basketball, and kabaddi matches to start from.

Notes:

- Accounts are email + password via Supabase Auth; a profile (username, display name, favourite team) is auto-created on signup.
- All writes are protected by Postgres row-level security — the anon key is safe to expose.
- When fixtures change in `lib/data/fixtures.ts`, re-sync the `matches` table with `npx tsx scripts/generate-matches-sql.ts` and run the output in the SQL editor.
- Realtime updates use Supabase Realtime (enabled by the migration); the UI falls back to 30s polling if unavailable.

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

Add environment variables in the Vercel dashboard under Project Settings → Environment Variables.

## Project Structure

```
the-stands/
├── app/
│   ├── page.tsx              # Home — Points table + insights
│   ├── simulator/page.tsx    # Match simulator
│   ├── analytics/page.tsx    # Charts + probability breakdown
│   ├── team/[id]/page.tsx    # Team detail page
│   └── api/
│       ├── insights/route.ts # AI insights endpoint
│       └── simulate/route.ts # Simulation endpoint
├── components/
│   ├── PointsTable.tsx
│   ├── ProbabilityCard.tsx
│   ├── FixtureCard.tsx
│   ├── MatchSimulator.tsx
│   ├── AIInsightsPanel.tsx
│   ├── QualificationMeter.tsx
│   ├── NRRChart.tsx
│   ├── ProbabilityChart.tsx
│   └── TeamLogo.tsx
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── store.ts              # Zustand store
│   ├── simulation.ts         # Monte Carlo engine
│   ├── utils.ts              # Helpers
│   └── data/
│       ├── teams.ts          # IPL 2026 team data
│       └── fixtures.ts       # Remaining fixtures
```

## Simulation Engine

The Monte Carlo engine:
1. Computes win probability for each match using team strength, batting/bowling ratings, recent form, and home advantage
2. Runs 10,000 simulations of the remaining season
3. Tracks finish positions across all simulations
4. Outputs Top 4%, Top 2%, Elimination%, and average finish for each team

## Adding Live Data

The architecture is designed for easy live data integration:
- Replace `lib/data/teams.ts` with a Supabase query
- Replace `lib/data/fixtures.ts` with a live API fetch
- Add a cron job or webhook to update standings after each match
