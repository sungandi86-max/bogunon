begin;

create table if not exists public.annual_planner_custom_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  title text not null check (char_length(trim(title)) between 1 and 120),
  item_kind text not null check (item_kind in ('task', 'event')),
  description text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 1440),
  checklist_json jsonb not null default '[]'::jsonb check (
    jsonb_typeof(checklist_json) = 'array'
    and not jsonb_path_exists(checklist_json, '$[*] ? (@.type() != "string")')
  ),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists annual_planner_custom_items_user_month_sort_idx
  on public.annual_planner_custom_items (user_id, month, sort_order, created_at);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'annual_planner_custom_items_set_updated_at') then
    create trigger annual_planner_custom_items_set_updated_at
      before update on public.annual_planner_custom_items
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.annual_planner_custom_items enable row level security;

revoke all on table public.annual_planner_custom_items from public, anon;
grant select, insert, update, delete on table public.annual_planner_custom_items to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'annual_planner_custom_items' and policyname = 'annual_planner_custom_items_select_own') then
    create policy annual_planner_custom_items_select_own on public.annual_planner_custom_items
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'annual_planner_custom_items' and policyname = 'annual_planner_custom_items_insert_own') then
    create policy annual_planner_custom_items_insert_own on public.annual_planner_custom_items
      for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'annual_planner_custom_items' and policyname = 'annual_planner_custom_items_update_own') then
    create policy annual_planner_custom_items_update_own on public.annual_planner_custom_items
      for update to authenticated using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'annual_planner_custom_items' and policyname = 'annual_planner_custom_items_delete_own') then
    create policy annual_planner_custom_items_delete_own on public.annual_planner_custom_items
      for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

commit;
