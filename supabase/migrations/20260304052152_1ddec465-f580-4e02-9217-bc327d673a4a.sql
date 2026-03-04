
-- Add english_name and parent_email columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS english_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_email text;

-- Update handle_new_user trigger to store new signup fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        user_type,
        full_name,
        english_name,
        email,
        school,
        parent_email,
        interested_majors
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'english_name',
        NEW.email,
        NEW.raw_user_meta_data->>'school',
        NEW.raw_user_meta_data->>'parent_email',
        CASE 
            WHEN NEW.raw_user_meta_data->>'interested_majors' IS NOT NULL 
            THEN string_to_array(NEW.raw_user_meta_data->>'interested_majors', ',')
            ELSE NULL
        END
    );
    RETURN NEW;
END;
$$;
