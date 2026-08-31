begin;

create table public.health_support_attendance_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instructor_id uuid not null,
  year smallint not null check (year between 2000 and 2100),
  month smallint not null check (month between 1 and 12),
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_support_attendance_confirmations_owner_fk
    foreign key (user_id, instructor_id)
    references public.health_support_instructors(user_id, id)
    on delete cascade,
  constraint health_support_attendance_confirmations_confirmed_at_check
    check ((confirmed and confirmed_at is not null) or (not confirmed and confirmed_at is null)),
  constraint health_support_attendance_confirmations_user_instructor_month_key
    unique (user_id, instructor_id, year, month)
);

create index health_support_attendance_confirmations_lookup_idx
  on public.health_support_attendance_confirmations(user_id, instructor_id, year, month);

create trigger health_support_attendance_confirmations_set_updated_at
before update on public.health_support_attendance_confirmations
for each row execute function public.set_updated_at();

alter table public.health_support_attendance_confirmations enable row level security;
revoke all on table public.health_support_attendance_confirmations from public, anon;
grant select, insert, update, delete on table public.health_support_attendance_confirmations to authenticated;

create policy health_support_attendance_confirmations_select_own on public.health_support_attendance_confirmations
  for select to authenticated using (user_id = auth.uid());
create policy health_support_attendance_confirmations_insert_own on public.health_support_attendance_confirmations
  for insert to authenticated with check (user_id = auth.uid());
create policy health_support_attendance_confirmations_update_own on public.health_support_attendance_confirmations
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy health_support_attendance_confirmations_delete_own on public.health_support_attendance_confirmations
  for delete to authenticated using (user_id = auth.uid());

commit;
