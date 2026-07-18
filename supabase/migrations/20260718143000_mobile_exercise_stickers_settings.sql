begin;

create table if not exists public.exercise_stickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  label text not null check (label = btrim(label) and label <> '' and char_length(label) <= 30),
  icon_key text not null check (icon_key in ('badminton', 'badminton_lesson', 'walking', 'running', 'strength', 'stretching', 'cycling', 'swimming', 'other')),
  color_key text not null check (color_key in ('mint', 'pink', 'yellow', 'coral', 'blue', 'lavender', 'sky', 'aqua', 'cream')),
  display_order integer not null default 0 check (display_order >= 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_stickers_owner_kind_check check (
    (is_default and user_id is null) or (not is_default and user_id is not null)
  )
);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sticker_id uuid not null references public.exercise_stickers(id) on delete restrict,
  exercise_date date not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 1440),
  note text check (note is null or (note = btrim(note) and note <> '' and char_length(note) <= 500)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_logs_user_date_sticker_key unique (user_id, exercise_date, sticker_id)
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_starts_on text not null default 'monday' check (week_starts_on = 'monday'),
  default_event_minutes integer not null default 30 check (default_event_minutes between 5 and 1440),
  event_reminders_enabled boolean not null default true,
  task_due_reminders_enabled boolean not null default true,
  exercise_enabled boolean not null default true,
  writing_assistance_enabled boolean not null default true,
  display_density text not null default 'default' check (display_density in ('default', 'comfortable', 'compact')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_user_id_key unique (user_id)
);

create unique index if not exists exercise_stickers_default_icon_key
  on public.exercise_stickers (icon_key) where user_id is null;
create unique index if not exists exercise_stickers_user_label_key
  on public.exercise_stickers (user_id, label) where user_id is not null;
create index if not exists exercise_stickers_user_order_idx
  on public.exercise_stickers (user_id, display_order, created_at);
create index if not exists exercise_logs_user_date_idx
  on public.exercise_logs (user_id, exercise_date desc);
create index if not exists exercise_logs_sticker_id_idx
  on public.exercise_logs (sticker_id);
create index if not exists user_settings_user_id_idx
  on public.user_settings (user_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'exercise_stickers_set_updated_at') then
    create trigger exercise_stickers_set_updated_at before update on public.exercise_stickers
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'exercise_logs_set_updated_at') then
    create trigger exercise_logs_set_updated_at before update on public.exercise_logs
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'user_settings_set_updated_at') then
    create trigger user_settings_set_updated_at before update on public.user_settings
    for each row execute function public.set_updated_at();
  end if;
end
$$;

insert into public.exercise_stickers (id, label, icon_key, color_key, display_order, is_default)
values
  ('10000000-0000-4000-8000-000000000001', '배드민턴', 'badminton', 'mint', 10, true),
  ('10000000-0000-4000-8000-000000000002', '배드민턴 레슨', 'badminton_lesson', 'pink', 20, true),
  ('10000000-0000-4000-8000-000000000003', '걷기', 'walking', 'yellow', 30, true),
  ('10000000-0000-4000-8000-000000000004', '러닝', 'running', 'coral', 40, true),
  ('10000000-0000-4000-8000-000000000005', '근력운동', 'strength', 'blue', 50, true),
  ('10000000-0000-4000-8000-000000000006', '스트레칭', 'stretching', 'lavender', 60, true),
  ('10000000-0000-4000-8000-000000000007', '자전거', 'cycling', 'sky', 70, true),
  ('10000000-0000-4000-8000-000000000008', '수영', 'swimming', 'aqua', 80, true),
  ('10000000-0000-4000-8000-000000000009', '기타', 'other', 'cream', 90, true)
on conflict (icon_key) where user_id is null do update
set label = excluded.label,
    color_key = excluded.color_key,
    display_order = excluded.display_order,
    is_default = true;

alter table public.exercise_stickers enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.user_settings enable row level security;

revoke all on table public.exercise_stickers, public.exercise_logs, public.user_settings from public, anon;
grant select, insert, update, delete on table public.exercise_stickers, public.exercise_logs, public.user_settings to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_stickers' and policyname = 'exercise_stickers_select_available') then
    create policy exercise_stickers_select_available on public.exercise_stickers
    for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_stickers' and policyname = 'exercise_stickers_insert_own') then
    create policy exercise_stickers_insert_own on public.exercise_stickers
    for insert to authenticated with check ((select auth.uid()) = user_id and not is_default);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_stickers' and policyname = 'exercise_stickers_update_own') then
    create policy exercise_stickers_update_own on public.exercise_stickers
    for update to authenticated
    using ((select auth.uid()) = user_id and not is_default)
    with check ((select auth.uid()) = user_id and not is_default);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_stickers' and policyname = 'exercise_stickers_delete_own') then
    create policy exercise_stickers_delete_own on public.exercise_stickers
    for delete to authenticated using ((select auth.uid()) = user_id and not is_default);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_logs' and policyname = 'exercise_logs_select_own') then
    create policy exercise_logs_select_own on public.exercise_logs
    for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_logs' and policyname = 'exercise_logs_insert_own') then
    create policy exercise_logs_insert_own on public.exercise_logs
    for insert to authenticated with check (
      (select auth.uid()) = user_id
      and exists (
        select 1 from public.exercise_stickers s
        where s.id = sticker_id and (s.user_id is null or s.user_id = (select auth.uid()))
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_logs' and policyname = 'exercise_logs_update_own') then
    create policy exercise_logs_update_own on public.exercise_logs
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check (
      (select auth.uid()) = user_id
      and exists (
        select 1 from public.exercise_stickers s
        where s.id = sticker_id and (s.user_id is null or s.user_id = (select auth.uid()))
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_logs' and policyname = 'exercise_logs_delete_own') then
    create policy exercise_logs_delete_own on public.exercise_logs
    for delete to authenticated using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_select_own') then
    create policy user_settings_select_own on public.user_settings
    for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_insert_own') then
    create policy user_settings_insert_own on public.user_settings
    for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_update_own') then
    create policy user_settings_update_own on public.user_settings
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_delete_own') then
    create policy user_settings_delete_own on public.user_settings
    for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end
$$;

commit;
