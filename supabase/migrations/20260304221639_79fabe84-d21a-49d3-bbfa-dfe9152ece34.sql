CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
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