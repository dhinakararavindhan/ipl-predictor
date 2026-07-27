-- ═══════════════════════════════════════════════════════════════════════════
-- IPL Playoff Lab — Social layer: Chants, Roars, Calls
-- Run this file in the Supabase SQL editor (or `supabase db push`).
--
-- Vocabulary: a Chant is a post under a match, a Roar is a like on a Chant,
-- a Call is a winner prediction for a match.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Reference table for fixtures ────────────────────────────────────────────
-- Mirrors lib/data/fixtures.ts; re-seed with scripts/generate-matches-sql.ts
-- when fixtures change. Calls lock via RLS once is_completed is true (the
-- fixture dataset is a season snapshot, so wall-clock time can't be used);
-- starts_at (19:30 IST approximation) is informational.
create table public.matches (
  id text primary key,              -- 'm1'..'m70'
  team1_id text not null,           -- 'rcb', 'csk', ...
  team2_id text not null,
  starts_at timestamptz not null,
  is_completed boolean not null default false
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  favorite_team_id text,            -- 'rcb' etc.; team data lives in the app
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.chants (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index chants_match_idx on public.chants (match_id, created_at desc);

create table public.roars (
  chant_id uuid not null references public.chants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chant_id, user_id)   -- one Roar per user per Chant
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  predicted_team_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, user_id)        -- one Call per user per match
);
create index calls_match_idx on public.calls (match_id);

-- ── Table privileges ────────────────────────────────────────────────────────
-- RLS below decides which rows; these grants decide which verbs. Explicit so
-- the migration works regardless of the project's default privileges.
grant select on public.matches to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.chants to anon, authenticated;
grant insert, delete on public.chants to authenticated;
grant select on public.roars to anon, authenticated;
grant insert, delete on public.roars to authenticated;
grant select on public.calls to anon, authenticated;
grant insert, update on public.calls to authenticated;
-- the sync worker and admin jobs use the service role (bypasses RLS)
grant all on public.matches, public.profiles, public.chants, public.roars, public.calls to service_role;

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Feeds are public to read; users may only write their own rows.
-- matches has no write policies: only the service role / SQL editor edits it.

alter table public.matches enable row level security;
create policy "matches are public" on public.matches
  for select using (true);

alter table public.profiles enable row level security;
create policy "profiles are public" on public.profiles
  for select using (true);
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

alter table public.chants enable row level security;
create policy "chants are public" on public.chants
  for select using (true);
create policy "post own chants" on public.chants
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.matches m where m.id = match_id)
  );
create policy "delete own chants" on public.chants
  for delete using (auth.uid() = user_id);

alter table public.roars enable row level security;
create policy "roars are public" on public.roars
  for select using (true);
create policy "roar as yourself" on public.roars
  for insert with check (auth.uid() = user_id);
create policy "unroar as yourself" on public.roars
  for delete using (auth.uid() = user_id);

alter table public.calls enable row level security;
create policy "calls are public" on public.calls
  for select using (true);
-- Calls can be made and changed only while the match is undecided.
create policy "call before start" on public.calls
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.matches m
                where m.id = match_id and not m.is_completed)
  );
-- The lock must be in USING too: otherwise a decided (locked) call row could
-- be UPDATEd to point at a still-open match, erasing a wrong prediction.
create policy "change call before start" on public.calls
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.matches m
                where m.id = match_id and not m.is_completed)
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.matches m
                where m.id = match_id and not m.is_completed)
  );

-- ── Auto-create a profile on signup ─────────────────────────────────────────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'fan_' || substr(replace(new.id::text, '-', ''), 1, 8),
    split_part(new.email, '@', 1)
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Realtime ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.chants, public.roars, public.calls;

