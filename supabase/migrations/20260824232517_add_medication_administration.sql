begin;

create table public.medication_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('internal', 'external', 'supplies', 'other')),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  specification text not null default '' check (char_length(specification) <= 160),
  unit text not null default '' check (char_length(unit) <= 40),
  recommended_stock integer not null default 0 check (recommended_stock >= 0),
  management_tip text check (management_tip is null or char_length(management_tip) <= 1000),
  note text check (note is null or char_length(note) <= 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_items_identity_unique unique (id, user_id),
  constraint medication_items_unique_name unique (user_id, name, specification, unit)
);

create table public.medication_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_year integer not null check (budget_year between 2000 and 2100),
  name text not null default '보건실 의약품 예산' check (char_length(name) <= 160),
  amount bigint not null default 0 check (amount >= 0),
  memo text check (memo is null or char_length(memo) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, budget_year)
);

create table public.medication_purchase_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  quantity integer not null check (quantity > 0),
  expected_unit_price bigint not null default 0 check (expected_unit_price >= 0),
  status text not null default 'planned' check (status in ('planned', 'ordered', 'partially_received', 'received', 'cancelled')),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_purchase_plans_identity_unique unique (id, user_id),
  constraint medication_purchase_plans_item_owner_fk foreign key (item_id, user_id)
    references public.medication_items(id, user_id) on delete restrict
);

create table public.medication_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  purchase_plan_id uuid,
  received_at date not null,
  quantity integer not null check (quantity > 0),
  actual_unit_price bigint not null check (actual_unit_price >= 0),
  expiration_date date not null,
  idempotency_key text not null check (char_length(btrim(idempotency_key)) between 1 and 120),
  inventory_applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint medication_receipts_identity_unique unique (id, user_id),
  constraint medication_receipts_item_owner_fk foreign key (item_id, user_id)
    references public.medication_items(id, user_id) on delete restrict,
  constraint medication_receipts_purchase_owner_fk foreign key (purchase_plan_id, user_id)
    references public.medication_purchase_plans(id, user_id) on delete set null (purchase_plan_id),
  unique (user_id, idempotency_key)
);

create table public.medication_lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  receipt_id uuid,
  quantity integer not null check (quantity > 0),
  expiration_date date not null,
  received_at date not null,
  unit_price bigint not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  constraint medication_lots_item_owner_fk foreign key (item_id, user_id)
    references public.medication_items(id, user_id) on delete restrict,
  constraint medication_lots_receipt_owner_fk foreign key (receipt_id, user_id)
    references public.medication_receipts(id, user_id) on delete restrict
);

create index medication_items_owner_active_idx on public.medication_items(user_id, active, name);
create index medication_lots_owner_item_expiry_idx on public.medication_lots(user_id, item_id, expiration_date, received_at);
create index medication_purchase_plans_owner_status_idx on public.medication_purchase_plans(user_id, status, created_at desc);
create index medication_receipts_owner_date_idx on public.medication_receipts(user_id, received_at desc);

create trigger medication_items_set_updated_at before update on public.medication_items
for each row execute function public.set_updated_at();
create trigger medication_budgets_set_updated_at before update on public.medication_budgets
for each row execute function public.set_updated_at();
create trigger medication_purchase_plans_set_updated_at before update on public.medication_purchase_plans
for each row execute function public.set_updated_at();

alter table public.medication_items enable row level security;
alter table public.medication_budgets enable row level security;
alter table public.medication_purchase_plans enable row level security;
alter table public.medication_receipts enable row level security;
alter table public.medication_lots enable row level security;

revoke all on table public.medication_items, public.medication_budgets, public.medication_purchase_plans,
  public.medication_receipts, public.medication_lots from public, anon;
grant select, insert, update, delete on table public.medication_items, public.medication_budgets,
  public.medication_purchase_plans, public.medication_receipts, public.medication_lots to authenticated;

create policy medication_items_own on public.medication_items for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy medication_budgets_own on public.medication_budgets for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy medication_purchase_plans_own on public.medication_purchase_plans for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy medication_receipts_own on public.medication_receipts for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy medication_lots_own on public.medication_lots for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.receive_medication(
  p_item_id uuid,
  p_purchase_plan_id uuid,
  p_received_at date,
  p_quantity integer,
  p_actual_unit_price bigint,
  p_expiration_date date,
  p_idempotency_key text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  receipt_id uuid;
  plan_quantity integer;
  received_quantity integer;
begin
  if owner_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_quantity <= 0 or p_actual_unit_price < 0 then raise exception 'invalid receipt values' using errcode = '22023'; end if;
  if not exists (select 1 from public.medication_items where id = p_item_id and user_id = owner_id and active) then
    raise exception 'medication item access denied' using errcode = '42501';
  end if;
  if p_purchase_plan_id is not null and not exists (
    select 1 from public.medication_purchase_plans where id = p_purchase_plan_id and user_id = owner_id
  ) then raise exception 'purchase plan access denied' using errcode = '42501'; end if;

  insert into public.medication_receipts(user_id, item_id, purchase_plan_id, received_at, quantity, actual_unit_price, expiration_date, idempotency_key)
  values (owner_id, p_item_id, p_purchase_plan_id, p_received_at, p_quantity, p_actual_unit_price, p_expiration_date, p_idempotency_key)
  on conflict (user_id, idempotency_key) do nothing
  returning id into receipt_id;

  if receipt_id is null then
    select id into receipt_id from public.medication_receipts where user_id = owner_id and idempotency_key = p_idempotency_key;
    return receipt_id;
  end if;

  insert into public.medication_lots(user_id, item_id, receipt_id, quantity, expiration_date, received_at, unit_price)
  values (owner_id, p_item_id, receipt_id, p_quantity, p_expiration_date, p_received_at, p_actual_unit_price);

  if p_purchase_plan_id is not null then
    select quantity into plan_quantity from public.medication_purchase_plans where id = p_purchase_plan_id and user_id = owner_id for update;
    select coalesce(sum(quantity), 0) into received_quantity from public.medication_receipts where purchase_plan_id = p_purchase_plan_id and user_id = owner_id;
    update public.medication_purchase_plans
    set status = case when received_quantity >= plan_quantity then 'received' else 'partially_received' end
    where id = p_purchase_plan_id and user_id = owner_id;
  end if;
  return receipt_id;
end;
$$;

revoke all on function public.receive_medication(uuid, uuid, date, integer, bigint, date, text) from public, anon;
grant execute on function public.receive_medication(uuid, uuid, date, integer, bigint, date, text) to authenticated;

commit;
