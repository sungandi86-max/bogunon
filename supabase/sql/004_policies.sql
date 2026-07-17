begin;

do $$
begin
  if to_regclass('public.tasks') is not null then
    alter table public.tasks enable row level security;
    revoke all on table public.tasks from anon;
    grant select, insert, update, delete on table public.tasks to authenticated;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_select_own'
    ) then
      create policy tasks_select_own on public.tasks
      for select to authenticated
      using ((select auth.uid()) = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_insert_own'
    ) then
      create policy tasks_insert_own on public.tasks
      for insert to authenticated
      with check ((select auth.uid()) = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_update_own'
    ) then
      create policy tasks_update_own on public.tasks
      for update to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_delete_own'
    ) then
      create policy tasks_delete_own on public.tasks
      for delete to authenticated
      using ((select auth.uid()) = user_id);
    end if;
  end if;

  if to_regclass('public.events') is not null then
    alter table public.events enable row level security;
    revoke all on table public.events from anon;
    grant select, insert, update, delete on table public.events to authenticated;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'events' and policyname = 'events_select_own'
    ) then
      create policy events_select_own on public.events
      for select to authenticated
      using ((select auth.uid()) = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'events' and policyname = 'events_insert_own'
    ) then
      create policy events_insert_own on public.events
      for insert to authenticated
      with check ((select auth.uid()) = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'events' and policyname = 'events_update_own'
    ) then
      create policy events_update_own on public.events
      for update to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'events' and policyname = 'events_delete_own'
    ) then
      create policy events_delete_own on public.events
      for delete to authenticated
      using ((select auth.uid()) = user_id);
    end if;
  end if;
end;
$$;

commit;
