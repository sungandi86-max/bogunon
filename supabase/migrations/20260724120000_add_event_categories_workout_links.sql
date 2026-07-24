begin;

alter table public.events
  add column event_type text,
  add column event_details jsonb;

update public.events
set event_type = case area
  when 'personal' then 'personal'
  when 'schoolSchedule' then 'school'
  when 'exercise' then 'workout'
  else 'work'
end
where event_type is null;

alter table public.events
  add constraint events_event_type_check
    check (event_type is null or event_type in ('personal', 'work', 'school', 'workout', 'tournament')),
  add constraint events_event_details_check
    check (
      event_details is null
      or (
        jsonb_typeof(event_details) = 'object'
        and (
          (event_type = 'workout' and event_details->>'kind' = 'workout')
          or (event_type = 'tournament' and event_details->>'kind' = 'tournament')
        )
      )
    );

alter table public.exercise_logs
  add column event_id uuid references public.events(id) on delete set null;

create index events_user_type_start_idx on public.events(user_id, event_type, start_date);
create index exercise_logs_event_id_idx on public.exercise_logs(event_id) where event_id is not null;

create or replace function public.validate_exercise_log_event_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.event_id is not null and not exists (
    select 1
    from public.events
    where id = new.event_id and user_id = new.user_id
  ) then
    raise exception 'workout event owner mismatch' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger exercise_logs_validate_event_owner
before insert or update of event_id, user_id on public.exercise_logs
for each row execute function public.validate_exercise_log_event_owner();

revoke all on function public.validate_exercise_log_event_owner() from public, anon;
grant execute on function public.validate_exercise_log_event_owner() to authenticated;

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
      user_id, title, area, event_type, event_details,
      start_date, end_date, is_all_day, start_time, end_time, location, color_key,
      recurrence_frequency, recurrence_source_id, recurrence_date,
      recurrence_generated_through, memo, description
    ) values (
      owner_id, p_values->>'title', p_values->>'area',
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
