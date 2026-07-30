begin;

alter table public.project_reservations
  add column end_date date;

alter table public.project_reservations
  drop constraint project_reservations_time_range_check;

alter table public.project_reservations
  add constraint project_reservations_date_time_range_check check (
    coalesce(end_date, reservation_date) >= reservation_date
    and (
      end_time is null
      or (
        start_time is not null
        and (
          coalesce(end_date, reservation_date) > reservation_date
          or end_time > start_time
        )
      )
    )
  );

comment on column public.project_reservations.end_date is
  'Reservation end date. NULL legacy rows are interpreted as reservation_date.';

create or replace function public.save_project_reservation(
  p_reservation_id uuid,
  p_values jsonb,
  p_sync_calendar boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  reservation_id uuid;
  event_id uuid;
  project_id_value uuid := nullif(p_values->>'project_id', '')::uuid;
  reservation_date_value date := (p_values->>'reservation_date')::date;
  end_date_value date := coalesce(
    nullif(p_values->>'end_date', '')::date,
    (p_values->>'reservation_date')::date
  );
  start_time_value time := nullif(p_values->>'start_time', '')::time;
  end_time_value time := nullif(p_values->>'end_time', '')::time;
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.projects
    where id = project_id_value and user_id = owner_id
  ) then
    raise exception 'project access denied' using errcode = '42501';
  end if;

  if p_reservation_id is null then
    insert into public.project_reservations (
      user_id,
      project_id,
      type,
      title,
      reservation_date,
      end_date,
      start_time,
      end_time,
      company,
      confirmation_number,
      location,
      phone,
      website,
      memo
    ) values (
      owner_id,
      project_id_value,
      p_values->>'type',
      p_values->>'title',
      reservation_date_value,
      end_date_value,
      start_time_value,
      end_time_value,
      nullif(p_values->>'company', ''),
      nullif(p_values->>'confirmation_number', ''),
      nullif(p_values->>'location', ''),
      nullif(p_values->>'phone', ''),
      nullif(p_values->>'website', ''),
      nullif(p_values->>'memo', '')
    )
    returning id into reservation_id;
  else
    update public.project_reservations
    set
      project_id = project_id_value,
      type = p_values->>'type',
      title = p_values->>'title',
      reservation_date = reservation_date_value,
      end_date = end_date_value,
      start_time = start_time_value,
      end_time = end_time_value,
      company = nullif(p_values->>'company', ''),
      confirmation_number = nullif(p_values->>'confirmation_number', ''),
      location = nullif(p_values->>'location', ''),
      phone = nullif(p_values->>'phone', ''),
      website = nullif(p_values->>'website', ''),
      memo = nullif(p_values->>'memo', '')
    where id = p_reservation_id and user_id = owner_id
    returning id, linked_event_id into reservation_id, event_id;

    if reservation_id is null then
      raise exception 'reservation not found' using errcode = 'P0002';
    end if;
  end if;

  if p_sync_calendar then
    if event_id is null then
      insert into public.events (
        user_id,
        project_id,
        title,
        area,
        start_date,
        end_date,
        is_all_day,
        start_time,
        end_time,
        location,
        color_key,
        memo
      ) values (
        owner_id,
        project_id_value,
        p_values->>'title',
        'project',
        reservation_date_value,
        end_date_value,
        start_time_value is null,
        start_time_value,
        end_time_value,
        nullif(p_values->>'location', ''),
        'mint',
        nullif(p_values->>'memo', '')
      )
      returning id into event_id;
    else
      update public.events
      set
        project_id = project_id_value,
        title = p_values->>'title',
        area = 'project',
        start_date = reservation_date_value,
        end_date = end_date_value,
        is_all_day = start_time_value is null,
        start_time = start_time_value,
        end_time = end_time_value,
        location = nullif(p_values->>'location', ''),
        color_key = 'mint',
        memo = nullif(p_values->>'memo', '')
      where id = event_id and user_id = owner_id;
      if not found then
        raise exception 'linked event not found' using errcode = 'P0002';
      end if;
    end if;

    update public.project_reservations
    set linked_event_id = event_id
    where id = reservation_id and user_id = owner_id;
  elsif event_id is not null then
    update public.project_reservations
    set linked_event_id = null
    where id = reservation_id and user_id = owner_id;
    delete from public.events where id = event_id and user_id = owner_id;
  end if;

  return reservation_id;
end;
$$;

revoke all on function public.save_project_reservation(uuid, jsonb, boolean)
  from public, anon;
grant execute on function public.save_project_reservation(uuid, jsonb, boolean)
  to authenticated;

commit;
