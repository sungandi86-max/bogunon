begin;

create table public.school_health_desk_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings_version integer not null default 1
    constraint school_health_desk_settings_version_check
    check (settings_version = 1),
  settings jsonb not null
    constraint school_health_desk_settings_object_check
    check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger school_health_desk_settings_set_updated_at
before update on public.school_health_desk_settings
for each row execute function public.set_updated_at();

alter table public.school_health_desk_settings enable row level security;

revoke all on table public.school_health_desk_settings from public, anon, authenticated;
grant select, insert, update, delete on table public.school_health_desk_settings to authenticated;

create policy school_health_desk_settings_select_own
  on public.school_health_desk_settings
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy school_health_desk_settings_insert_own
  on public.school_health_desk_settings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy school_health_desk_settings_update_own
  on public.school_health_desk_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy school_health_desk_settings_delete_own
  on public.school_health_desk_settings
  for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
