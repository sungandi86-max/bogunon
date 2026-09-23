begin;

create table public.staff_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_key text not null constraint staff_contacts_school_key_check check (char_length(btrim(school_key)) between 1 and 180),
  name text not null constraint staff_contacts_name_check check (char_length(btrim(name)) between 1 and 120),
  mobile_phone text,
  memo text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index staff_contacts_owner_school_idx on public.staff_contacts(user_id, school_key, is_active, name);
create trigger staff_contacts_set_updated_at before update on public.staff_contacts for each row execute function public.set_updated_at();

create table public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_key text not null constraint staff_assignments_school_key_check check (char_length(btrim(school_key)) between 1 and 180),
  staff_id uuid not null references public.staff_contacts(id) on delete cascade,
  school_year integer not null constraint staff_assignments_school_year_check check (school_year between 2000 and 2100),
  semester smallint not null constraint staff_assignments_semester_check check (semester in (1, 2)),
  department text,
  grade_team text,
  subject text,
  role text,
  duties text,
  office_location text,
  seat text,
  extension text,
  is_favorite boolean not null default false,
  sort_order integer not null default 0 constraint staff_assignments_sort_order_check check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, school_year, semester)
);

create index staff_assignments_owner_term_idx on public.staff_assignments(user_id, school_key, school_year, semester, is_active, is_favorite, sort_order);
create trigger staff_assignments_set_updated_at before update on public.staff_assignments for each row execute function public.set_updated_at();

create table public.staff_contact_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_key text not null constraint staff_contact_groups_school_key_check check (char_length(btrim(school_key)) between 1 and 180),
  school_year integer not null constraint staff_contact_groups_school_year_check check (school_year between 2000 and 2100),
  semester smallint not null constraint staff_contact_groups_semester_check check (semester in (1, 2)),
  name text not null constraint staff_contact_groups_name_check check (char_length(btrim(name)) between 1 and 120),
  memo text,
  sort_order integer not null default 0 constraint staff_contact_groups_sort_order_check check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, school_year, semester, name)
);

create index staff_contact_groups_owner_term_idx on public.staff_contact_groups(user_id, school_key, school_year, semester, sort_order, name);
create trigger staff_contact_groups_set_updated_at before update on public.staff_contact_groups for each row execute function public.set_updated_at();

create table public.staff_contact_group_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.staff_contact_groups(id) on delete cascade,
  assignment_id uuid not null references public.staff_assignments(id) on delete cascade,
  sort_order integer not null default 0 constraint staff_contact_group_members_sort_order_check check (sort_order >= 0),
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, assignment_id)
);

create index staff_contact_group_members_owner_idx on public.staff_contact_group_members(user_id, group_id, sort_order);
create trigger staff_contact_group_members_set_updated_at before update on public.staff_contact_group_members for each row execute function public.set_updated_at();

alter table public.staff_contacts enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.staff_contact_groups enable row level security;
alter table public.staff_contact_group_members enable row level security;

revoke all on table public.staff_contacts, public.staff_assignments, public.staff_contact_groups, public.staff_contact_group_members from public, anon;
grant select, insert, update, delete on table public.staff_contacts, public.staff_assignments, public.staff_contact_groups, public.staff_contact_group_members to authenticated;

create policy staff_contacts_select_own on public.staff_contacts for select to authenticated using (user_id = auth.uid());
create policy staff_contacts_insert_own on public.staff_contacts for insert to authenticated with check (user_id = auth.uid());
create policy staff_contacts_update_own on public.staff_contacts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy staff_contacts_delete_own on public.staff_contacts for delete to authenticated using (user_id = auth.uid());

create policy staff_assignments_select_own on public.staff_assignments for select to authenticated using (user_id = auth.uid());
create policy staff_assignments_insert_own on public.staff_assignments for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.staff_contacts c where c.id = staff_id and c.user_id = auth.uid()));
create policy staff_assignments_update_own on public.staff_assignments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from public.staff_contacts c where c.id = staff_id and c.user_id = auth.uid()));
create policy staff_assignments_delete_own on public.staff_assignments for delete to authenticated using (user_id = auth.uid());

create policy staff_contact_groups_select_own on public.staff_contact_groups for select to authenticated using (user_id = auth.uid());
create policy staff_contact_groups_insert_own on public.staff_contact_groups for insert to authenticated with check (user_id = auth.uid());
create policy staff_contact_groups_update_own on public.staff_contact_groups for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy staff_contact_groups_delete_own on public.staff_contact_groups for delete to authenticated using (user_id = auth.uid());

create policy staff_contact_group_members_select_own on public.staff_contact_group_members for select to authenticated using (user_id = auth.uid());
create policy staff_contact_group_members_insert_own on public.staff_contact_group_members for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.staff_contact_groups g where g.id = group_id and g.user_id = auth.uid()) and exists (select 1 from public.staff_assignments a where a.id = assignment_id and a.user_id = auth.uid()));
create policy staff_contact_group_members_update_own on public.staff_contact_group_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from public.staff_contact_groups g where g.id = group_id and g.user_id = auth.uid()) and exists (select 1 from public.staff_assignments a where a.id = assignment_id and a.user_id = auth.uid()));
create policy staff_contact_group_members_delete_own on public.staff_contact_group_members for delete to authenticated using (user_id = auth.uid());

commit;
