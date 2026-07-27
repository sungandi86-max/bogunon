begin;

alter table public.project_reservations
  add constraint project_reservations_identity_project_user_unique
  unique (id, project_id, user_id);

create table public.project_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  budget_amount bigint not null check (
    budget_amount between 0 and 1000000000000
  ),
  currency text not null default 'KRW' check (currency = 'KRW'),
  memo text check (memo is null or char_length(memo) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_budgets_owned_project_fk
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete cascade,
  constraint project_budgets_project_unique unique (project_id)
);

create table public.project_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  reservation_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  category text not null check (
    category in (
      'transportation',
      'accommodation',
      'food',
      'activity',
      'shopping',
      'ticket',
      'supplies',
      'fee',
      'other'
    )
  ),
  amount bigint not null check (amount between 0 and 1000000000000),
  expense_date date not null,
  payment_status text not null check (payment_status in ('planned', 'paid')),
  memo text check (memo is null or char_length(memo) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_expenses_owned_project_fk
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete cascade,
  constraint project_expenses_owned_reservation_fk
    foreign key (reservation_id, project_id, user_id)
    references public.project_reservations(id, project_id, user_id)
    on delete set null (reservation_id)
);

create index project_expenses_project_date_idx
  on public.project_expenses(
    user_id,
    project_id,
    expense_date,
    created_at
  );
create unique index project_expenses_reservation_unique
  on public.project_expenses(reservation_id)
  where reservation_id is not null;

create trigger project_budgets_set_updated_at
before update on public.project_budgets
for each row execute function public.set_updated_at();

create trigger project_expenses_set_updated_at
before update on public.project_expenses
for each row execute function public.set_updated_at();

create or replace function public.validate_project_expense_reservation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reservation_id is not null and not exists (
    select 1
    from public.project_reservations reservation
    where reservation.id = new.reservation_id
      and reservation.project_id = new.project_id
      and reservation.user_id = new.user_id
  ) then
    raise exception 'reservation access denied' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger project_expenses_validate_reservation
before insert or update of reservation_id, project_id, user_id
on public.project_expenses
for each row execute function public.validate_project_expense_reservation();

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

create trigger project_reservations_validate_expense
before update of project_id, user_id
on public.project_reservations
for each row execute function public.validate_project_reservation_expense();

revoke all on function public.validate_project_expense_reservation()
  from public, anon, authenticated;
revoke all on function public.validate_project_reservation_expense()
  from public, anon, authenticated;

alter table public.project_budgets enable row level security;
alter table public.project_expenses enable row level security;

revoke all on table public.project_budgets from public, anon;
revoke all on table public.project_expenses from public, anon;
grant select on table public.project_budgets to authenticated;
grant select on table public.project_expenses to authenticated;

create policy project_budgets_select_own on public.project_budgets
  for select to authenticated using (user_id = auth.uid());
create policy project_budgets_insert_own on public.project_budgets
  for insert to authenticated with check (user_id = auth.uid());
create policy project_budgets_update_own on public.project_budgets
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy project_budgets_delete_own on public.project_budgets
  for delete to authenticated using (user_id = auth.uid());

create policy project_expenses_select_own on public.project_expenses
  for select to authenticated using (user_id = auth.uid());
create policy project_expenses_insert_own on public.project_expenses
  for insert to authenticated with check (user_id = auth.uid());
