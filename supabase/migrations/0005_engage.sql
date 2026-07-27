-- ═══════════════════════════════════════════════════════════════════════════
-- The Stands — the core fan loops
-- Run AFTER 0004_multisport.sql in the Supabase SQL editor.
--
-- Adds: Pulse Calls (minute-by-minute / over-by-over / half-by-half
-- predictions), Support (whose side you're on, distinct from your Call),
-- Blogs (fan long-form posts), and match Videos (YouTube links).
-- ═══════════════════════════════════════════════════════════════════════════

-- matches can be flagged live so the Live tab can feature them
alter table public.matches
  add column is_live boolean not null default false;

-- ── Pulse Calls: segment-level predictions ──────────────────────────────────
-- segment keys are app-defined per sport (cricket 'ov1_5'.., football 'h1',
-- 'h2', basketball 'q1'..'q4', plus 'final'). One pick per fan per segment.
create table public.pulse_calls (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  segment text not null check (char_length(segment) between 1 and 20),
  predicted_team_id text not null,
  created_at timestamptz not null default now(),
  unique (match_id, user_id, segment)
);
create index pulse_calls_match_idx on public.pulse_calls (match_id, segment);

-- decided segments, set by admins as the match unfolds; grades pulse calls
create table public.segment_results (
  match_id text not null references public.matches (id),
  segment text not null,
  winner_team_id text not null,
  decided_at timestamptz not null default now(),
  primary key (match_id, segment)
);

-- ── Support: whose side are you on (heart, not head) ────────────────────────
create table public.supports (
  match_id text not null references public.matches (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  team_id text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);
create index supports_team_idx on public.supports (team_id);

-- ── Blogs: fan long-form posts ──────────────────────────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 120),
  body text not null check (char_length(trim(body)) between 10 and 10000),
  match_id text references public.matches (id),
  sport text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);

-- ── Videos: YouTube links on matches ────────────────────────────────────────
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 120),
  youtube_url text not null check (
    youtube_url like 'https://www.youtube.com/%'
    or youtube_url like 'https://youtube.com/%'
    or youtube_url like 'https://youtu.be/%'
    or youtube_url like 'https://m.youtube.com/%'
  ),
  created_at timestamptz not null default now(),
  unique (match_id, youtube_url)
);
create index videos_match_idx on public.videos (match_id, created_at desc);

-- ── Grants ──────────────────────────────────────────────────────────────────
grant select on public.pulse_calls to anon, authenticated;
grant insert, update on public.pulse_calls to authenticated;
grant select on public.segment_results to anon, authenticated;
grant insert, update on public.segment_results to authenticated; -- RLS: admins only
grant select on public.supports to anon, authenticated;
grant insert, update on public.supports to authenticated;
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant select on public.videos to anon, authenticated;
grant insert, delete on public.videos to authenticated;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.pulse_calls enable row level security;
create policy "pulse calls are public" on public.pulse_calls
  for select using (true);
-- pulse picks stay open while the match is undecided and the segment unscored
create policy "pulse call while open" on public.pulse_calls
  for insert with check (
    auth.uid() = user_id
    and not public.is_banned()
    and exists (select 1 from public.matches m where m.id = match_id and not m.is_completed)
    and not exists (select 1 from public.segment_results r
                    where r.match_id = pulse_calls.match_id and r.segment = pulse_calls.segment)
  );
create policy "change pulse call while open" on public.pulse_calls
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.matches m where m.id = match_id and not m.is_completed)
    and not exists (select 1 from public.segment_results r
                    where r.match_id = pulse_calls.match_id and r.segment = pulse_calls.segment)
  )
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and exists (select 1 from public.matches m where m.id = match_id and not m.is_completed)
    and not exists (select 1 from public.segment_results r
                    where r.match_id = pulse_calls.match_id and r.segment = pulse_calls.segment)
  );

alter table public.segment_results enable row level security;
create policy "segment results are public" on public.segment_results
  for select using (true);
create policy "admins decide segments" on public.segment_results
  for insert with check (public.is_admin());
create policy "admins amend segments" on public.segment_results
  for update using (public.is_admin()) with check (public.is_admin());

alter table public.supports enable row level security;
create policy "supports are public" on public.supports
  for select using (true);
create policy "support as yourself" on public.supports
  for insert with check (auth.uid() = user_id and not public.is_banned());
create policy "switch sides" on public.supports
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and not public.is_banned());

alter table public.posts enable row level security;
create policy "posts are public" on public.posts
  for select using (true);
create policy "write own posts" on public.posts
  for insert with check (auth.uid() = author_id and not public.is_banned());
create policy "edit own posts" on public.posts
  for update using (auth.uid() = author_id)
  with check (auth.uid() = author_id and not public.is_banned());
create policy "delete own posts" on public.posts
  for delete using (auth.uid() = author_id);
create policy "admins delete any post" on public.posts
  for delete using (public.is_admin());

alter table public.videos enable row level security;
create policy "videos are public" on public.videos
  for select using (true);
create policy "add own videos" on public.videos
  for insert with check (auth.uid() = user_id and not public.is_banned());
create policy "delete own videos" on public.videos
  for delete using (auth.uid() = user_id);
create policy "admins delete any video" on public.videos
  for delete using (public.is_admin());

-- ── Realtime ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.pulse_calls, public.supports;
