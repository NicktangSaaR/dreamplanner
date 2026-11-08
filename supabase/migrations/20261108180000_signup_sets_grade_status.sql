-- New students start with the grade they chose at sign-up.
-- Before this, profiles.status (the grade/service status the whole app uses)
-- was left at its default 'G9' and only profiles.grade got the chosen value.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requested_type text := NEW.raw_user_meta_data->>'user_type';
  chosen_grade text := NULLIF(trim(NEW.raw_user_meta_data->>'grade'), '');
  start_status text := CASE
    WHEN chosen_grade IN ('G7', 'G8', 'Pre-9') THEN 'Pre-9'
    -- July/August: Grade 11 is over and the July update has already run,
    -- so a student who just finished G11 starts as College Bound.
    WHEN chosen_grade = 'G11'
     AND extract(month FROM (now() AT TIME ZONE 'America/Vancouver')) IN (7, 8) THEN 'College Bound'
    WHEN chosen_grade IN ('G9', 'G10', 'G11', 'G12') THEN chosen_grade
    WHEN chosen_grade = 'Transfer' THEN 'Transfer Student'
    ELSE NULL
  END;
BEGIN
    INSERT INTO public.profiles (
        id, user_type, full_name, english_name, email, school, grade, status, parent_email, interested_majors
    ) VALUES (
        NEW.id,
        CASE WHEN requested_type IN ('student', 'counselor') THEN requested_type ELSE 'student' END,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'english_name',
        NEW.email,
        NEW.raw_user_meta_data->>'school',
        chosen_grade,
        COALESCE(start_status, 'G9'),
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
