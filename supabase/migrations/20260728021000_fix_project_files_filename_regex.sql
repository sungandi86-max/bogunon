begin;

alter table public.project_files
  drop constraint project_files_filename_check;

alter table public.project_files
  add constraint project_files_filename_check check (
    filename = btrim(filename)
    and char_length(filename) between 1 and 255
    and filename !~ '[/\\]'
    and filename !~ '[[:cntrl:]]'
    and filename ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|png|jpe?g|webp|docx|xlsx|pptx|txt)$'
  );

drop policy project_files_storage_insert_own on storage.objects;

create policy project_files_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and array_length(storage.foldername(name), 1) = 2
  and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|png|jpe?g|webp|docx|xlsx|pptx|txt)$'
  and exists (
    select 1
    from public.projects
    where projects.user_id = (select auth.uid())
      and projects.id::text = (storage.foldername(name))[2]
  )
);

commit;
