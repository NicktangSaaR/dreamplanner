-- When the student saw the "you're in application season" message (shown once).
alter table public.profiles add column if not exists application_welcome_seen_at timestamptz;
