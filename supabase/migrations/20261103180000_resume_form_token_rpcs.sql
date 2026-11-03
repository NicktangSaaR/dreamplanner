-- SECURITY FIX (2026-11-03): public resume form.
-- Old RLS let anonymous users list every resume_request (including its
-- public_token) and read/update any resume_data tied to a request that had
-- a token, without checking that the caller actually held that token.
-- The public form now goes through these token-checked functions only.

CREATE OR REPLACE FUNCTION public.get_resume_request_by_token(p_token uuid)
RETURNS TABLE (id uuid, status text, due_date timestamptz, message text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT rr.id, rr.status::text, rr.due_date::timestamptz, rr.message, rr.created_at
  FROM resume_requests rr
  WHERE rr.public_token = p_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_resume_data_by_token(p_token uuid)
RETURNS SETOF resume_data
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d.*
  FROM resume_data d
  JOIN resume_requests rr ON rr.id = d.request_id
  WHERE rr.public_token = p_token
  ORDER BY d.updated_at DESC NULLS LAST
  LIMIT 1;
$$;

-- p_data holds only the form's editable fields; ids and ownership come from
-- the request row, never from the client.
CREATE OR REPLACE FUNCTION public.save_resume_data_by_token(p_token uuid, p_data jsonb, p_submit boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  req resume_requests%ROWTYPE;
  existing_id uuid;
BEGIN
  SELECT * INTO req FROM resume_requests WHERE public_token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION '链接无效或已过期' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO existing_id FROM resume_data
  WHERE request_id = req.id
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF existing_id IS NULL THEN
    INSERT INTO resume_data (
      request_id, student_id, full_name, email, phone, address, linkedin_url,
      personal_website, education, work_experience, activities, awards, skills,
      certifications, projects, languages, uploaded_file_path
    ) VALUES (
      req.id, req.student_id,
      p_data->>'full_name', p_data->>'email', p_data->>'phone', p_data->>'address',
      p_data->>'linkedin_url', p_data->>'personal_website',
      coalesce(p_data->'education', '[]'::jsonb),
      coalesce(p_data->'work_experience', '[]'::jsonb),
      coalesce(p_data->'activities', '[]'::jsonb),
      coalesce(p_data->'awards', '[]'::jsonb),
      coalesce(p_data->'skills', '[]'::jsonb),
      coalesce(p_data->'certifications', '[]'::jsonb),
      coalesce(p_data->'projects', '[]'::jsonb),
      coalesce(p_data->'languages', '[]'::jsonb),
      p_data->>'uploaded_file_path'
    ) RETURNING id INTO existing_id;
  ELSE
    UPDATE resume_data SET
      full_name = p_data->>'full_name',
      email = p_data->>'email',
      phone = p_data->>'phone',
      address = p_data->>'address',
      linkedin_url = p_data->>'linkedin_url',
      personal_website = p_data->>'personal_website',
      education = coalesce(p_data->'education', '[]'::jsonb),
      work_experience = coalesce(p_data->'work_experience', '[]'::jsonb),
      activities = coalesce(p_data->'activities', '[]'::jsonb),
      awards = coalesce(p_data->'awards', '[]'::jsonb),
      skills = coalesce(p_data->'skills', '[]'::jsonb),
      certifications = coalesce(p_data->'certifications', '[]'::jsonb),
      projects = coalesce(p_data->'projects', '[]'::jsonb),
      languages = coalesce(p_data->'languages', '[]'::jsonb),
      uploaded_file_path = coalesce(p_data->>'uploaded_file_path', uploaded_file_path),
      updated_at = now()
    WHERE id = existing_id;
  END IF;

  IF p_submit THEN
    UPDATE resume_requests SET status = 'submitted', updated_at = now() WHERE id = req.id;
  END IF;

  RETURN existing_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_resume_request_by_token(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_resume_data_by_token(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_resume_data_by_token(uuid, jsonb, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_resume_request_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_resume_data_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_resume_data_by_token(uuid, jsonb, boolean) TO anon, authenticated;
