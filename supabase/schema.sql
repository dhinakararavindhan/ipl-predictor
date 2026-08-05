-- ─────────────────────────────────────────────────────────────────────────────
-- Personal Finance Tracker — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Every table is protected by row-level security: each signed-in user can only
-- ever read and write their own rows.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         date not null,
  type         text not null check (type in ('income', 'expense')),
  category     text not null,
  subcategory  text,
  amount       numeric not null check (amount >= 0),
  payment_mode text not null,
  note         text,
  created_at   timestamptz not null default now()
);

create table if not exists public.budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  month      text not null, -- 'YYYY-MM'
  category   text not null,
  amount     numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, month, category)
);

create table if not exists public.investments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  name       text not null,
  type       text not null,
  amount     numeric not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  icon          text,
  target_amount numeric not null check (target_amount >= 0),
  saved_amount  numeric not null default 0 check (saved_amount >= 0),
  target_date   date,
  annual_target numeric,
  created_at    timestamptz not null default now()
);

create table if not exists public.credit_cards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  bank         text,
  due_amount   numeric not null default 0,
  due_date     date not null,
  credit_limit numeric,
  autopay      boolean default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.emis (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  name             text not null,
  monthly_amount   numeric not null check (monthly_amount >= 0),
  due_day          integer not null check (due_day between 1 and 28),
  remaining_months integer not null default 0,
  total_months     integer,
  interest_rate    numeric,
  created_at       timestamptz not null default now()
);

create table if not exists public.assets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  type       text not null,
  value      numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ── Row-level security ───────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array['transactions','budgets','investments','goals','credit_cards','emis','assets']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows select" on public.%I', t);
    execute format('drop policy if exists "own rows insert" on public.%I', t);
    execute format('drop policy if exists "own rows update" on public.%I', t);
    execute format('drop policy if exists "own rows delete" on public.%I', t);
    execute format('create policy "own rows select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "own rows insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "own rows update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "own rows delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Helpful indexes for the app's query patterns.
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists budgets_user_month_idx on public.budgets (user_id, month);
create index if not exists investments_user_date_idx on public.investments (user_id, date desc);
