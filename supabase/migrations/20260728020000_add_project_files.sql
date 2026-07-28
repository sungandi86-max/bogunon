begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'project-files',
  'project-files',
  false,
  15728640,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  reservation_id uuid,
  filename text not null check (
    filename = btrim(filename)
    and char_length(filename) between 1 and 255
    and filename !~ '[/\\]'
    and filename !~ '[[:cntrl:]]'
    and filename ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|png|jpe?g|webp|docx|xlsx|pptx|txt)$'
  ),
  original_filename text not null check (
    original_filename = btrim(original_filename)
    and char_length(original_filename) between 1 and 255
    and original_filename !~ '[/\\]'
    and original_filename !~ '[[:cntrl:]]'
  ),
  mime_type text not null check (
    mime_type in (
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    )
  ),
  size_bytes bigint not null check (size_bytes between 1 and 15728640),
  storage_path text not null unique,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_files_owned_project_fk
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete cascade,
  constraint project_files_owned_reservation_fk
    foreign key (reservation_id, project_id, user_id)
    references public.project_reservations(id, project_id, user_id)
    on delete set null (reservation_id),
  constraint project_files_storage_path_check check (
    storage_path = user_id::text || '/' || project_id::text || '/' || filename
  )
);

create index project_files_project_uploaded_idx
  on public.project_files(user_id, project_id, uploaded_at desc);

alter table public.project_files enable row level security;
revoke all on table public.project_files from public, anon;
grant select, insert, delete on table public.project_files to authenticated;

create policy project_files_select_own on public.project_files
  for select to authenticated using (user_id = (select auth.uid()));
create policy project_files_insert_own on public.project_files
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy project_files_delete_own on public.project_files
  for delete to authenticated using (user_id = (select auth.uid()));

create trigger project_files_set_updated_at
before update on public.project_files
for each row execute function public.set_updated_at();

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

create policy project_files_storage_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-files'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.project_files
    where project_files.user_id = (select auth.uid())
      and project_files.storage_path = name
  )
);

create policy project_files_storage_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-files'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.projects
    where projects.user_id = (select auth.uid())
      and projects.id::text = (storage.foldername(name))[2]
  )
);

commit;
