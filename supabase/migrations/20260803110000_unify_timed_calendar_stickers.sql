begin;

alter table public.events
  add column if not exists sticker_key text;

alter table public.events
  add constraint events_sticker_key_format_check
  check (
    sticker_key is null
    or sticker_key in (
      'flexible-curriculum', 'other', 'academic.admission',
      'opening-ceremony', 'academic.semester-end', 'academic.graduation',
      'vacation-ceremony', 'academic.summer-break', 'academic.winter-break',
      'academic.diagnostic-assessment', 'academic.midterm', 'academic.final',
      'exam-period', 'academic.performance-assessment', 'academic.parent-meeting',
      'academic.sports-day', 'academic.school-festival', 'academic.field-trip',
      'academic.school-trip', 'academic.graduation-photo', 'academic.school-orientation',
      'school-event', 'academic.club', 'school-closure',
      'academic.principal-discretionary-holiday', 'academic.substitute-holiday',
      'academic.vacation-camp', 'academic.supplementary-class', 'staff-training',
      'academic.online-training-study', 'academic.online-training-lecture',
      'academic.in-person-training', 'academic.training-material-prep',
      'academic.curriculum-review', 'health.student-checkup', 'health.urine-test',
      'health.tuberculosis-test', 'health.vision-test', 'health.oral-checkup',
      'health.health-survey', 'health.vaccination-check', 'health.cpr-training',
      'health.first-aid-training', 'health.sex-education', 'health.smoking-prevention',
      'health.alcohol-prevention', 'health.drug-misuse-prevention',
      'health.infection-prevention', 'health.life-respect-education',
      'health.obesity-prevention', 'health.aed-check', 'health.medicine-check',
      'health.emergency-kit-check', 'health.health-room-check',
      'health.medical-waste-check', 'health.health-log', 'health.supply-purchase',
      'health.health-committee', 'health.statistics-report',
      'health.official-document', 'health.family-letter', 'health.teacher-cooperation',
      'holiday.new-year', 'holiday.march-first', 'holiday.constitution-day',
      'holiday.buddhas-birthday', 'holiday.labor-day', 'holiday.childrens-day',
      'holiday.memorial-day', 'holiday.liberation-day',
      'holiday.national-foundation-day', 'holiday.hangul-day', 'holiday.christmas',
      'holiday.seollal', 'holiday.seollal-break', 'holiday.chuseok',
      'holiday.chuseok-break', 'holiday.substitute', 'holiday.temporary',
      'holiday.election-day', 'holiday', 'long-weekend',
      'personal.hospital', 'personal.hair-salon', 'personal.appointment',
      'personal.travel', 'personal.date', 'personal.family', 'personal.birthday',
      'personal.grocery', 'personal.dining', 'personal.culture',
      'personal.workout-meetup', 'personal.other'
    )
  ) not valid;

alter table public.events
  validate constraint events_sticker_key_format_check;

create index if not exists events_user_sticker_date_idx
  on public.events (user_id, start_date, sticker_key)
  where sticker_key is not null;

insert into public.events (
  id, user_id, title, area, event_type, sticker_key,
  start_date, end_date, is_all_day, start_time, end_time,
  location, color_key, recurrence_frequency, recurrence_source_id,
  recurrence_date, recurrence_generated_through, memo, description,
  created_at, updated_at
)
select
  sticker.id,
  sticker.user_id,
  sticker.label,
  case
    when sticker.sticker_key like 'personal.%' then 'personal'
    when sticker.sticker_key like 'health.%' then 'healthWork'
    else 'schoolSchedule'
  end,
  case
    when sticker.sticker_key like 'personal.%' then 'personal'
    when sticker.sticker_key like 'health.%' then 'work'
    else 'school'
  end,
  sticker.sticker_key,
  sticker.sticker_date,
  coalesce(sticker.end_date, sticker.sticker_date),
  true,
  null,
  null,
  null,
  case
    when sticker.sticker_key like 'personal.%' then 'pink'
    when sticker.sticker_key like 'health.%' then 'mint'
    when sticker.sticker_key like 'holiday.%' or sticker.sticker_key in ('holiday', 'long-weekend') then 'yellow'
    when sticker.sticker_key = 'academic.club' then 'lavender'
    else 'blue'
  end,
  null,
  null,
  null,
  null,
  sticker.note,
  null,
  sticker.created_at,
  sticker.updated_at
from public.calendar_stickers sticker
on conflict (id) do nothing;

delete from public.calendar_stickers sticker
where exists (
  select 1
  from public.events event
  where event.id = sticker.id
    and event.user_id = sticker.user_id
    and event.sticker_key = sticker.sticker_key
);

revoke insert, update on table public.calendar_stickers from authenticated;

create or replace function public.protect_linked_exercise_event_shape()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.exercise_logs exercise_log
    where exercise_log.event_id = old.id
  ) and (
    new.event_type is null
    or new.event_type not in ('workout', 'tournament')
    or new.sticker_key is not null
  ) then
    raise exception 'linked exercise events must remain workout or tournament events';
  end if;
  return new;
end;
$$;

drop trigger if exists events_protect_linked_exercise_shape on public.events;
create trigger events_protect_linked_exercise_shape
before update of event_type, sticker_key on public.events
for each row execute function public.protect_linked_exercise_event_shape();

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
  if event_details_value is not null and jsonb_typeof(event_details_value) <> 'object' then
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
      sticker_key = nullif(p_values->>'sticker_key', ''),
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
      user_id, project_id, title, area, event_type, event_details, sticker_key,
      start_date, end_date, is_all_day, start_time, end_time, location, color_key,
      recurrence_frequency, recurrence_source_id, recurrence_date,
      recurrence_generated_through, memo, description
    ) values (
      owner_id, nullif(p_values->>'project_id', '')::uuid,
      p_values->>'title', p_values->>'area',
      nullif(p_values->>'event_type', ''), event_details_value,
      nullif(p_values->>'sticker_key', ''),
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
