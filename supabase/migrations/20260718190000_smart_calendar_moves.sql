begin;

create or replace function public.move_calendar_item(
  p_kind text,
  p_item_id uuid,
  p_new_date date,
  p_scope text default 'instance'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  source_id uuid;
  old_date date;
  cutoff_date date;
  generated_through date;
  frequency text;
  delta integer;
  occurrence record;
begin
  if owner_id is null then raise exception 'authentication required'; end if;
  if p_kind not in ('task', 'event') then raise exception 'unsupported calendar item'; end if;
  if p_scope not in ('instance', 'following', 'series') then raise exception 'unsupported move scope'; end if;

  if p_kind = 'task' then
    select coalesce(recurrence_source_id, id), coalesce(recurrence_date, scheduled_date, due_date),
           recurrence_date, recurrence_frequency, recurrence_generated_through
      into source_id, old_date, cutoff_date, frequency, generated_through
      from public.tasks where id = p_item_id and user_id = owner_id for update;
  else
    select coalesce(recurrence_source_id, id), start_date, recurrence_date,
           recurrence_frequency, recurrence_generated_through
      into source_id, old_date, cutoff_date, frequency, generated_through
      from public.events
      where id = p_item_id and user_id = owner_id and area <> 'exercise'
      for update;
  end if;
  if old_date is null then raise exception 'calendar item has no movable date'; end if;
  delta := p_new_date - old_date;
  if delta = 0 then return p_item_id; end if;

  if frequency is null or p_scope = 'instance' then
    if p_kind = 'task' then
      update public.tasks set
        scheduled_date = case when scheduled_date is null then null else scheduled_date + delta end,
        due_date = case when due_date is null then null else due_date + delta end,
        follow_up_date = case when follow_up_date is null then null else follow_up_date + delta end,
        recurrence_date = case when recurrence_date is null then null else recurrence_date + delta end,
        recurrence_generated_through = case
          when recurrence_source_id is null and recurrence_generated_through is not null
          then greatest(recurrence_generated_through, recurrence_date + delta)
          else recurrence_generated_through end
      where id = p_item_id and user_id = owner_id;
    else
      update public.events set start_date = start_date + delta, end_date = end_date + delta,
        recurrence_date = case when recurrence_date is null then null else recurrence_date + delta end,
        recurrence_generated_through = case
          when recurrence_source_id is null and recurrence_generated_through is not null
          then greatest(recurrence_generated_through, recurrence_date + delta)
          else recurrence_generated_through end
      where id = p_item_id and user_id = owner_id;
    end if;
    return p_item_id;
  end if;

  if p_scope = 'series' or p_item_id = source_id then cutoff_date := null; end if;
  if p_kind = 'task' then
    for occurrence in
      select id from public.tasks
      where user_id = owner_id and recurrence_source_id = source_id
        and (cutoff_date is null or recurrence_date >= cutoff_date)
      order by case when delta > 0 then recurrence_date end desc,
               case when delta < 0 then recurrence_date end asc
      for update
    loop
      update public.tasks set scheduled_date = scheduled_date + delta,
        due_date = case when due_date is null then null else due_date + delta end,
        follow_up_date = case when follow_up_date is null then null else follow_up_date + delta end,
        recurrence_date = recurrence_date + delta
      where id = occurrence.id and user_id = owner_id;
    end loop;
    if cutoff_date is null then
      update public.tasks set scheduled_date = scheduled_date + delta,
        due_date = case when due_date is null then null else due_date + delta end,
        follow_up_date = case when follow_up_date is null then null else follow_up_date + delta end,
        recurrence_date = recurrence_date + delta,
        recurrence_generated_through = recurrence_generated_through + delta
      where id = source_id and user_id = owner_id;
    else
      update public.tasks set recurrence_generated_through = recurrence_generated_through + delta
      where id = source_id and user_id = owner_id;
    end if;
  else
    for occurrence in
      select id from public.events
      where user_id = owner_id and recurrence_source_id = source_id
        and (cutoff_date is null or recurrence_date >= cutoff_date)
      order by case when delta > 0 then recurrence_date end desc,
               case when delta < 0 then recurrence_date end asc
      for update
    loop
      update public.events set start_date = start_date + delta, end_date = end_date + delta,
        recurrence_date = recurrence_date + delta
      where id = occurrence.id and user_id = owner_id;
    end loop;
    if cutoff_date is null then
      update public.events set start_date = start_date + delta, end_date = end_date + delta,
        recurrence_date = recurrence_date + delta,
        recurrence_generated_through = recurrence_generated_through + delta
      where id = source_id and user_id = owner_id;
    else
      update public.events set recurrence_generated_through = recurrence_generated_through + delta
      where id = source_id and user_id = owner_id;
    end if;
  end if;
  return p_item_id;
end;
$$;

revoke all on function public.move_calendar_item(text, uuid, date, text) from public, anon;
grant execute on function public.move_calendar_item(text, uuid, date, text) to authenticated;

commit;
