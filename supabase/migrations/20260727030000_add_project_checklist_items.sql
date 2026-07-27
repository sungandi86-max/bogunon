begin;

alter table public.projects
  add constraint projects_id_user_unique unique (id, user_id);

create table public.project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  is_completed boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_checklist_items_owned_project_fk
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete cascade
);

create index project_checklist_items_project_order_idx
  on public.project_checklist_items(user_id, project_id, sort_order, created_at);

alter table public.project_checklist_items enable row level security;
revoke all on table public.project_checklist_items from public, anon;
grant select, insert, update, delete on table public.project_checklist_items to authenticated;

create policy project_checklist_items_select_own on public.project_checklist_items
  for select to authenticated using (user_id = auth.uid());
create policy project_checklist_items_insert_own on public.project_checklist_items
  for insert to authenticated with check (user_id = auth.uid());
create policy project_checklist_items_update_own on public.project_checklist_items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy project_checklist_items_delete_own on public.project_checklist_items
  for delete to authenticated using (user_id = auth.uid());

create trigger project_checklist_items_set_updated_at
before update on public.project_checklist_items
for each row execute function public.set_updated_at();

create or replace function public.reorder_project_checklist_items(
  p_project_id uuid,
  p_item_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  item_count integer;
  distinct_item_count integer;
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.projects
    where id = p_project_id and user_id = owner_id
  ) then
    raise exception 'project access denied' using errcode = '42501';
  end if;

  select count(*)::integer
    into item_count
  from public.project_checklist_items
  where project_id = p_project_id and user_id = owner_id;

  select count(distinct item_id)::integer
    into distinct_item_count
  from unnest(p_item_ids) as item_id;

  if coalesce(array_length(p_item_ids, 1), 0) <> item_count
    or distinct_item_count <> item_count
    or exists (
      select 1
      from unnest(p_item_ids) as item_id
      where not exists (
        select 1 from public.project_checklist_items
        where id = item_id
          and project_id = p_project_id
          and user_id = owner_id
      )
    ) then
    raise exception 'checklist order is stale' using errcode = '22023';
  end if;

  update public.project_checklist_items as checklist
  set sort_order = ordered.ordinality - 1
  from unnest(p_item_ids) with ordinality as ordered(item_id, ordinality)
  where checklist.id = ordered.item_id
    and checklist.project_id = p_project_id
    and checklist.user_id = owner_id;
end;
$$;

revoke all on function public.reorder_project_checklist_items(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_project_checklist_items(uuid, uuid[]) to authenticated;

commit;
