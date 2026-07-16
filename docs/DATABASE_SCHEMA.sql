-- 보건온 초기 Supabase PostgreSQL Migration
-- PostgreSQL / Supabase Auth 기준

begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create or replace function public.valid_text_tags(value text[])
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select
    value is null
    or (
      cardinality(value) > 0
      and not exists (
        select 1
        from unnest(value) as tag
        where tag is null or btrim(tag) = '' or tag <> btrim(tag)
      )
      and cardinality(value) = (
        select count(distinct tag)
        from unnest(value) as tag
      )
    );
$$;

revoke all on function public.valid_text_tags(text[]) from public;
grant execute on function public.valid_text_tags(text[]) to authenticated;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (btrim(title) <> '' and title = btrim(title)),
  area text not null check (
    area in ('healthWork', 'schoolSchedule', 'exercise', 'personal', 'project')
  ),
  start_date date not null,
  end_date date not null,
  is_all_day boolean not null default false,
  start_time time without time zone,
  end_time time without time zone,
  memo text check (memo is null or (btrim(memo) <> '' and memo = btrim(memo))),
  related_url text check (
    related_url is null
    or related_url ~ '^https?://'
  ),
  exercise_type text check (
    exercise_type is null or (btrim(exercise_type) <> '' and exercise_type = btrim(exercise_type))
  ),
  exercise_location text check (
    exercise_location is null or (btrim(exercise_location) <> '' and exercise_location = btrim(exercise_location))
  ),
  exercise_goal text check (
    exercise_goal is null or (btrim(exercise_goal) <> '' and exercise_goal = btrim(exercise_goal))
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_user_id_id_key unique (user_id, id),
  constraint events_date_order_check check (end_date >= start_date),
  constraint events_time_check check (
    (is_all_day and start_time is null and end_time is null)
    or (
      not is_all_day
      and (end_time is null or start_time is not null)
      and (
        end_time is null
        or end_date > start_date
        or end_time > start_time
      )
    )
  ),
  constraint events_exercise_fields_check check (
    area = 'exercise'
    or (
      exercise_type is null
      and exercise_location is null
      and exercise_goal is null
    )
  )
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> '' and name = btrim(name)),
  description text check (
    description is null or (btrim(description) <> '' and description = btrim(description))
  ),
  progress integer not null default 0 check (progress between 0 and 100),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  attachments jsonb check (
    attachments is null
    or (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) = 0)
  ),
  due_date date,
  related_url text check (related_url is null or related_url ~ '^https?://'),
  next_action_type text check (next_action_type is null or next_action_type in ('linkedTask', 'text')),
  next_action_task_id uuid,
  next_action_text text check (
    next_action_text is null
    or (btrim(next_action_text) <> '' and next_action_text = btrim(next_action_text))
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_user_id_id_key unique (user_id, id),
  constraint projects_next_action_shape_check check (
    (next_action_type is null and next_action_task_id is null and next_action_text is null)
    or (next_action_type = 'linkedTask' and next_action_task_id is not null and next_action_text is null)
    or (next_action_type = 'text' and next_action_task_id is null and next_action_text is not null)
  )
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (btrim(title) <> '' and title = btrim(title)),
  area text not null check (
    area in ('healthWork', 'schoolSchedule', 'exercise', 'personal', 'project')
  ),
  status text not null default 'planned' check (
    status in ('planned', 'inProgress', 'waitingForReply', 'needsCheck', 'completed', 'onHold')
  ),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  tags text[] check (public.valid_text_tags(tags)),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  attachments jsonb check (
    attachments is null
    or (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) = 0)
  ),
  scheduled_date date,
  due_date date,
  follow_up_date date,
  work_stage text check (
    work_stage is null or (btrim(work_stage) <> '' and work_stage = btrim(work_stage))
  ),
  target_group text check (
    target_group is null or (btrim(target_group) <> '' and target_group = btrim(target_group))
  ),
  related_url text check (related_url is null or related_url ~ '^https?://'),
  memo text check (memo is null or (btrim(memo) <> '' and memo = btrim(memo))),
  linked_event_id uuid,
  linked_project_id uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_user_id_id_key unique (user_id, id),
  constraint tasks_linked_event_fk foreign key (user_id, linked_event_id)
    references public.events(user_id, id) on delete set null (linked_event_id),
  constraint tasks_linked_project_fk foreign key (user_id, linked_project_id)
    references public.projects(user_id, id) on delete set null (linked_project_id),
  constraint tasks_completed_at_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

alter table public.projects
  add constraint projects_next_action_task_fk
  foreign key (user_id, next_action_task_id)
  references public.tasks(user_id, id);

