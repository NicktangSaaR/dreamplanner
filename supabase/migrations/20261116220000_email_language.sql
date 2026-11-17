-- Language for emails to this person: zh, en, or null = both (English first).
alter table public.profiles add column if not exists email_language text
  check (email_language in ('zh', 'en', 'both'));
comment on column public.profiles.email_language is
  'Email language: zh, en, or both/null (both, English first). Set from the site language switch or by staff.';
