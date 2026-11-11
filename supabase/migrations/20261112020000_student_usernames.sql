-- Student accounts created by staff, with a username.
--  * profiles.username: what the student types to log in (lowercase letters,
--    digits, . _ -). Their auth email is <username>@student.dreamplaneredu.com,
--    an internal address that never receives mail; profiles.email holds the
--    real email they add, used for password reset.
--  * profiles.must_complete_profile: send the student to the "complete your
--    profile" page on login until they've filled it in.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists must_complete_profile boolean not null default false;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
create unique index if not exists profiles_username_key on public.profiles (username) where username is not null;

-- Only admins and the server may change a username (it's tied to the login address).
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  -- auth.role() comes from the request JWT. API traffic always carries one
  -- ('anon', 'authenticated' or 'service_role'); an empty role means a direct
  -- database connection (migrations, SQL editor, the auth service's signup
  -- trigger), which is trusted.
  jwt_role text := coalesce(auth.role(), '');
  privileged boolean :=
       jwt_role IN ('', 'service_role')
    OR coalesce(public.is_admin(auth.uid()), false);
BEGIN
  IF privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_type IS NULL OR NEW.user_type NOT IN ('student', 'counselor') THEN
      NEW.user_type := 'student';
    END IF;
    NEW.is_verified := false;
    NEW.username := NULL;
    RETURN NEW;
  END IF;

  IF NEW.user_type IS DISTINCT FROM OLD.user_type
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Only administrators can change user_type or is_verified'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Only administrators can change a username'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