create or replace function public.clear_deleted_task_references()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.projects
  set
    next_action_type = null,
    next_action_task_id = null,
    next_action_text = null
  where user_id = old.user_id
    and next_action_type = 'linkedTask'
    and next_action_task_id = old.id;

  return old;
end;
$$;

revoke all on function public.clear_deleted_task_references() from public;

create trigger tasks_clear_project_next_action
before delete on public.tasks
for each row execute function public.clear_deleted_task_references();

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  content text not null check (btrim(content) <> '' and content = btrim(content)),
  is_completed boolean not null default false,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_items_user_id_id_key unique (user_id, id),
  constraint checklist_items_task_fk foreign key (user_id, task_id)
    references public.tasks(user_id, id) on delete cascade,
  constraint checklist_items_order_key unique (user_id, task_id, sort_order)
);

create table public.daily_focus_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  task_id uuid not null,
  sort_order integer not null check (sort_order between 0 and 2),
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_focus_user_id_id_key unique (user_id, id),
  constraint daily_focus_task_fk foreign key (user_id, task_id)
    references public.tasks(user_id, id) on delete cascade,
  constraint daily_focus_task_per_date_key unique (user_id, date, task_id),
  constraint daily_focus_order_per_date_key unique (user_id, date, sort_order)
);

create table public.repeat_task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (btrim(title) <> '' and title = btrim(title)),
  area text not null default 'healthWork' check (area = 'healthWork'),
  expected_start_month integer check (expected_start_month between 1 and 12),
  expected_start_day integer check (expected_start_day between 1 and 31),
  due_month integer check (due_month between 1 and 12),
  due_day integer check (due_day between 1 and 31),
  target_group text check (
    target_group is null or (btrim(target_group) <> '' and target_group = btrim(target_group))
  ),
  related_url text check (related_url is null or related_url ~ '^https?://'),
  default_memo text check (
    default_memo is null or (btrim(default_memo) <> '' and default_memo = btrim(default_memo))
  ),
  work_stage text check (
    work_stage is null or (btrim(work_stage) <> '' and work_stage = btrim(work_stage))
  ),
  default_status text not null default 'planned' check (
    default_status in ('planned', 'inProgress', 'waitingForReply', 'needsCheck', 'completed', 'onHold')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repeat_templates_user_id_id_key unique (user_id, id),
  constraint repeat_templates_expected_date_pair_check check (
    (expected_start_month is null and expected_start_day is null)
    or (expected_start_month is not null and expected_start_day is not null)
  ),
  constraint repeat_templates_due_date_pair_check check (
    (due_month is null and due_day is null)
    or (due_month is not null and due_day is not null)
  ),
  constraint repeat_templates_expected_month_day_check check (
    expected_start_month is null
    or expected_start_day <= case
      when expected_start_month = 2 then 29
      when expected_start_month in (4, 6, 9, 11) then 30
      else 31
    end
  ),
  constraint repeat_templates_due_month_day_check check (
    due_month is null
    or due_day <= case
      when due_month = 2 then 29
      when due_month in (4, 6, 9, 11) then 30
      else 31
    end
  )
);

create table public.template_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null,
  content text not null check (btrim(content) <> '' and content = btrim(content)),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint template_checklist_user_id_id_key unique (user_id, id),
  constraint template_checklist_template_fk foreign key (user_id, template_id)
    references public.repeat_task_templates(user_id, id) on delete cascade,
  constraint template_checklist_order_key unique (user_id, template_id, sort_order)
);

create table public.exercise_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  is_completed boolean not null default false,
  actual_date date,
  intensity text check (intensity is null or intensity in ('low', 'medium', 'high')),
  condition text check (
    condition is null or condition in ('veryGood', 'good', 'neutral', 'bad', 'veryBad')
  ),
  memo text check (memo is null or (btrim(memo) <> '' and memo = btrim(memo))),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_records_user_id_id_key unique (user_id, id),
  constraint exercise_records_event_key unique (user_id, event_id),
  constraint exercise_records_event_fk foreign key (user_id, event_id)
    references public.events(user_id, id) on delete cascade
);

