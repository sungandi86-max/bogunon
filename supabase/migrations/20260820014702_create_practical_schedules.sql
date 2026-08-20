begin;

create table if not exists public.health_practical_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year smallint not null check (year between 2000 and 2100),
  category text not null default 'staff' check (category in ('staff','student','admin')),
  title text not null check (char_length(trim(title)) between 1 and 200),
  scheduled_date date,
  start_time time,
  end_time time,
  location text,
  method text,
  notes text,
  url text check (url is null or url ~* '^https?://'),
  annual_preset_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time > start_time))
);

alter table public.events add column if not exists practical_schedule_id uuid references public.health_practical_schedules(id) on delete cascade;
create unique index if not exists events_practical_schedule_unique on public.events(practical_schedule_id) where practical_schedule_id is not null;
create index if not exists health_practical_schedules_user_year_idx on public.health_practical_schedules(user_id, year, scheduled_date);

create or replace function public.set_health_practical_schedules_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists health_practical_schedules_updated_at on public.health_practical_schedules;
create trigger health_practical_schedules_updated_at before update on public.health_practical_schedules
for each row execute function public.set_health_practical_schedules_updated_at();

alter table public.health_practical_schedules enable row level security;
grant select, insert, update, delete on public.health_practical_schedules to authenticated;

drop policy if exists "health practical schedules own rows" on public.health_practical_schedules;
create policy "health practical schedules own rows" on public.health_practical_schedules
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;
