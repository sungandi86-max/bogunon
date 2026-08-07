begin;

create table public.project_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  event_id uuid references public.events(id) on delete set null,
  reservation_id uuid references public.project_reservations(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  address text check (address is null or char_length(address) <= 500),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  visited_date date,
  visited_time time,
  sort_order integer not null default 0 check (sort_order >= 0),
  category text not null default 'other' check (category in (
    'airport', 'accommodation', 'restaurant', 'cafe', 'activity',
    'shopping', 'transportation', 'sports', 'sightseeing', 'other'
  )),
  memo text check (memo is null or char_length(memo) <= 2000),
  is_visited boolean not null default false,
  qa_run_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_places_owned_project_fk
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete cascade,
  constraint project_places_coordinate_pair_check check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create index project_places_project_route_idx
  on public.project_places(user_id, project_id, visited_date, sort_order, visited_time, created_at);
create index project_places_event_idx on public.project_places(event_id) where event_id is not null;
create index project_places_reservation_idx on public.project_places(reservation_id) where reservation_id is not null;
create index project_places_qa_run_idx on public.project_places(qa_run_id) where qa_run_id is not null;

create or replace function public.validate_project_place_links()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.event_id is not null and not exists (
    select 1 from public.events
    where id = new.event_id and user_id = new.user_id and project_id = new.project_id
  ) then
    raise exception 'place event owner or project mismatch' using errcode = '23503';
  end if;
  if new.reservation_id is not null and not exists (
    select 1 from public.project_reservations
    where id = new.reservation_id and user_id = new.user_id and project_id = new.project_id
  ) then
    raise exception 'place reservation owner or project mismatch' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger project_places_validate_links
before insert or update of user_id, project_id, event_id, reservation_id
on public.project_places
for each row execute function public.validate_project_place_links();

create trigger project_places_set_updated_at
before update on public.project_places
for each row execute function public.set_updated_at();

alter table public.project_places enable row level security;
revoke all on table public.project_places from public, anon;
grant select, insert, update, delete on table public.project_places to authenticated;

create policy project_places_select_own on public.project_places
  for select to authenticated using (user_id = auth.uid());
create policy project_places_insert_own on public.project_places
  for insert to authenticated with check (user_id = auth.uid());
create policy project_places_update_own on public.project_places
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy project_places_delete_own on public.project_places
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.reorder_project_places(
  p_project_id uuid,
  p_place_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.projects where id = p_project_id and user_id = owner_id) then
    raise exception 'project access denied' using errcode = '42501';
  end if;
  if cardinality(p_place_ids) <> (
    select count(*) from public.project_places
    where project_id = p_project_id and user_id = owner_id
  ) or exists (
    select 1 from unnest(p_place_ids) as requested(id)
    left join public.project_places place
      on place.id = requested.id and place.project_id = p_project_id and place.user_id = owner_id
    where place.id is null
  ) or cardinality(p_place_ids) <> (select count(distinct id) from unnest(p_place_ids) as ids(id)) then
    raise exception 'invalid place order' using errcode = '22023';
  end if;
  update public.project_places as place
  set sort_order = ordered.position - 1
  from unnest(p_place_ids) with ordinality as ordered(id, position)
  where place.id = ordered.id and place.project_id = p_project_id and place.user_id = owner_id;
end;
$$;

revoke all on function public.validate_project_place_links() from public, anon, authenticated;
revoke all on function public.reorder_project_places(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_project_places(uuid, uuid[]) to authenticated;

commit;
