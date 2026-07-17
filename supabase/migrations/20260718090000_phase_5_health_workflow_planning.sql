begin;

alter table public.tasks
  add column if not exists description text,
  add column if not exists estimated_minutes integer;

alter table public.events
  add column if not exists description text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_estimated_minutes_check'
  ) then
    alter table public.tasks add constraint tasks_estimated_minutes_check
      check (estimated_minutes is null or estimated_minutes between 1 and 1440);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.events'::regclass
      and conname = 'events_user_id_id_key'
  ) then
    alter table public.events add constraint events_user_id_id_key unique (user_id, id);
  end if;
end;
$$;

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and name <> ''),
  item_kind text not null default 'task' check (item_kind in ('task', 'event')),
  category text not null default 'other' check (category in (
    'studentHealthScreening', 'additionalScreening', 'infectiousDisease',
    'firstAid', 'medication', 'officialDocument', 'training', 'event',
    'counseling', 'other'
  )),
  title text not null check (title = btrim(title) and title <> ''),
  description text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 1440),
  recommended_timing text,
  recurrence_frequency text check (recurrence_frequency is null or recurrence_frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_templates_user_id_id_key unique (user_id, id)
);

create table if not exists public.task_template_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null,
  title text not null check (title = btrim(title) and title <> ''),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_template_checklist_items_template_fk
    foreign key (user_id, template_id)
    references public.task_templates(user_id, id) on delete cascade,
  constraint task_template_checklist_items_position_key unique (user_id, template_id, position)
);

create table if not exists public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  title text not null check (title = btrim(title) and title <> ''),
  is_completed boolean not null default false,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_checklist_items_task_fk
    foreign key (user_id, task_id)
    references public.tasks(user_id, id) on delete cascade,
  constraint task_checklist_items_position_key unique (user_id, task_id, position)
);

create table if not exists public.task_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  title text not null check (title = btrim(title) and title <> ''),
  url text not null check (url ~ '^https?://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_links_task_fk
    foreign key (user_id, task_id)
    references public.tasks(user_id, id) on delete cascade
);

create table if not exists public.event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  title text not null check (title = btrim(title) and title <> ''),
  url text not null check (url ~ '^https?://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_links_event_fk
    foreign key (user_id, event_id)
    references public.events(user_id, id) on delete cascade
);

create table if not exists public.task_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  reference_type text not null default 'due' check (reference_type in ('scheduled', 'due')),
  offset_minutes integer not null check (offset_minutes between 0 and 525600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_reminders_task_fk
    foreign key (user_id, task_id)
    references public.tasks(user_id, id) on delete cascade,
  constraint task_reminders_setting_key unique (user_id, task_id, reference_type, offset_minutes)
);

create table if not exists public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  offset_minutes integer not null check (offset_minutes between 0 and 525600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_reminders_event_fk
    foreign key (user_id, event_id)
    references public.events(user_id, id) on delete cascade,
  constraint event_reminders_setting_key unique (user_id, event_id, offset_minutes)
);

create index if not exists task_templates_user_updated_idx on public.task_templates (user_id, updated_at desc);
create index if not exists task_template_items_user_template_idx on public.task_template_checklist_items (user_id, template_id, position);
create index if not exists task_checklist_user_task_idx on public.task_checklist_items (user_id, task_id, position);
create index if not exists task_links_user_task_idx on public.task_links (user_id, task_id);
create index if not exists event_links_user_event_idx on public.event_links (user_id, event_id);
create index if not exists task_reminders_user_task_idx on public.task_reminders (user_id, task_id);
create index if not exists event_reminders_user_event_idx on public.event_reminders (user_id, event_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'task_templates', 'task_template_checklist_items', 'task_checklist_items',
    'task_links', 'event_links', 'task_reminders', 'event_reminders'
  ] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('drop policy if exists %I_select_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_insert_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_update_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_delete_own on public.%I', table_name, table_name);
    execute format(
      'create policy %I_select_own on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
    execute format(
      'create policy %I_insert_own on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
    execute format(
      'create policy %I_update_own on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
    execute format(
      'create policy %I_delete_own on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
  end loop;
end;
$$;

commit;