-- ── Seed: fixtures from lib/data/fixtures.ts ────────────────────────────────
-- (generated by scripts/generate-matches-sql.ts)
insert into public.matches (id, team1_id, team2_id, starts_at, is_completed) values
  ('m1', 'srh', 'rcb', '2026-03-28T14:00:00Z', true),
  ('m2', 'kkr', 'mi', '2026-03-29T14:00:00Z', true),
  ('m3', 'csk', 'rr', '2026-03-30T14:00:00Z', true),
  ('m4', 'gt', 'pbks', '2026-03-31T14:00:00Z', true),
  ('m5', 'lsg', 'dc', '2026-04-01T14:00:00Z', true),
  ('m6', 'srh', 'kkr', '2026-04-02T14:00:00Z', true),
  ('m7', 'csk', 'pbks', '2026-04-03T14:00:00Z', true),
  ('m8', 'mi', 'dc', '2026-04-04T14:00:00Z', true),
  ('m9', 'rr', 'gt', '2026-04-04T14:00:00Z', true),
  ('m10', 'srh', 'lsg', '2026-04-05T14:00:00Z', true),
  ('m11', 'rcb', 'csk', '2026-04-05T14:00:00Z', true),
  ('m12', 'kkr', 'pbks', '2026-04-06T14:00:00Z', true),
  ('m13', 'rr', 'mi', '2026-04-07T14:00:00Z', true),
  ('m14', 'gt', 'dc', '2026-04-08T14:00:00Z', true),
  ('m15', 'kkr', 'lsg', '2026-04-09T14:00:00Z', true),
  ('m16', 'rcb', 'rr', '2026-04-10T14:00:00Z', true),
  ('m17', 'srh', 'pbks', '2026-04-11T14:00:00Z', true),
  ('m18', 'csk', 'dc', '2026-04-11T14:00:00Z', true),
  ('m19', 'lsg', 'gt', '2026-04-12T14:00:00Z', true),
  ('m20', 'rcb', 'mi', '2026-04-12T14:00:00Z', true),
  ('m21', 'srh', 'rr', '2026-04-13T14:00:00Z', true),
  ('m22', 'csk', 'kkr', '2026-04-14T14:00:00Z', true),
  ('m23', 'rcb', 'lsg', '2026-04-15T14:00:00Z', true),
  ('m24', 'mi', 'pbks', '2026-04-16T14:00:00Z', true),
  ('m25', 'kkr', 'gt', '2026-04-17T14:00:00Z', true),
  ('m26', 'rcb', 'dc', '2026-04-18T14:00:00Z', true),
  ('m27', 'srh', 'csk', '2026-04-18T14:00:00Z', true),
  ('m28', 'rr', 'kkr', '2026-04-19T14:00:00Z', true),
  ('m29', 'pbks', 'lsg', '2026-04-19T14:00:00Z', true),
  ('m30', 'mi', 'gt', '2026-04-20T14:00:00Z', true),
  ('m31', 'srh', 'dc', '2026-04-21T14:00:00Z', true),
  ('m32', 'rr', 'lsg', '2026-04-22T14:00:00Z', true),
  ('m33', 'csk', 'mi', '2026-04-23T14:00:00Z', true),
  ('m34', 'rcb', 'gt', '2026-04-24T14:00:00Z', true),
  ('m35', 'dc', 'pbks', '2026-04-25T14:00:00Z', true),
  ('m36', 'rr', 'srh', '2026-04-25T14:00:00Z', true),
  ('m37', 'csk', 'gt', '2026-04-26T14:00:00Z', true),
  ('m38', 'kkr', 'lsg', '2026-04-26T14:00:00Z', true),
  ('m39', 'rcb', 'dc', '2026-04-27T14:00:00Z', true),
  ('m40', 'pbks', 'rr', '2026-04-28T14:00:00Z', true),
  ('m41', 'mi', 'srh', '2026-04-29T14:00:00Z', true),
  ('m42', 'rcb', 'gt', '2026-04-30T14:00:00Z', true),
  ('m43', 'rr', 'dc', '2026-05-01T14:00:00Z', true),
  ('m44', 'csk', 'mi', '2026-05-02T14:00:00Z', true),
  ('m45', 'srh', 'kkr', '2026-05-03T14:00:00Z', true),
  ('m46', 'pbks', 'gt', '2026-05-03T14:00:00Z', true),
  ('m47', 'lsg', 'mi', '2026-05-04T14:00:00Z', true),
  ('m48', 'dc', 'csk', '2026-05-05T14:00:00Z', true),
  ('m49', 'srh', 'pbks', '2026-05-06T14:00:00Z', true),
  ('m50', 'lsg', 'rcb', '2026-05-07T14:00:00Z', true),
  ('m51', 'dc', 'kkr', '2026-05-08T14:00:00Z', true),
  ('m52', 'rr', 'gt', '2026-05-09T14:00:00Z', true),
  ('m53', 'lsg', 'csk', '2026-05-10T14:00:00Z', true),
  ('m54', 'mi', 'rcb', '2026-05-10T14:00:00Z', true),
  ('m55', 'pbks', 'dc', '2026-05-11T14:00:00Z', false),
  ('m56', 'gt', 'srh', '2026-05-12T14:00:00Z', false),
  ('m57', 'rcb', 'kkr', '2026-05-13T14:00:00Z', false),
  ('m58', 'pbks', 'mi', '2026-05-14T14:00:00Z', false),
  ('m59', 'lsg', 'csk', '2026-05-15T14:00:00Z', false),
  ('m60', 'kkr', 'gt', '2026-05-16T14:00:00Z', false),
  ('m61', 'pbks', 'rcb', '2026-05-17T14:00:00Z', false),
  ('m62', 'dc', 'rr', '2026-05-17T14:00:00Z', false),
  ('m63', 'csk', 'srh', '2026-05-18T14:00:00Z', false),
  ('m64', 'rr', 'lsg', '2026-05-19T14:00:00Z', false),
  ('m65', 'kkr', 'mi', '2026-05-20T14:00:00Z', false),
  ('m66', 'gt', 'csk', '2026-05-21T14:00:00Z', false),
  ('m67', 'srh', 'rcb', '2026-05-22T14:00:00Z', false),
  ('m68', 'lsg', 'pbks', '2026-05-23T14:00:00Z', false),
  ('m69', 'mi', 'rr', '2026-05-24T14:00:00Z', false),
  ('m70', 'kkr', 'dc', '2026-05-24T14:00:00Z', false)
on conflict (id) do update set
  team1_id = excluded.team1_id,
  team2_id = excluded.team2_id,
  starts_at = excluded.starts_at,
  is_completed = excluded.is_completed;
