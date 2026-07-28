-- ═══════════════════════════════════════════════════════════════════════════
-- The Stands — push delivery
-- Run AFTER 0007_events.sql in the Supabase SQL editor.
--
-- Fans register Web Push subscriptions (per browser/device). When the
-- notifier writes an inbox row, a trigger emits notification.created and
-- services/push-delivery sends it to every device the fan enabled.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

grant select, insert, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;
alter table public.push_subscriptions enable row level security;
create policy "own push subscriptions" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "register own device" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "remove own device" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- delivery bookkeeping on the inbox
alter table public.notifications
  add column pushed boolean not null default false;

-- inbox rows join the event stream so push-delivery hears about them
create function public.trg_notification_events() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.emit_event('notification.created', jsonb_build_object(
    'notification_id', new.id, 'user_id', new.user_id));
  return new;
end $$;
create trigger notification_events after insert on public.notifications
  for each row execute function public.trg_notification_events();
