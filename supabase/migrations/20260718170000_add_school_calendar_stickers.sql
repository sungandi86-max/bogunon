begin;

create table if not exists public.calendar_stickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sticker_key text not null check (sticker_key in (
    'vacation-ceremony',
    'opening-ceremony',
    'holiday',
    'long-weekend',
    'school-closure',
    'exam-period',
    'school-event',
    'staff-training',
    'flexible-curriculum',
    'other'
  )),
  sticker_date date not null,
  end_date date,
  label text not null check (label = btrim(label) and label <> '' and char_length(label) <= 40),
  note text check (note is null or (note = btrim(note) and note <> '' and char_length(note) <= 500)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_stickers_date_range_check check (end_date is null or end_date >= sticker_date),
  constraint calendar_stickers_user_date_key unique (user_id, sticker_date, sticker_key)
);

create index if not exists calendar_stickers_user_start_date_idx
  on public.calendar_stickers (user_id, sticker_date);
create index if not exists calendar_stickers_user_end_date_idx
  on public.calendar_stickers (user_id, end_date)
  where end_date is not null;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'calendar_stickers_set_updated_at'
      and tgrelid = 'public.calendar_stickers'::regclass
  ) then
    create trigger calendar_stickers_set_updated_at
    before update on public.calendar_stickers
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.calendar_stickers enable row level security;

revoke all on table public.calendar_stickers from public, anon;
grant select, insert, update, delete on table public.calendar_stickers to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'calendar_stickers'
      and policyname = 'calendar_stickers_select_own'
  ) then
    create policy calendar_stickers_select_own on public.calendar_stickers
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'calendar_stickers'
      and policyname = 'calendar_stickers_insert_own'
  ) then
    create policy calendar_stickers_insert_own on public.calendar_stickers
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'calendar_stickers'
      and policyname = 'calendar_stickers_update_own'
  ) then
    create policy calendar_stickers_update_own on public.calendar_stickers
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'calendar_stickers'
      and policyname = 'calendar_stickers_delete_own'
  ) then
    create policy calendar_stickers_delete_own on public.calendar_stickers
    for delete to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end
$$;

commit;
