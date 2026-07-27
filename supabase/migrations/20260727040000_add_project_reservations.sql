begin;

create table public.project_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  type text not null check (
    type in (
      'flight',
      'hotel',
      'rental_car',
      'restaurant',
      'badminton',
      'transportation',
      'ticket',
      'custom'
    )
  ),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  reservation_date date not null,
  start_time time,
  end_time time,
  company text check (company is null or char_length(company) <= 160),
  confirmation_number text check (
    confirmation_number is null or char_length(confirmation_number) <= 120
  ),
  location text check (location is null or char_length(location) <= 300),
  phone text check (phone is null or char_length(phone) <= 60),
  website text check (website is null or char_length(website) <= 500),
  memo text check (memo is null or char_length(memo) <= 2000),
  linked_event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_reservations_owned_project_fk
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete cascade,
  constraint project_reservations_time_range_check check (
    end_time is null or (start_time is not null and end_time > start_time)
  )
);

create index project_reservations_project_date_idx
  on public.project_reservations(user_id, project_id, reservation_date, created_at);

create unique index project_reservations_linked_event_unique
  on public.project_reservations(linked_event_id)
  where linked_event_id is not null;

alter table public.project_reservations enable row level security;
revoke all on table public.project_reservations from public, anon;
grant select on table public.project_reservations to authenticated;

create policy project_reservations_select_own on public.project_reservations
  for select to authenticated using (user_id = auth.uid());
create policy project_reservations_insert_own on public.project_reservations
  for insert to authenticated with check (user_id = auth.uid());
create policy project_reservations_update_own on public.project_reservations
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy project_reservations_delete_own on public.project_reservations
  for delete to authenticated using (user_id = auth.uid());

create trigger project_reservations_set_updated_at
before update on public.project_reservations
for each row execute function public.set_updated_at();

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
      (p_values->>'reservation_date')::date,
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
      reservation_date = (p_values->>'reservation_date')::date,
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
        (p_values->>'reservation_date')::date,
        (p_values->>'reservation_date')::date,
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
        start_date = (p_values->>'reservation_date')::date,
        end_date = (p_values->>'reservation_date')::date,
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

create or replace function public.delete_project_reservation(
  p_reservation_id uuid,
  p_delete_linked_event boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  event_id uuid;
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select linked_event_id into event_id
  from public.project_reservations
  where id = p_reservation_id and user_id = owner_id
  for update;

  if not found then
    raise exception 'reservation not found' using errcode = 'P0002';
  end if;

  delete from public.project_reservations
  where id = p_reservation_id and user_id = owner_id;

  if p_delete_linked_event and event_id is not null then
    delete from public.events where id = event_id and user_id = owner_id;
  end if;
end;
$$;

revoke all on function public.save_project_reservation(uuid, jsonb, boolean)
  from public, anon;
grant execute on function public.save_project_reservation(uuid, jsonb, boolean)
  to authenticated;
revoke all on function public.delete_project_reservation(uuid, boolean)
  from public, anon;
grant execute on function public.delete_project_reservation(uuid, boolean)
  to authenticated;

commit;
