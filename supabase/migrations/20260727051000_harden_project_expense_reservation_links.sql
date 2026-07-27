begin;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.project_reservations'::regclass
      and conname = 'project_reservations_identity_project_user_unique'
  ) then
    alter table public.project_reservations
      add constraint project_reservations_identity_project_user_unique
      unique (id, project_id, user_id);
  end if;
end;
$$;

alter table public.project_expenses
  drop constraint if exists project_expenses_reservation_id_fkey;
alter table public.project_expenses
  drop constraint if exists project_expenses_owned_reservation_fk;
alter table public.project_expenses
  add constraint project_expenses_owned_reservation_fk
  foreign key (reservation_id, project_id, user_id)
  references public.project_reservations(id, project_id, user_id)
  on delete set null (reservation_id);

create or replace function public.validate_project_reservation_expense()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.project_expenses expense
    where expense.reservation_id = new.id
      and (
        expense.project_id <> new.project_id
        or expense.user_id <> new.user_id
      )
  ) then
    raise exception 'linked expense project mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists project_reservations_validate_expense
  on public.project_reservations;
create trigger project_reservations_validate_expense
before update of project_id, user_id
on public.project_reservations
for each row execute function public.validate_project_reservation_expense();

revoke all on function public.validate_project_reservation_expense()
  from public, anon, authenticated;

commit;
