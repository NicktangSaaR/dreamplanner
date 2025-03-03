
CREATE OR REPLACE FUNCTION public.setup_todo_reminder_cron(
  job_name text,
  schedule text,
  function_name text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url text;
  anon_key text;
BEGIN
  -- Get the anon key from env vars or settings
  anon_key := current_setting('app.settings.anon_key', true);
  
  -- Construct the function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/' || function_name;
  
  -- Check if job already exists and drop it
  PERFORM cron.unschedule(job_name);
  
  -- Schedule the new job
  PERFORM cron.schedule(
    job_name,
    schedule,
    $$
    SELECT
      net.http_post(
        url:='$$ || function_url || $$',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer $$ || anon_key || $$"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );
  
  RETURN 'Cron job ' || job_name || ' scheduled successfully with schedule: ' || schedule;
END;
$$;
