-- SECURITY FIX (applied to production 2026-11-03).
-- is_admin()/is_counselor() trust profiles.user_type, but:
--   1) handle_new_user() copied user_type straight from client-supplied signup
--      metadata, so anyone could sign up as 'admin' via the API;
--   2) profile UPDATE policies let users change their own user_type and
--      is_verified. (profiles.status is the grade level, not a privilege.)
-- Both allowed any visitor to become an admin and read all student data.

-- 1) Signup may only self-select 'student' or 'counselor'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requested_type text := NEW.raw_user_meta_data->>'user_type';
BEGIN
    INSERT INTO public.profiles (
        id,
        user_type,
        full_name,
        english_name,
        email,
        school,
        grade,
        parent_email,
        interested_majors
    ) VALUES (
        NEW.id,
        CASE WHEN requested_type IN ('student', 'counselor') THEN requested_type ELSE 'student' END,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'english_name',
        NEW.email,
        NEW.raw_user_meta_data->>'school',
        NEW.raw_user_meta_data->>'grade',
        NEW.raw_user_meta_data->>'parent_email',
        CASE
            WHEN NEW.raw_user_meta_data->>'interested_majors' IS NOT NULL
            THEN string_to_array(NEW.raw_user_meta_data->>'interested_majors', ',')
            ELSE NULL
        END
    );
    RETURN NEW;
END;
$function$;

-- 2) Only admins, the service role, or direct DB maintenance may change
--    user_type / is_verified. Everyone else keeps editing the rest of their
--    profile as before.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  privileged boolean :=
       coalesce(auth.role(), '') = 'service_role'
    OR session_user IN ('postgres', 'supabase_admin')
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
    RETURN NEW;
  END IF;

  IF NEW.user_type IS DISTINCT FROM OLD.user_type
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Only administrators can change user_type or is_verified'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();
