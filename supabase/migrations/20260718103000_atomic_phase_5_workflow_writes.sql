begin;

create or replace function public.save_work_item_bundle(
  p_kind text,
  p_item_id uuid,
  p_values jsonb,
  p_checklist jsonb default '[]'::jsonb,
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
  recurrence_generated_value date;
  current_recurrence_date date;
  current_recurrence_frequency text;
  current_generated_through date;
begin
  if owner_id is null then raise exception 'authentication required'; end if;
  if p_kind not in ('task', 'event') then raise exception 'invalid work item kind'; end if;
  if jsonb_typeof(coalesce(p_checklist, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_links, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_reminders, '[]'::jsonb)) <> 'array' then
    raise exception 'relations must be arrays';
  end if;

  if p_kind = 'task' then
    recurrence_date_value := case when p_values->>'recurrence_frequency' is null then null else nullif(p_values->>'scheduled_date', '')::date end;
    recurrence_generated_value := recurrence_date_value;
    if p_item_id is not null then
      select recurrence_date, recurrence_frequency, recurrence_generated_through
        into current_recurrence_date, current_recurrence_frequency, current_generated_through
      from public.tasks where id = p_item_id and user_id = owner_id for update;
      if not found then raise exception 'task not found'; end if;
      if current_recurrence_date is not distinct from recurrence_date_value
        and current_recurrence_frequency is not distinct from (p_values->>'recurrence_frequency') then
        recurrence_generated_value := current_generated_through;
      end if;
      update public.tasks set
        title = p_values->>'title', area = p_values->>'area', status = p_values->>'status',
        priority = p_values->>'priority', category = p_values->>'category',
        scheduled_date = nullif(p_values->>'scheduled_date', '')::date,
        due_date = nullif(p_values->>'due_date', '')::date,
        follow_up_date = nullif(p_values->>'follow_up_date', '')::date,
        memo = p_values->>'memo', description = p_values->>'description',
        estimated_minutes = nullif(p_values->>'estimated_minutes', '')::integer,
        completed_at = nullif(p_values->>'completed_at', '')::timestamptz,
        recurrence_frequency = p_values->>'recurrence_frequency',
        recurrence_date = recurrence_date_value,
        recurrence_generated_through = recurrence_generated_value
      where id = p_item_id and user_id = owner_id returning id into item_id;
    else
      insert into public.tasks (
        user_id, title, area, status, priority, category, scheduled_date, due_date,
        follow_up_date, memo, description, estimated_minutes, completed_at,
        recurrence_frequency, recurrence_source_id, recurrence_date, recurrence_generated_through
      ) values (
        owner_id, p_values->>'title', p_values->>'area', p_values->>'status',
        p_values->>'priority', p_values->>'category', nullif(p_values->>'scheduled_date', '')::date,
        nullif(p_values->>'due_date', '')::date, nullif(p_values->>'follow_up_date', '')::date,
        p_values->>'memo', p_values->>'description', nullif(p_values->>'estimated_minutes', '')::integer,
        nullif(p_values->>'completed_at', '')::timestamptz, p_values->>'recurrence_frequency',
        null, recurrence_date_value, recurrence_generated_value
      ) returning id into item_id;
    end if;

    delete from public.task_checklist_items where user_id = owner_id and task_id = item_id;
    delete from public.task_links where user_id = owner_id and task_id = item_id;
    delete from public.task_reminders where user_id = owner_id and task_id = item_id;
    insert into public.task_checklist_items (user_id, task_id, title, is_completed, position)
      select owner_id, item_id, value->>'title', coalesce((value->>'isCompleted')::boolean, false), ordinality - 1
      from jsonb_array_elements(coalesce(p_checklist, '[]'::jsonb)) with ordinality;
    insert into public.task_links (user_id, task_id, title, url)
      select owner_id, item_id, value->>'title', value->>'url'
      from jsonb_array_elements(coalesce(p_links, '[]'::jsonb));
    insert into public.task_reminders (user_id, task_id, reference_type, offset_minutes)
      select owner_id, item_id, coalesce(value->>'referenceType', 'due'), (value->>'offsetMinutes')::integer
      from jsonb_array_elements(coalesce(p_reminders, '[]'::jsonb));
  else
    if p_item_id is not null then
      update public.events set
        title = p_values->>'title', area = p_values->>'area',
        start_date = (p_values->>'start_date')::date, end_date = (p_values->>'end_date')::date,
        is_all_day = (p_values->>'is_all_day')::boolean,
        start_time = nullif(p_values->>'start_time', '')::time,
        end_time = nullif(p_values->>'end_time', '')::time,
        memo = p_values->>'memo', description = p_values->>'description'
      where id = p_item_id and user_id = owner_id returning id into item_id;
      if item_id is null then raise exception 'event not found'; end if;
    else
      insert into public.events (user_id, title, area, start_date, end_date, is_all_day, start_time, end_time, memo, description)
      values (owner_id, p_values->>'title', p_values->>'area', (p_values->>'start_date')::date,
        (p_values->>'end_date')::date, (p_values->>'is_all_day')::boolean,
        nullif(p_values->>'start_time', '')::time, nullif(p_values->>'end_time', '')::time,
        p_values->>'memo', p_values->>'description') returning id into item_id;
    end if;
    delete from public.event_links where user_id = owner_id and event_id = item_id;
    delete from public.event_reminders where user_id = owner_id and event_id = item_id;
    insert into public.event_links (user_id, event_id, title, url)
      select owner_id, item_id, value->>'title', value->>'url'
      from jsonb_array_elements(coalesce(p_links, '[]'::jsonb));
    insert into public.event_reminders (user_id, event_id, offset_minutes)
      select owner_id, item_id, (value->>'offsetMinutes')::integer
      from jsonb_array_elements(coalesce(p_reminders, '[]'::jsonb));
  end if;
  return item_id;
end;
$$;

create or replace function public.save_task_template_bundle(p_values jsonb, p_checklist jsonb default '[]'::jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid(); template_id uuid;
begin
  if owner_id is null then raise exception 'authentication required'; end if;
  if jsonb_typeof(coalesce(p_checklist, '[]'::jsonb)) <> 'array' then raise exception 'checklist must be an array'; end if;
  insert into public.task_templates (user_id, name, item_kind, category, title, description, priority, estimated_minutes, recommended_timing, recurrence_frequency, memo)
  values (owner_id, p_values->>'name', p_values->>'item_kind', p_values->>'category', p_values->>'title',
    p_values->>'description', p_values->>'priority', nullif(p_values->>'estimated_minutes', '')::integer,
    p_values->>'recommended_timing', p_values->>'recurrence_frequency', p_values->>'memo')
  returning id into template_id;
  insert into public.task_template_checklist_items (user_id, template_id, title, position)
    select owner_id, template_id, value #>> '{}', ordinality - 1
    from jsonb_array_elements(coalesce(p_checklist, '[]'::jsonb)) with ordinality;
  return template_id;
end;
$$;

create or replace function public.duplicate_task_bundle(
  p_source_id uuid, p_date date, p_include_checklist boolean,
  p_include_description boolean, p_include_memo boolean, p_include_recurrence boolean
)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid(); source public.tasks%rowtype; duplicated_id uuid; target_date date; recurrence_date_value date;
begin
  if owner_id is null then raise exception 'authentication required'; end if;
  select * into source from public.tasks where id = p_source_id and user_id = owner_id;
  if not found then raise exception 'task not found'; end if;
  target_date := coalesce(p_date, source.scheduled_date);
  recurrence_date_value := case when p_include_recurrence and source.recurrence_frequency is not null then target_date else null end;
  insert into public.tasks (user_id, title, area, status, priority, category, scheduled_date, due_date, follow_up_date,
    memo, description, estimated_minutes, completed_at, recurrence_frequency, recurrence_source_id, recurrence_date, recurrence_generated_through)
  values (owner_id, source.title || ' 복사본', source.area, 'planned', source.priority, source.category,
    target_date, coalesce(p_date, source.due_date), null,
    case when p_include_memo then source.memo else null end,
    case when p_include_description then source.description else null end,
    source.estimated_minutes, null, case when p_include_recurrence then source.recurrence_frequency else null end,
    null, recurrence_date_value, recurrence_date_value) returning id into duplicated_id;
  if p_include_checklist then
    insert into public.task_checklist_items (user_id, task_id, title, is_completed, position)
      select owner_id, duplicated_id, title, false, position from public.task_checklist_items
      where user_id = owner_id and task_id = p_source_id order by position;
  end if;
  return duplicated_id;
end;
$$;

revoke all on function public.save_work_item_bundle(text, uuid, jsonb, jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.save_task_template_bundle(jsonb, jsonb) from public, anon;
revoke all on function public.duplicate_task_bundle(uuid, date, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.save_work_item_bundle(text, uuid, jsonb, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.save_task_template_bundle(jsonb, jsonb) to authenticated;
grant execute on function public.duplicate_task_bundle(uuid, date, boolean, boolean, boolean, boolean) to authenticated;

commit;
