begin;

alter table public.events add column if not exists location text;
alter table public.events add column if not exists color_key text;
alter table public.events add column if not exists recurrence_frequency text;
alter table public.events add column if not exists recurrence_source_id uuid references public.events(id) on delete cascade;
alter table public.events add column if not exists recurrence_date date;
alter table public.events add column if not exists recurrence_generated_through date;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.events'::regclass and conname = 'events_color_key_check') then
    alter table public.events add constraint events_color_key_check check (color_key is null or color_key in ('mint','blue','yellow','coral','lavender','pink'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.events'::regclass and conname = 'events_recurrence_frequency_check') then
    alter table public.events add constraint events_recurrence_frequency_check check (recurrence_frequency is null or recurrence_frequency in ('daily','weekly','monthly','yearly'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.events'::regclass and conname = 'events_recurrence_shape_check') then
    alter table public.events add constraint events_recurrence_shape_check check (
      (recurrence_frequency is null and recurrence_date is null and recurrence_generated_through is null)
      or (recurrence_frequency is not null and recurrence_date is not null)
    );
  end if;
end
$$;

create unique index if not exists events_user_recurrence_occurrence_key
  on public.events(user_id, recurrence_source_id, recurrence_date)
  where recurrence_source_id is not null;
create index if not exists events_user_area_start_idx on public.events(user_id, area, start_date);

create or replace function public.save_event_bundle_v2(
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
begin
  if owner_id is null then raise exception 'authentication required'; end if;
  if jsonb_typeof(coalesce(p_links, '[]'::jsonb)) <> 'array' or jsonb_typeof(coalesce(p_reminders, '[]'::jsonb)) <> 'array' then
    raise exception 'relations must be arrays';
  end if;
  recurrence_date_value := case when nullif(p_values->>'recurrence_frequency', '') is null then null else (p_values->>'start_date')::date end;
  generated_value := recurrence_date_value;
  if p_item_id is not null then
    select recurrence_frequency, recurrence_date, recurrence_generated_through
      into current_frequency, current_date, current_generated
    from public.events where id = p_item_id and user_id = owner_id for update;
    if not found then raise exception 'event not found'; end if;
    if current_frequency is not distinct from nullif(p_values->>'recurrence_frequency', '') and current_date is not distinct from recurrence_date_value then
      generated_value := current_generated;
    end if;
    update public.events set
      title = p_values->>'title', area = p_values->>'area',
      start_date = (p_values->>'start_date')::date, end_date = (p_values->>'end_date')::date,
      is_all_day = (p_values->>'is_all_day')::boolean,
      start_time = nullif(p_values->>'start_time', '')::time,
      end_time = nullif(p_values->>'end_time', '')::time,
      location = nullif(p_values->>'location', ''), color_key = nullif(p_values->>'color_key', ''),
      recurrence_frequency = nullif(p_values->>'recurrence_frequency', ''),
      recurrence_source_id = null, recurrence_date = recurrence_date_value,
      recurrence_generated_through = generated_value,
      memo = nullif(p_values->>'memo', ''), description = nullif(p_values->>'description', '')
    where id = p_item_id and user_id = owner_id returning id into item_id;
  else
    insert into public.events (
      user_id,title,area,start_date,end_date,is_all_day,start_time,end_time,location,color_key,
      recurrence_frequency,recurrence_source_id,recurrence_date,recurrence_generated_through,memo,description
    ) values (
      owner_id,p_values->>'title',p_values->>'area',(p_values->>'start_date')::date,(p_values->>'end_date')::date,
      (p_values->>'is_all_day')::boolean,nullif(p_values->>'start_time','')::time,nullif(p_values->>'end_time','')::time,
      nullif(p_values->>'location',''),nullif(p_values->>'color_key',''),nullif(p_values->>'recurrence_frequency',''),
      null,recurrence_date_value,generated_value,nullif(p_values->>'memo',''),nullif(p_values->>'description','')
    ) returning id into item_id;
  end if;
  delete from public.event_links where user_id = owner_id and event_id = item_id;
  delete from public.event_reminders where user_id = owner_id and event_id = item_id;
  insert into public.event_links(user_id,event_id,title,url)
    select owner_id,item_id,value->>'title',value->>'url' from jsonb_array_elements(coalesce(p_links,'[]'::jsonb));
  insert into public.event_reminders(user_id,event_id,offset_minutes)
    select owner_id,item_id,(value->>'offsetMinutes')::integer from jsonb_array_elements(coalesce(p_reminders,'[]'::jsonb));
  return item_id;
end;
$$;

revoke all on function public.save_event_bundle_v2(uuid,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.save_event_bundle_v2(uuid,jsonb,jsonb,jsonb) to authenticated;

commit;
