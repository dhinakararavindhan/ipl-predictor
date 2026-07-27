-- ═══════════════════════════════════════════════════════════════════════════
-- The Stands — the event bus: upstream → downstream
-- Run AFTER 0006_auth_providers.sql in the Supabase SQL editor.
--
-- Upstream writers (the fixtures-sync service, admins, fans posting) touch
-- ordinary tables; triggers emit domain events into `events`. Downstream
-- services each keep a cursor in `service_cursors` and consume the stream
-- at their own pace (at-least-once; consumers are idempotent).
--
-- Downstream outputs added here:
--   notifications  — per-fan inbox rows written by services/notifier
--   match_stats    — per-match aggregates maintained by services/trends
-- ═══════════════════════════════════════════════════════════════════════════

-- ── The bus ─────────────────────────────────────────────────────────────────
create table public.events (
  id bigint generated always as identity primary key,
  topic text not null,              -- 'match.live' | 'match.completed' | 'segment.decided' | 'chant.posted' | 'chant.deleted'
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_topic_idx on public.events (id, topic);

create table public.service_cursors (
  consumer text primary key,        -- 'notifier', 'trends', ...
  last_event_id bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- internal plumbing: services only
grant all on public.events, public.service_cursors to service_role;
alter table public.events enable row level security;
alter table public.service_cursors enable row level security;
-- no policies: anon/authenticated can't touch the bus; service_role bypasses

-- security definer so ANY writer's trigger may emit, whatever their grants
create function public.emit_event(topic text, payload jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.events (topic, payload) values (topic, payload);
$$;

-- ── Upstream emitters ───────────────────────────────────────────────────────
create function public.trg_match_events() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_live and not old.is_live then
    perform public.emit_event('match.live', jsonb_build_object(
      'match_id', new.id, 'sport', new.sport, 'league', new.league));
  end if;
  if new.is_completed and not old.is_completed then
    perform public.emit_event('match.completed', jsonb_build_object(
      'match_id', new.id, 'winner_id', new.winner_id));
  end if;
  return new;
end $$;
create trigger match_events after update on public.matches
  for each row execute function public.trg_match_events();

create function public.trg_segment_events() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.emit_event('segment.decided', jsonb_build_object(
    'match_id', new.match_id, 'segment', new.segment, 'winner_team_id', new.winner_team_id));
  return new;
end $$;
create trigger segment_events after insert on public.segment_results
  for each row execute function public.trg_segment_events();

create function public.trg_chant_events() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.emit_event('chant.posted', jsonb_build_object(
      'match_id', new.match_id, 'chant_id', new.id));
    return new;
  end if;
  perform public.emit_event('chant.deleted', jsonb_build_object(
    'match_id', old.match_id, 'chant_id', old.id));
  return old;
end $$;
create trigger chant_events after insert or delete on public.chants
  for each row execute function public.trg_chant_events();

-- ── Downstream output: fan notification inbox (written by notifier) ─────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,               -- 'match_live' | 'call_result' | 'pulse_result'
  ref text not null,                -- idempotency key, e.g. 'fb1' or 'm60:ov1_5'
  title text not null,
  body text,
  match_id text,
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)       -- at-least-once delivery stays exactly-once here
);
create index notifications_user_idx on public.notifications (user_id, seen, created_at desc);

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "mark own notifications seen" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Downstream output: per-match aggregates (written by trends) ─────────────
create table public.match_stats (
  match_id text primary key references public.matches (id),
  chant_count integer not null default 0,
  updated_at timestamptz not null default now()
);
grant select on public.match_stats to anon, authenticated;
grant all on public.match_stats to service_role;
alter table public.match_stats enable row level security;
create policy "match stats are public" on public.match_stats
  for select using (true);
