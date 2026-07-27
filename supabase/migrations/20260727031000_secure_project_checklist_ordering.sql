begin;

create or replace function public.assign_project_checklist_sort_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or new.user_id <> auth.uid() then
    raise exception 'checklist owner mismatch' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.project_id::text, 0));
  select coalesce(max(sort_order), -1) + 1
    into new.sort_order
  from public.project_checklist_items
  where project_id = new.project_id
    and user_id = new.user_id;

  return new;
end;
$$;

create trigger project_checklist_items_assign_sort_order
before insert on public.project_checklist_items
for each row execute function public.assign_project_checklist_sort_order();

revoke all on function public.assign_project_checklist_sort_order() from public, anon, authenticated;

revoke insert, update on table public.project_checklist_items from authenticated;
grant insert (user_id, project_id, title, due_date)
  on table public.project_checklist_items to authenticated;
grant update (title, is_completed, due_date)
  on table public.project_checklist_items to authenticated;

alter function public.reorder_project_checklist_items(uuid, uuid[]) security definer;

commit;
