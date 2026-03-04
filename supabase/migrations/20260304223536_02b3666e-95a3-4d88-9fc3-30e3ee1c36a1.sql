ALTER TABLE public.profiles ADD COLUMN manual_gpa numeric DEFAULT NULL;

COMMENT ON COLUMN public.profiles.manual_gpa IS 'Manually entered GPA value by counselor, synced to student view';