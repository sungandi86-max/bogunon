begin;

alter table public.user_settings
  add column if not exists neis_school_level text,
  add column if not exists neis_region text,
  add column if not exists neis_address text,
  add column if not exists school_latitude double precision,
  add column if not exists school_longitude double precision,
  add column if not exists meal_enabled boolean not null default true,
  add column if not exists weather_enabled boolean not null default true;

alter table public.user_settings
  drop constraint if exists user_settings_school_information_check;

alter table public.user_settings
  add constraint user_settings_school_information_check check (
    (neis_school_level is null or (
      neis_school_level = btrim(neis_school_level)
      and neis_school_level <> ''
      and char_length(neis_school_level) <= 50
    ))
    and (neis_region is null or (
      neis_region = btrim(neis_region)
      and neis_region <> ''
      and char_length(neis_region) <= 100
    ))
    and (neis_address is null or (
      neis_address = btrim(neis_address)
      and neis_address <> ''
      and char_length(neis_address) <= 300
    ))
    and (school_latitude is null or school_latitude between -90 and 90)
    and (school_longitude is null or school_longitude between -180 and 180)
  );

alter table public.user_settings enable row level security;

revoke all on table public.user_settings from public, anon;
grant select, insert, update, delete on table public.user_settings to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_settings'
      and policyname = 'user_settings_select_own'
  ) then
    create policy user_settings_select_own on public.user_settings
      for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_settings'
      and policyname = 'user_settings_insert_own'
  ) then
    create policy user_settings_insert_own on public.user_settings
      for insert to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_settings'
      and policyname = 'user_settings_update_own'
  ) then
    create policy user_settings_update_own on public.user_settings
      for update to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_settings'
      and policyname = 'user_settings_delete_own'
  ) then
    create policy user_settings_delete_own on public.user_settings
      for delete to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;

comment on column public.user_settings.neis_school_level is 'NEIS school level selected by the authenticated user';
comment on column public.user_settings.neis_region is 'NEIS school region selected by the authenticated user';
comment on column public.user_settings.neis_address is 'Public school address used for location-based personalization';
comment on column public.user_settings.school_latitude is 'Optional school latitude for weather personalization';
comment on column public.user_settings.school_longitude is 'Optional school longitude for weather personalization';
comment on column public.user_settings.meal_enabled is 'Whether the authenticated user enables the briefing meal card';
comment on column public.user_settings.weather_enabled is 'Whether the authenticated user enables the briefing weather card';

commit;