create table public.quick_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (btrim(content) <> '' and content = btrim(content)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quick_memos_user_id_id_key unique (user_id, id)
);

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timezone text not null default 'Asia/Seoul' check (timezone = 'Asia/Seoul'),
  week_starts_on text not null default 'monday' check (week_starts_on = 'monday'),
  has_seen_privacy_notice boolean not null default false,
  calendar_area_filters text[] not null default array[
    'healthWork', 'schoolSchedule', 'exercise', 'personal', 'project'
  ]::text[],
  workdays jsonb not null default jsonb_build_object(
    'monday', jsonb_build_object('isWorkday', true),
    'tuesday', jsonb_build_object('isWorkday', true),
    'wednesday', jsonb_build_object('isWorkday', true),
    'thursday', jsonb_build_object('isWorkday', true),
    'friday', jsonb_build_object('isWorkday', true),
    'saturday', jsonb_build_object('isWorkday', false),
    'sunday', jsonb_build_object('isWorkday', false)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_user_id_key unique (user_id),
  constraint user_settings_user_id_id_key unique (user_id, id),
  constraint user_settings_filters_check check (
    calendar_area_filters <@ array[
      'healthWork', 'schoolSchedule', 'exercise', 'personal', 'project'
    ]::text[]
    and public.valid_text_tags(calendar_area_filters)
  ),
  constraint user_settings_workdays_check check (
    jsonb_typeof(workdays) = 'object'
    and workdays ?& array[
      'monday', 'tuesday', 'wednesday', 'thursday',
      'friday', 'saturday', 'sunday'
    ]
  )
);

create table public.work_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  settings_id uuid not null,
  weekday text not null check (
    weekday in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
  ),
  label text not null check (btrim(label) <> '' and label = btrim(label)),
  start_time time without time zone not null,
  end_time time without time zone not null,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_periods_user_id_id_key unique (user_id, id),
  constraint work_periods_settings_fk foreign key (user_id, settings_id)
    references public.user_settings(user_id, id) on delete cascade,
  constraint work_periods_time_check check (end_time > start_time),
  constraint work_periods_order_key unique (user_id, weekday, sort_order),
  constraint work_periods_exact_time_key unique (user_id, weekday, start_time, end_time),
  constraint work_periods_no_overlap exclude using gist (
    user_id with =,
    weekday with =,
    int8range(
      extract(epoch from start_time)::bigint,
      extract(epoch from end_time)::bigint,
      '[)'
    ) with &&
  )
);

-- 브리핑, 캘린더, 후속 확인, 마감, 운동 조회 인덱스
create index events_user_start_date_idx on public.events (user_id, start_date);
create index events_user_date_range_idx on public.events (user_id, start_date, end_date);
create index events_user_start_time_idx on public.events (user_id, start_date, start_time);
create index events_user_area_date_idx on public.events (user_id, area, start_date);
create index events_user_exercise_date_idx on public.events (user_id, start_date)
  where area = 'exercise';

create index tasks_user_scheduled_date_idx on public.tasks (user_id, scheduled_date);
create index tasks_user_due_date_idx on public.tasks (user_id, due_date)
  where status not in ('completed', 'onHold');
create index tasks_user_follow_up_date_idx on public.tasks (user_id, follow_up_date)
  where status not in ('completed', 'onHold');
create index tasks_user_status_updated_idx on public.tasks (user_id, status, updated_at desc);
create index tasks_user_area_status_idx on public.tasks (user_id, area, status);
create index tasks_user_event_idx on public.tasks (user_id, linked_event_id)
  where linked_event_id is not null;
create index tasks_user_project_idx on public.tasks (user_id, linked_project_id)
  where linked_project_id is not null;

create index daily_focus_user_date_idx
  on public.daily_focus_assignments (user_id, date, sort_order);
create index checklist_items_user_task_idx
  on public.checklist_items (user_id, task_id, sort_order);
create index template_checklist_user_template_idx
  on public.template_checklist_items (user_id, template_id, sort_order);
create index exercise_records_user_actual_date_idx
  on public.exercise_records (user_id, actual_date desc);
create index projects_user_due_date_idx on public.projects (user_id, due_date);
create index quick_memos_user_created_idx on public.quick_memos (user_id, created_at desc);
create index work_periods_user_weekday_idx on public.work_periods (user_id, weekday, sort_order);

-- updated_at 자동 갱신
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'events', 'projects', 'tasks', 'checklist_items',
    'daily_focus_assignments', 'repeat_task_templates',
    'template_checklist_items', 'exercise_records', 'quick_memos',
    'user_settings', 'work_periods'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end;
$$;

-- Data API 권한과 RLS
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'events', 'projects', 'tasks', 'checklist_items',
    'daily_focus_assignments', 'repeat_task_templates',
    'template_checklist_items', 'exercise_records', 'quick_memos',
    'user_settings', 'work_periods'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
    execute format(
      'grant select, insert, update, delete on table public.%I to authenticated',
      table_name
    );

    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_select_own',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name || '_insert_own',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name || '_update_own',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_delete_own',
      table_name
    );
  end loop;
end;
$$;

commit;
