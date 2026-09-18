drop policy if exists practical_tools_insert_own on public.practical_tools;
drop policy if exists practical_tools_update_own on public.practical_tools;
drop policy if exists practical_tools_delete_own on public.practical_tools;

create policy practical_tools_insert_own on public.practical_tools
for insert to authenticated
with check (
  (scope = 'personal' and owner_id = (select auth.uid()))
  or
  (scope = 'public' and owner_id is null and private.is_notice_admin())
);

create policy practical_tools_update_own on public.practical_tools
for update to authenticated
using (
  (scope = 'personal' and owner_id = (select auth.uid()))
  or
  (scope = 'public' and private.is_notice_admin())
)
with check (
  (scope = 'personal' and owner_id = (select auth.uid()))
  or
  (scope = 'public' and owner_id is null and private.is_notice_admin())
);

create policy practical_tools_delete_own on public.practical_tools
for delete to authenticated
using (
  (scope = 'personal' and owner_id = (select auth.uid()))
  or
  (scope = 'public' and private.is_notice_admin())
);
