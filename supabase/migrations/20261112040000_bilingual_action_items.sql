-- Meeting action items (including the counselor's own tasks) in both
-- languages, the same way as todos: title_zh / title_en filled in by
-- translate-todos, title_source = the title they were made from.
alter table public.meeting_action_items add column if not exists title_zh text;
alter table public.meeting_action_items add column if not exists title_en text;
alter table public.meeting_action_items add column if not exists title_source text;

-- Same trigger function for both tables; it says which table the ids are from.
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
  select (regexp_match(command, '''x-cron-secret''\s*,\s*''([^'']+)'''))[1] into secret
    from cron.job where jobname = 'dreamplanner-daily-automation';
  if secret is null then
    return null;
  end if;
  perform net.http_post(
    url := 'https://fyxnuhqzgkzfuldqurej.supabase.co/functions/v1/translate-todos',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    body := jsonb_build_object('table', tg_table_name, 'ids', to_jsonb(ids)),
    timeout_milliseconds := 60000
  );
  return null;
exception when others then
  raise warning 'request_todo_translations: %', sqlerrm;
  return null;
end $$;
revoke all on function public.request_todo_translations() from public, anon, authenticated;

drop trigger if exists action_items_translate_insert on public.meeting_action_items;
create trigger action_items_translate_insert after insert on public.meeting_action_items
  referencing new table as new_rows
  for each statement execute function public.request_todo_translations();
drop trigger if exists action_items_translate_update on public.meeting_action_items;
create trigger action_items_translate_update after update on public.meeting_action_items
  referencing new table as new_rows
  for each statement execute function public.request_todo_translations();
