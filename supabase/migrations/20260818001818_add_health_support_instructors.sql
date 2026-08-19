begin;

create table public.health_support_instructors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null constraint health_support_instructors_name_check check (char_length(btrim(name)) between 1 and 120),
  subject text not null constraint health_support_instructors_subject_check check (char_length(btrim(subject)) between 1 and 160),
  weekly_hours numeric(5, 2) not null default 0 constraint health_support_instructors_weekly_hours_check check (weekly_hours between 0 and 168),
  hourly_rate numeric(12, 2) not null default 0 constraint health_support_instructors_hourly_rate_check check (hourly_rate >= 0),
  monthly_insurance numeric(12, 2) not null default 0 constraint health_support_instructors_monthly_insurance_check check (monthly_insurance >= 0),
  monthly_hour_limit numeric(5, 2) not null default 60 constraint health_support_instructors_monthly_hour_limit_check check (monthly_hour_limit > 0 and monthly_hour_limit <= 744),
  weekly_hour_limit numeric(5, 2) not null default 15 constraint health_support_instructors_weekly_hour_limit_check check (weekly_hour_limit > 0 and weekly_hour_limit <= 168),
  total_budget numeric(14, 2) not null default 0 constraint health_support_instructors_total_budget_check check (total_budget >= 0),
  operation_start_date date not null,
  operation_end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_support_instructors_user_id_id_key unique (user_id, id),
  constraint health_support_instructors_operation_date_range_check
    check (operation_end_date >= operation_start_date)
);

create table public.health_support_work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instructor_id uuid not null,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  note text constraint health_support_work_logs_note_check check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_support_work_logs_owned_instructor_fk
    foreign key (user_id, instructor_id)
    references public.health_support_instructors(user_id, id)
    on delete cascade,
  constraint health_support_work_logs_time_range_check
    check (end_time > start_time)
);

create index health_support_instructors_user_updated_idx
  on public.health_support_instructors(user_id, updated_at desc);
create index health_support_work_logs_user_instructor_date_idx
  on public.health_support_work_logs(user_id, instructor_id, work_date, start_time);

create trigger health_support_instructors_set_updated_at
before update on public.health_support_instructors
for each row execute function public.set_updated_at();

create trigger health_support_work_logs_set_updated_at
before update on public.health_support_work_logs
for each row execute function public.set_updated_at();

alter table public.health_support_instructors enable row level security;
alter table public.health_support_work_logs enable row level security;

revoke all on table public.health_support_instructors from public, anon;
revoke all on table public.health_support_work_logs from public, anon;
grant select, insert, update, delete on table public.health_support_instructors to authenticated;
grant select, insert, update, delete on table public.health_support_work_logs to authenticated;

create policy health_support_instructors_select_own on public.health_support_instructors
  for select to authenticated using (user_id = auth.uid());
create policy health_support_instructors_insert_own on public.health_support_instructors
  for insert to authenticated with check (user_id = auth.uid());
create policy health_support_instructors_update_own on public.health_support_instructors
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy health_support_instructors_delete_own on public.health_support_instructors
  for delete to authenticated using (user_id = auth.uid());

create policy health_support_work_logs_select_own on public.health_support_work_logs
  for select to authenticated using (user_id = auth.uid());
create policy health_support_work_logs_insert_own on public.health_support_work_logs
  for insert to authenticated with check (user_id = auth.uid());
create policy health_support_work_logs_update_own on public.health_support_work_logs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy health_support_work_logs_delete_own on public.health_support_work_logs
  for delete to authenticated using (user_id = auth.uid());

commit;
