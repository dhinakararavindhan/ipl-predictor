# 🏏 IPL Playoff Lab

A production-quality IPL 2026 playoff qualification simulator with Monte Carlo simulation and AI-powered insights.

## Features

- **Live Points Table** — Real-time standings with NRR, form, and qualification probability
- **Monte Carlo Simulation** — 10,000 simulations to compute Top 4/Top 2/Elimination probabilities
- **Match Simulator** — Toggle match results and instantly see how the playoff picture changes
- **AI Insights** — Natural-language analysis of the playoff race (OpenAI or local fallback)
- **Team Detail Pages** — Qualification paths, scenarios, strength ratings, finish distribution
- **Analytics Dashboard** — Probability charts, NRR comparison, team strength breakdown
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
NEXT_PUBLIC_SUPABASE_URL=...    # For data persistence
NEXT_PUBLIC_SUPABASE_ANON_KEY=... 
```

The app works fully without any API keys using local simulation and fallback insights.

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