create policy project_expenses_update_own on public.project_expenses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy project_expenses_delete_own on public.project_expenses
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.save_project_budget(
  p_project_id uuid,
  p_budget_amount bigint,
  p_currency text,
  p_memo text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  budget_id uuid;
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

  insert into public.project_budgets (
    user_id,
    project_id,
    budget_amount,
    currency,
    memo
  ) values (
    owner_id,
    p_project_id,
    p_budget_amount,
    p_currency,
    nullif(btrim(p_memo), '')
  )
  on conflict (project_id) do update
  set
    budget_amount = excluded.budget_amount,
    currency = excluded.currency,
    memo = excluded.memo
  where project_budgets.user_id = owner_id
  returning id into budget_id;

  if budget_id is null then
    raise exception 'budget access denied' using errcode = '42501';
  end if;
  return budget_id;
end;
$$;

create or replace function public.delete_project_budget(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  delete from public.project_budgets
  where project_id = p_project_id and user_id = owner_id;
end;
$$;

create or replace function public.save_project_expense(
  p_expense_id uuid,
  p_values jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  expense_id uuid;
  project_id_value uuid := nullif(p_values->>'project_id', '')::uuid;
  reservation_id_value uuid := nullif(p_values->>'reservation_id', '')::uuid;
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.projects
    where id = project_id_value and user_id = owner_id
  ) then
    raise exception 'project access denied' using errcode = '42501';
  end if;

  if p_expense_id is null then
    insert into public.project_expenses (
      user_id,
      project_id,
      reservation_id,
      title,
      category,
      amount,
      expense_date,
      payment_status,
      memo
    ) values (
      owner_id,
      project_id_value,
      reservation_id_value,
      p_values->>'title',
      p_values->>'category',
      (p_values->>'amount')::bigint,
      (p_values->>'expense_date')::date,
      p_values->>'payment_status',
      nullif(btrim(p_values->>'memo'), '')
    )
    returning id into expense_id;
  else
    update public.project_expenses
    set
      project_id = project_id_value,
      reservation_id = reservation_id_value,
      title = p_values->>'title',
      category = p_values->>'category',
      amount = (p_values->>'amount')::bigint,
      expense_date = (p_values->>'expense_date')::date,
      payment_status = p_values->>'payment_status',
      memo = nullif(btrim(p_values->>'memo'), '')
    where id = p_expense_id and user_id = owner_id
    returning id into expense_id;
  end if;

  if expense_id is null then
    raise exception 'expense not found' using errcode = 'P0002';
  end if;
  return expense_id;
end;
$$;

create or replace function public.delete_project_expense(p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  delete from public.project_expenses
  where id = p_expense_id and user_id = owner_id;
  if not found then
    raise exception 'expense not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.update_project_expense_status(
  p_expense_id uuid,
  p_payment_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  update public.project_expenses
  set payment_status = p_payment_status
  where id = p_expense_id and user_id = owner_id;
  if not found then
    raise exception 'expense not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.save_project_reservation_with_expense(
  p_reservation_id uuid,
  p_values jsonb,
  p_sync_calendar boolean,
  p_sync_expense boolean,
  p_update_expense boolean,
  p_expense_values jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  saved_reservation_id uuid;
  expense_id uuid;
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  saved_reservation_id := public.save_project_reservation(
    p_reservation_id,
    p_values,
    p_sync_calendar
  );

  select id into expense_id
  from public.project_expenses
  where reservation_id = saved_reservation_id
    and user_id = owner_id
  for update;

  if p_sync_expense then
    if p_expense_values is null then
      raise exception 'expense values required' using errcode = '22023';
    end if;
    if expense_id is null then
      perform public.save_project_expense(
        null,
        p_expense_values || jsonb_build_object(
          'project_id', p_values->>'project_id',
          'reservation_id', saved_reservation_id
        )
      );
    elsif p_update_expense then
      perform public.save_project_expense(
        expense_id,
        p_expense_values || jsonb_build_object(
          'project_id', p_values->>'project_id',
          'reservation_id', saved_reservation_id
        )
      );
    end if;
  elsif expense_id is not null then
    update public.project_expenses
    set reservation_id = null
    where id = expense_id and user_id = owner_id;
  end if;

  return saved_reservation_id;
end;
$$;

create or replace function public.delete_project_reservation_with_expense(
  p_reservation_id uuid,
  p_delete_linked_event boolean,
  p_delete_linked_expense boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_delete_linked_expense then
    delete from public.project_expenses
    where reservation_id = p_reservation_id and user_id = owner_id;
  end if;
  perform public.delete_project_reservation(
    p_reservation_id,
    p_delete_linked_event
  );
end;
$$;

revoke all on function public.save_project_budget(uuid, bigint, text, text)
  from public, anon;
grant execute on function public.save_project_budget(uuid, bigint, text, text)
  to authenticated;
revoke all on function public.delete_project_budget(uuid)
  from public, anon;
grant execute on function public.delete_project_budget(uuid)
  to authenticated;
revoke all on function public.save_project_expense(uuid, jsonb)
  from public, anon;
grant execute on function public.save_project_expense(uuid, jsonb)
  to authenticated;
revoke all on function public.delete_project_expense(uuid)
  from public, anon;
grant execute on function public.delete_project_expense(uuid)
  to authenticated;
revoke all on function public.update_project_expense_status(uuid, text)
  from public, anon;
grant execute on function public.update_project_expense_status(uuid, text)
  to authenticated;
revoke all on function public.save_project_reservation_with_expense(
  uuid,
  jsonb,
  boolean,
  boolean,
  boolean,
  jsonb
) from public, anon;
grant execute on function public.save_project_reservation_with_expense(
  uuid,
  jsonb,
  boolean,
  boolean,
  boolean,
  jsonb
) to authenticated;
revoke all on function public.delete_project_reservation_with_expense(
  uuid,
  boolean,
  boolean
) from public, anon;
grant execute on function public.delete_project_reservation_with_expense(
  uuid,
  boolean,
  boolean
) to authenticated;

commit;
