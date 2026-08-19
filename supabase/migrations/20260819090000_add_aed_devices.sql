begin;

create table public.aed_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null constraint aed_devices_name_check check (char_length(btrim(name)) between 1 and 120),
  location text not null constraint aed_devices_location_check check (char_length(btrim(location)) between 1 and 200),
  battery_expiry_date date,
  pad_expiry_date date,
  last_inspection_date date,
  next_inspection_date date,
  inspection_interval_months integer not null default 0 constraint aed_devices_interval_check check (inspection_interval_months between 0 and 120),
  note text constraint aed_devices_note_check check (note is null or char_length(note) <= 2000),
  sort_order integer not null default 0 constraint aed_devices_sort_order_check check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index aed_devices_user_sort_idx on public.aed_devices(user_id, sort_order, created_at);
create trigger aed_devices_set_updated_at before update on public.aed_devices for each row execute function public.set_updated_at();

alter table public.aed_devices enable row level security;
revoke all on table public.aed_devices from public, anon;
grant select, insert, update, delete on table public.aed_devices to authenticated;

create policy aed_devices_select_own on public.aed_devices for select to authenticated using (user_id = auth.uid());
create policy aed_devices_insert_own on public.aed_devices for insert to authenticated with check (user_id = auth.uid());
create policy aed_devices_update_own on public.aed_devices for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy aed_devices_delete_own on public.aed_devices for delete to authenticated using (user_id = auth.uid());

commit;
