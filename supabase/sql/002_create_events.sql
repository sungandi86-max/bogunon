begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (title = btrim(title) and title <> ''),
  area text not null check (
    area in ('healthWork', 'schoolSchedule', 'exercise', 'personal', 'project')
  ),
  start_date date not null,
  end_date date not null,
  is_all_day boolean not null default true,
  start_time time without time zone,
  end_time time without time zone,
  memo text check (memo is null or (memo = btrim(memo) and memo <> '')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_date_order_check check (end_date >= start_date),
  constraint events_time_check check (
    (is_all_day and start_time is null and end_time is null)
    or (
      not is_all_day
      and start_time is not null
      and (end_time is null or end_date > start_date or end_time > start_time)
    )
  )
);

alter table public.events enable row level security;
revoke all on table public.events from anon;
grant select, insert, update, delete on table public.events to authenticated;

create index if not exists events_user_date_range_idx
  on public.events (user_id, start_date, end_date);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'events_set_updated_at'
      and tgrelid = 'public.events'::regclass
      and not tgisinternal
  ) then
    create trigger events_set_updated_at
    before update on public.events
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

commit;
