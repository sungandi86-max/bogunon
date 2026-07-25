begin;

create table public.record_guidelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year smallint not null check (school_year between 2000 and 2100),
  document_type text not null check (
    document_type in ('guide', 'correction', 'supplement', 'other')
  ),
  original_filename text not null check (
    original_filename = btrim(original_filename)
    and original_filename <> ''
    and char_length(original_filename) <= 255
  ),
  mime_type text not null check (
    mime_type in ('application/pdf', 'text/plain')
  ),
  extracted_text text not null check (
    extracted_text = btrim(extracted_text)
    and extracted_text <> ''
    and char_length(extracted_text) <= 100000
  ),
  file_size bigint not null check (file_size > 0 and file_size <= 15728640),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint record_guidelines_user_year_type_key
    unique (user_id, school_year, document_type)
);

create index record_guidelines_user_year_idx
  on public.record_guidelines (user_id, school_year);

create trigger record_guidelines_set_updated_at
before update on public.record_guidelines
for each row execute function public.set_updated_at();

alter table public.record_guidelines enable row level security;

revoke all on table public.record_guidelines from anon;
grant select, insert, update, delete on table public.record_guidelines to authenticated;

create policy record_guidelines_select_own on public.record_guidelines
for select to authenticated
using ((select auth.uid()) = user_id);

create policy record_guidelines_insert_own on public.record_guidelines
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy record_guidelines_update_own on public.record_guidelines
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy record_guidelines_delete_own on public.record_guidelines
for delete to authenticated
using ((select auth.uid()) = user_id);

commit;
