# 🏏 IPL Playoff Lab

A production-quality IPL 2026 playoff qualification simulator with Monte Carlo simulation and AI-powered insights.

> **Also in this repo:** a full [Personal Finance Dashboard](#-personal-finance-dashboard) at `/finance` —
> income/expense tracking, budgets, investments, credit cards & EMIs, goals and net worth,
> with per-user login (Supabase) or a local demo mode.

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

---

# 💰 Personal Finance Dashboard

A complete personal-finance tracker at **`/finance`**, built for everyday monthly budgeting —
anyone with a monthly salary can use it to see exactly where their money goes.

## What it does

- **Dashboard** — total income, expenses, savings & savings rate, investments, net worth,
  cash available, emergency-fund months, credit card dues, upcoming EMIs and SSY progress —
  all for the selected Month & Year, with:
  - 12-month spending trend and net worth trend
  - Expenses by category (click a slice to drill into subcategories)
  - Budget vs actual with per-category "left over / over budget"
  - Top 5 categories with drill-down, payment-mode split, and rule-based quick insights
- **Transactions** — add/edit/delete income and expenses with category, subcategory,
  payment mode and notes; search and filters
- **Budget** — set a monthly budget per category (copy from last month in one click)
- **Investments** — SIP/SSY/FD/stocks contributions with allocation breakdown
- **Credit Cards & EMI** — card dues, due dates, utilisation, EMI progress
- **Net Worth** — assets & liabilities, with a derived 12-month history
- **Goals** — savings goals with progress and "add money"; SSY-style annual targets
- **Monthly Review** — health check, budget report and takeaways for any month
- **Analytics** — income vs expenses, savings-rate trend, top category trends
- **Settings** — export/import JSON backups, sample data, account management

## Accounts & data (two modes)

| Mode | Storage | When |
|---|---|---|
| **Demo mode** | This browser (localStorage), pre-seeded with 13 months of realistic sample data | Works instantly, no setup |
| **Cloud accounts** | Supabase Postgres with row-level security — each user sees only their own data | After the one-time setup below |

### Enable personal accounts (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](supabase/schema.sql) (creates all tables + row-level-security policies).
3. Add to `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

4. Restart the dev server. `/finance/login` now offers email + password sign-up/sign-in,
   and every user gets their own private data. (For instant sign-in without email
   confirmation, disable "Confirm email" under Authentication → Providers → Email.)

## Finance code layout

```
app/finance/            # routes: dashboard, transactions, budget, investments,
                        # credit, net-worth, goals, review, analytics, settings, login
components/finance/     # shell (sidebar/topbar), stat cards, charts, modal
lib/finance/            # types, store (Supabase/localStorage), metrics, demo data
supabase/schema.sql     # database schema + RLS policies
```
