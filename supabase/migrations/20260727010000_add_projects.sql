begin;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  icon text not null default 'folder' check (char_length(icon) between 1 and 40),
  color text not null default 'mint' check (color in ('mint', 'blue', 'yellow', 'coral', 'lavender', 'pink')),
  description text check (description is null or char_length(description) <= 1000),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_date_range_check check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create index projects_user_updated_idx
  on public.projects(user_id, updated_at desc);

alter table public.projects enable row level security;
revoke all on table public.projects from public, anon;
grant select, insert, update, delete on table public.projects to authenticated;

create policy projects_select_own on public.projects
  for select to authenticated using (user_id = auth.uid());
create policy projects_insert_own on public.projects
  for insert to authenticated with check (user_id = auth.uid());
create policy projects_update_own on public.projects
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy projects_delete_own on public.projects
  for delete to authenticated using (user_id = auth.uid());

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.events
  add column project_id uuid references public.projects(id) on delete set null;

create index events_user_project_start_idx
  on public.events(user_id, project_id, start_date)
  where project_id is not null;

create or replace function public.validate_event_project_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.project_id is not null and not exists (
    select 1
    from public.projects
    where id = new.project_id and user_id = new.user_id
  ) then
    raise exception 'project owner mismatch' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger events_validate_project_owner
before insert or update of project_id, user_id on public.events
for each row execute function public.validate_event_project_owner();

revoke all on function public.validate_event_project_owner() from public, anon;
grant execute on function public.validate_event_project_owner() to authenticated;

create or replace function public.save_event_bundle_v3(
  p_item_id uuid,
  p_values jsonb,
  p_links jsonb default '[]'::jsonb,
  p_reminders jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  item_id uuid;
  recurrence_date_value date;
  generated_value date;
  current_frequency text;
  current_date date;
  current_generated date;
  event_details_value jsonb;
begin
  if owner_id is null then raise exception 'authentication required'; end if;
  if jsonb_typeof(coalesce(p_links, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_reminders, '[]'::jsonb)) <> 'array' then
    raise exception 'relations must be arrays';
  end if;
  event_details_value := nullif(p_values->'event_details', 'null'::jsonb);
  if event_details_value is not null
    and jsonb_typeof(event_details_value) <> 'object' then
    raise exception 'event details must be an object';
  end if;

  recurrence_date_value := case
    when nullif(p_values->>'recurrence_frequency', '') is null then null
    else (p_values->>'start_date')::date
  end;
  generated_value := recurrence_date_value;

  if p_item_id is not null then
    select recurrence_frequency, recurrence_date, recurrence_generated_through
      into current_frequency, current_date, current_generated
    from public.events
    where id = p_item_id and user_id = owner_id
    for update;
    if not found then raise exception 'event not found'; end if;
    if current_frequency is not distinct from nullif(p_values->>'recurrence_frequency', '')
      and current_date is not distinct from recurrence_date_value then
      generated_value := current_generated;
    end if;

    update public.events set
      project_id = nullif(p_values->>'project_id', '')::uuid,
      title = p_values->>'title',
      area = p_values->>'area',
      event_type = nullif(p_values->>'event_type', ''),
      event_details = event_details_value,
      start_date = (p_values->>'start_date')::date,
      end_date = (p_values->>'end_date')::date,
      is_all_day = (p_values->>'is_all_day')::boolean,
      start_time = nullif(p_values->>'start_time', '')::time,
      end_time = nullif(p_values->>'end_time', '')::time,
      location = nullif(p_values->>'location', ''),
      color_key = nullif(p_values->>'color_key', ''),
      recurrence_frequency = nullif(p_values->>'recurrence_frequency', ''),
      recurrence_source_id = null,
      recurrence_date = recurrence_date_value,
      recurrence_generated_through = generated_value,
      memo = nullif(p_values->>'memo', ''),
      description = nullif(p_values->>'description', '')
    where id = p_item_id and user_id = owner_id
    returning id into item_id;
  else
    insert into public.events (
      user_id, project_id, title, area, event_type, event_details,
      start_date, end_date, is_all_day, start_time, end_time, location, color_key,
      recurrence_frequency, recurrence_source_id, recurrence_date,
      recurrence_generated_through, memo, description
    ) values (
      owner_id, nullif(p_values->>'project_id', '')::uuid,
      p_values->>'title', p_values->>'area',
      nullif(p_values->>'event_type', ''), event_details_value,
      (p_values->>'start_date')::date, (p_values->>'end_date')::date,
      (p_values->>'is_all_day')::boolean,
      nullif(p_values->>'start_time', '')::time,
      nullif(p_values->>'end_time', '')::time,
      nullif(p_values->>'location', ''),
      nullif(p_values->>'color_key', ''),
      nullif(p_values->>'recurrence_frequency', ''),
      null, recurrence_date_value, generated_value,
      nullif(p_values->>'memo', ''), nullif(p_values->>'description', '')
    ) returning id into item_id;
  end if;

  delete from public.event_links where user_id = owner_id and event_id = item_id;
  delete from public.event_reminders where user_id = owner_id and event_id = item_id;
  insert into public.event_links(user_id, event_id, title, url)
    select owner_id, item_id, value->>'title', value->>'url'
    from jsonb_array_elements(coalesce(p_links, '[]'::jsonb));
  insert into public.event_reminders(user_id, event_id, offset_minutes)
    select owner_id, item_id, (value->>'offsetMinutes')::integer
    from jsonb_array_elements(coalesce(p_reminders, '[]'::jsonb));
  return item_id;
end;
$$;

revoke all on function public.save_event_bundle_v3(uuid,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.save_event_bundle_v3(uuid,jsonb,jsonb,jsonb) to authenticated;

commit;
