-- To-dos in both languages. title stays what the author typed; title_zh and
-- title_en are filled in by the translate-todos function, and title_source
-- records which title they were made from (so an edited title shows as typed
-- until its new translation arrives).
alter table public.todos add column if not exists title_zh text;
alter table public.todos add column if not exists title_en text;
alter table public.todos add column if not exists title_source text;

-- The function is called with the same secret as the daily automation job,
-- kept in Vault so it isn't written into function definitions.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret(
      (select (regexp_match(command, '''x-cron-secret''\s*,\s*''([^'']+)'''))[1] from cron.job where jobname = 'dreamplanner-daily-automation'),
      'cron_secret',
      'Shared secret for scheduled / internal edge function calls');
  end if;
end $$;

-- Ask for translations of new or renamed to-dos, once per statement (an
-- import of 30 to-dos is one call). Never blocks or fails the write.
create or replace function public.request_todo_translations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ids uuid[];
  secret text;
begin
  select array_agg(id) into ids
    from new_rows
   where title is not null and btrim(title) <> '' and title_source is distinct from title;
  if ids is null then
    return null;
  end if;
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'cron_secret';
  if secret is null then
    return null;
  end if;
  perform net.http_post(
    url := 'https://fyxnuhqzgkzfuldqurej.supabase.co/functions/v1/translate-todos',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    body := jsonb_build_object('ids', to_jsonb(ids)),
    timeout_milliseconds := 60000
  );
  return null;
exception when others then
  raise warning 'request_todo_translations: %', sqlerrm;
  return null;
end $$;
revoke all on function public.request_todo_translations() from public, anon, authenticated;

drop trigger if exists todos_translate_insert on public.todos;
create trigger todos_translate_insert after insert on public.todos
  referencing new table as new_rows
  for each statement execute function public.request_todo_translations();
drop trigger if exists todos_translate_update on public.todos;
create trigger todos_translate_update after update on public.todos
  referencing new table as new_rows
  for each statement execute function public.request_todo_translations();
