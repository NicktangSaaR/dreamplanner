-- One account per email. A student account made with a username keeps the
-- real email on the profile; signing up again with that email used to create
-- a second account (Ada, merged by hand on 2026-11-18).

-- Emails are stored lower-case so the check and lookups agree.
update public.profiles set email = lower(trim(email)) where email is not null and email <> lower(trim(email));
create unique index if not exists profiles_email_unique on public.profiles (lower(email)) where email is not null and email <> '';

-- Is this email taken, either as a login or as a profile email? Used by the
-- sign-up page to say "already registered" before creating anything.
create or replace function public.email_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where lower(email) = lower(trim(p_email)))
      or exists (select 1 from auth.users where lower(email) = lower(trim(p_email)));
$$;
revoke all on function public.email_registered(text) from public;
grant execute on function public.email_registered(text) to anon, authenticated;
