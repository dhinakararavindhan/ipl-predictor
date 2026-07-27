-- ═══════════════════════════════════════════════════════════════════════════
-- The Stands — multi-provider sign-in
-- Run AFTER 0005_engage.sql in the Supabase SQL editor.
--
-- Fans can now arrive via email, phone OTP, Google, Apple, or Facebook.
-- The signup trigger learns to build a profile from whatever the provider
-- gives us: OAuth name/photo, email local-part, or just a phone number.
-- (Enable the providers themselves in Authentication → Providers.)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  dname text;
  avatar text;
begin
  -- best display name the provider can offer
  dname := coalesce(
    nullif(trim(meta->>'full_name'), ''),
    nullif(trim(meta->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Fan'
  );
  -- Google/Facebook expose a profile photo
  avatar := coalesce(nullif(meta->>'avatar_url', ''), nullif(meta->>'picture', ''));

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    'fan_' || substr(replace(new.id::text, '-', ''), 1, 8),
    left(dname, 40),
    avatar
  );
  return new;
end $$;
