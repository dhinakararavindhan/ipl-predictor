-- ═══════════════════════════════════════════════════════════════════════════
-- IPL Playoff Lab — Social features round 2: threaded replies
-- Run AFTER 0002_admin.sql in the Supabase SQL editor.
--
-- A Chant may reply to another Chant (one level of nesting in the UI).
-- Replies ride on the existing chants table, RLS, grants, and realtime.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.chants
  add column parent_id uuid references public.chants (id) on delete cascade;

create index chants_parent_idx on public.chants (parent_id);

-- A reply always belongs to its parent's match, whatever the client sent.
create function public.normalize_reply_match() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.parent_id is not null then
    select match_id into new.match_id from public.chants where id = new.parent_id;
    if new.match_id is null then
      raise exception 'parent chant not found';
    end if;
  end if;
  return new;
end $$;

create trigger normalize_reply_match
  before insert on public.chants
  for each row execute function public.normalize_reply_match();
