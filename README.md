# 🏏 IPL Playoff Lab

A production-quality IPL 2026 playoff qualification simulator with Monte Carlo simulation and AI-powered insights.

## Features

- **Live Points Table** — Real-time standings with NRR, form, and qualification probability
- **Monte Carlo Simulation** — 10,000 simulations to compute Top 4/Top 2/Elimination probabilities
- **Match Simulator** — Toggle match results and instantly see how the playoff picture changes
- **AI Insights** — Natural-language analysis of the playoff race (OpenAI or local fallback)
- **Team Detail Pages** — Qualification paths, scenarios, strength ratings, finish distribution
- **Analytics Dashboard** — Probability charts, NRR comparison, team strength breakdown
- **Match Hubs (social)** — Every match has a shareable page where fans **Chant** (post), **Roar** (like), and make their **Call** (predict the winner), with a live community split
- **Dark Mode** — Premium sports analytics aesthetic, mobile-first

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
- **Call** — predict the winner; Calls lock when the match starts, and the hub shows the crowd's split

Setup:

1. Create a free project at [supabase.com](https://supabase.com/dashboard).
2. Open the SQL editor and run `supabase/migrations/0001_social.sql` (creates tables, row-level security, the signup trigger, and seeds the fixtures).
3. For development, disable **Authentication → Sign In / Up → Confirm email** so password sign-ups work instantly. Leave it on in production.
4. Copy the project URL and anon key from **Project Settings → API** into `.env.local`.

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
ipl-playoff-lab/
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
