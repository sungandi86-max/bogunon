begin;

create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  content text not null default '' check (char_length(content) <= 100000),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_notes_owned_project_fk
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete cascade
);

create index project_notes_project_order_idx
  on public.project_notes(user_id, project_id, is_pinned desc, updated_at desc);

alter table public.project_notes enable row level security;
revoke all on table public.project_notes from public, anon;
grant select, insert, update, delete on table public.project_notes to authenticated;

create policy project_notes_select_own on public.project_notes
  for select to authenticated using (user_id = auth.uid());
create policy project_notes_insert_own on public.project_notes
  for insert to authenticated with check (user_id = auth.uid());
create policy project_notes_update_own on public.project_notes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy project_notes_delete_own on public.project_notes
  for delete to authenticated using (user_id = auth.uid());

create trigger project_notes_set_updated_at
before update on public.project_notes
for each row execute function public.set_updated_at();

commit;
