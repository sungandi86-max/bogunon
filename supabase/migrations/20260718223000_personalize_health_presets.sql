begin;

create table if not exists public.health_preset_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preset_id text not null check (char_length(trim(preset_id)) between 1 and 80),
  favorite boolean not null default false,
  hidden boolean not null default false,
  sort_order smallint not null check (sort_order between 0 and 11),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_preset_preferences_user_preset_key unique (user_id, preset_id),
  constraint health_preset_preferences_user_sort_key unique (user_id, sort_order) deferrable initially deferred
);

create index if not exists health_preset_preferences_user_favorite_sort_idx
  on public.health_preset_preferences (user_id, favorite desc, sort_order);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'health_preset_preferences_set_updated_at') then
    create trigger health_preset_preferences_set_updated_at
      before update on public.health_preset_preferences
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.health_preset_preferences enable row level security;

revoke all on table public.health_preset_preferences from public, anon;
grant select, insert, update, delete on table public.health_preset_preferences to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'health_preset_preferences' and policyname = 'health_preset_preferences_select_own') then
    create policy health_preset_preferences_select_own on public.health_preset_preferences
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'health_preset_preferences' and policyname = 'health_preset_preferences_insert_own') then
    create policy health_preset_preferences_insert_own on public.health_preset_preferences
      for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'health_preset_preferences' and policyname = 'health_preset_preferences_update_own') then
    create policy health_preset_preferences_update_own on public.health_preset_preferences
      for update to authenticated using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'health_preset_preferences' and policyname = 'health_preset_preferences_delete_own') then
    create policy health_preset_preferences_delete_own on public.health_preset_preferences
      for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

commit;
