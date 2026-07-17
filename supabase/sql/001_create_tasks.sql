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

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (title = btrim(title) and title <> ''),
  area text not null check (
    area in ('healthWork', 'schoolSchedule', 'exercise', 'personal', 'project')
  ),
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

alter table public.tasks enable row level security;
revoke all on table public.tasks from anon;
grant select, insert, update, delete on table public.tasks to authenticated;

create index if not exists tasks_user_scheduled_date_idx
  on public.tasks (user_id, scheduled_date);

create index if not exists tasks_user_due_date_idx
  on public.tasks (user_id, due_date)
  where status not in ('completed', 'onHold');

create index if not exists tasks_user_follow_up_date_idx
  on public.tasks (user_id, follow_up_date)
  where status not in ('completed', 'onHold');

create index if not exists tasks_user_status_priority_idx
  on public.tasks (user_id, status, priority, updated_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'tasks_set_updated_at'
      and tgrelid = 'public.tasks'::regclass
      and not tgisinternal
  ) then
    create trigger tasks_set_updated_at
    before update on public.tasks
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

commit;
