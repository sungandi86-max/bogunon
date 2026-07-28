begin;

create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects
    where projects.id = p_project_id
      and projects.user_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_project(uuid) from public, anon;
grant execute on function public.owns_project(uuid) to authenticated;

drop policy project_files_storage_insert_own on storage.objects;

create policy project_files_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-files'
  and split_part(name, '/', 1) = (select auth.uid()::text)
  and split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and split_part(name, '/', 3) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|png|jpe?g|webp|docx|xlsx|pptx|txt)$'
  and split_part(name, '/', 4) = ''
  and public.owns_project(split_part(name, '/', 2)::uuid)
);

commit;
