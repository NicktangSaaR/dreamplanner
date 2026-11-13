-- Position/role is optional: many activities, awards and programmes have none.
-- (The old table required it, so entries without a role failed to save.)
alter table public.extracurricular_activities alter column role drop not null;
