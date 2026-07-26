-- ═══════════════════════════════════════════════════════════════════════════
-- IPL Playoff Lab — Admin & moderation
-- Run AFTER 0001_social.sql in the Supabase SQL editor.
--
-- Adds: admin flag, bans, chant reports, and the RLS needed for an admin to
-- moderate (delete any chant, ban/unban fans, review reports).
--
-- To make yourself an admin, run once in the SQL editor:
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column is_admin boolean not null default false,
  add column is_banned boolean not null default false;

-- security definer so RLS policies can check admin status without recursing
-- into the profiles policies themselves
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create function public.is_banned() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_banned from public.profiles where id = auth.uid()), false)
$$;

-- ── Reports: fans flag a chant, admins review ───────────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  chant_id uuid not null references public.chants (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  unique (chant_id, reporter_id)    -- one report per fan per chant
);

grant select, insert, delete on public.reports to authenticated;

alter table public.reports enable row level security;
create policy "admins read reports" on public.reports
  for select using (public.is_admin());
create policy "report as yourself" on public.reports
  for insert with check (auth.uid() = reporter_id and not public.is_banned());
create policy "admins clear reports" on public.reports
  for delete using (public.is_admin());

-- ── Admin moderation powers ─────────────────────────────────────────────────
create policy "admins delete any chant" on public.chants
  for delete using (public.is_admin());
create policy "admins delete any roar" on public.roars
  for delete using (public.is_admin());
create policy "admins update any profile" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ── Banned fans lose write access ───────────────────────────────────────────
drop policy "post own chants" on public.chants;
create policy "post own chants" on public.chants
  for insert with check (
    auth.uid() = user_id
    and not public.is_banned()
    and exists (select 1 from public.matches m where m.id = match_id)
  );

drop policy "roar as yourself" on public.roars;
create policy "roar as yourself" on public.roars
  for insert with check (auth.uid() = user_id and not public.is_banned());

drop policy "call before start" on public.calls;
create policy "call before start" on public.calls
  for insert with check (
    auth.uid() = user_id
    and not public.is_banned()
    and exists (select 1 from public.matches m
                where m.id = match_id and not m.is_completed)
  );

drop policy "change call before start" on public.calls;
-- lock in USING as well, so decided call rows cannot be edited at all
create policy "change call before start" on public.calls
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.matches m
                where m.id = match_id and not m.is_completed)
  )
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and exists (select 1 from public.matches m
                where m.id = match_id and not m.is_completed)
  );

-- ── Guard privilege columns ─────────────────────────────────────────────────
-- "update own profile" / "insert own profile" (0001) would otherwise let a
-- user set their own is_admin/is_banned (a user whose profile row is missing
-- could even INSERT one with is_admin = true). Only admins may change these
-- flags through the API; direct SQL-editor/service-role sessions
-- (auth.uid() is null) stay unrestricted.
create function public.guard_profile_privileges() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  old_admin boolean := false;
  old_banned boolean := false;
begin
  if tg_op = 'UPDATE' then
    old_admin := old.is_admin;
    old_banned := old.is_banned;
  end if;
  if auth.uid() is not null
     and not public.is_admin()
     and (new.is_admin is distinct from old_admin
          or new.is_banned is distinct from old_banned) then
    raise exception 'not allowed to change privilege flags';
  end if;
  return new;
end $$;

create trigger guard_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Banned fans keep read access but cannot rewrite their public identity
-- (offensive renames would still show on their existing chants).
drop policy "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and not public.is_banned());
