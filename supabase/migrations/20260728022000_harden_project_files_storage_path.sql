begin;

drop policy project_files_storage_insert_own on storage.objects;

create policy project_files_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-files'
  and split_part(name, '/', 1) = (select auth.uid()::text)
  and split_part(name, '/', 2) <> ''
  and split_part(name, '/', 3) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|png|jpe?g|webp|docx|xlsx|pptx|txt)$'
  and split_part(name, '/', 4) = ''
  and exists (
    select 1
    from public.projects
    where projects.user_id = (select auth.uid())
      and projects.id::text = split_part(name, '/', 2)
  )
);

commit;
