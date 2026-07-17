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

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (title = btrim(title) and title <> ''),
  area text not null check (area in ('healthWork', 'schoolSchedule', 'exercise', 'personal', 'project')),
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

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (title = btrim(title) and title <> ''),
  area text not null check (area in ('healthWork', 'schoolSchedule', 'exercise', 'personal', 'project')),
  status text not null default 'planned' check (
    status in ('planned', 'inProgress', 'waitingForReply', 'needsCheck', 'completed', 'onHold')
  ),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  scheduled_date date,
  due_date date,
  follow_up_date date,
  memo text check (memo is null or (memo = btrim(memo) and memo <> '')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_completed_at_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index events_user_date_range_idx on public.events (user_id, start_date, end_date);
create index tasks_user_scheduled_date_idx on public.tasks (user_id, scheduled_date);
create index tasks_user_due_date_idx on public.tasks (user_id, due_date)
  where status not in ('completed', 'onHold');
create index tasks_user_follow_up_date_idx on public.tasks (user_id, follow_up_date)
  where status not in ('completed', 'onHold');
create index tasks_user_status_priority_idx on public.tasks (user_id, status, priority, updated_at desc);

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.tasks enable row level security;

revoke all on table public.events from anon;
revoke all on table public.tasks from anon;
grant select, insert, update, delete on table public.events to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

create policy events_select_own on public.events
for select to authenticated using ((select auth.uid()) = user_id);
create policy events_insert_own on public.events
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy events_update_own on public.events
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy events_delete_own on public.events
for delete to authenticated using ((select auth.uid()) = user_id);

create policy tasks_select_own on public.tasks
for select to authenticated using ((select auth.uid()) = user_id);
create policy tasks_insert_own on public.tasks
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy tasks_update_own on public.tasks
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy tasks_delete_own on public.tasks
for delete to authenticated using ((select auth.uid()) = user_id);

commit;
