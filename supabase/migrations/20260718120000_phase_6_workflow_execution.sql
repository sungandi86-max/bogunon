begin;

create table public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and name <> ''),
  description text,
  category text not null default 'other' check (category in (
    'studentHealthScreening', 'additionalScreening', 'infectiousDisease',
    'firstAid', 'medication', 'officialDocument', 'training', 'event',
    'counseling', 'other'
  )),
  default_priority text not null default 'normal' check (default_priority in ('low', 'normal', 'high')),
  recommended_timing text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_templates_user_id_id_key unique (user_id, id)
);

create table public.workflow_template_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null,
  name text not null check (name = btrim(name) and name <> ''),
  description text,
  position integer not null check (position >= 0),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 1440),
  default_memo text,
  assignee_label text,
  completion_condition text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_template_steps_template_fk
    foreign key (user_id, template_id)
    references public.workflow_templates(user_id, id) on delete cascade,
  constraint workflow_template_steps_user_id_id_key unique (user_id, id),
  constraint workflow_template_steps_position_key unique (user_id, template_id, position)
);

create table public.workflow_template_step_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_step_id uuid not null,
  title text not null check (title = btrim(title) and title <> ''),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_template_step_checklist_items_step_fk
    foreign key (user_id, template_step_id)
    references public.workflow_template_steps(user_id, id) on delete cascade,
  constraint workflow_template_step_checklist_items_position_key
    unique (user_id, template_step_id, position)
);

create table public.workflow_template_step_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_step_id uuid not null,
  title text not null check (title = btrim(title) and title <> ''),
  url text not null check (url ~ '^https?://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_template_step_links_step_fk
    foreign key (user_id, template_step_id)
    references public.workflow_template_steps(user_id, id) on delete cascade
);

create table public.task_workflow_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  source_template_id uuid,
  name text not null check (name = btrim(name) and name <> ''),
  description text,
  category text not null default 'other' check (category in (
    'studentHealthScreening', 'additionalScreening', 'infectiousDisease',
    'firstAid', 'medication', 'officialDocument', 'training', 'event',
    'counseling', 'other'
  )),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  current_step_id uuid,
  started_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_workflow_instances_task_fk
    foreign key (user_id, task_id)
    references public.tasks(user_id, id) on delete cascade,
  constraint task_workflow_instances_template_fk
    foreign key (user_id, source_template_id)
    references public.workflow_templates(user_id, id)
    on delete set null (source_template_id),
  constraint task_workflow_instances_user_id_id_key unique (user_id, id),
  constraint task_workflow_instances_status_timestamps_check check (
    (status = 'active' and started_at is not null and paused_at is null and completed_at is null and cancelled_at is null)
    or (status = 'paused' and started_at is not null and paused_at is not null and completed_at is null and cancelled_at is null)
    or (status = 'completed' and started_at is not null and paused_at is null and completed_at is not null and cancelled_at is null)
    or (status = 'cancelled' and started_at is not null and paused_at is null and completed_at is null and cancelled_at is not null)
  )
);

create table public.task_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instance_id uuid not null,
  template_step_id uuid,
  name text not null check (name = btrim(name) and name <> ''),
  description text,
  position integer not null check (position >= 0),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 1440),
  memo text,
  internal_notes text,
  assignee_label text,
  completion_condition text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_workflow_steps_instance_fk
    foreign key (user_id, instance_id)
    references public.task_workflow_instances(user_id, id) on delete cascade,
  constraint task_workflow_steps_template_step_fk
    foreign key (user_id, template_step_id)
    references public.workflow_template_steps(user_id, id)
    on delete set null (template_step_id),
  constraint task_workflow_steps_user_id_id_key unique (user_id, id),
  constraint task_workflow_steps_instance_id_id_key unique (user_id, instance_id, id),
  constraint task_workflow_steps_position_key unique (user_id, instance_id, position),
  constraint task_workflow_steps_status_timestamps_check check (
    (status = 'pending' and started_at is null and completed_at is null)
    or (status in ('in_progress', 'blocked') and started_at is not null and completed_at is null)
    or (status in ('completed', 'skipped') and started_at is not null and completed_at is not null)
  )
);

alter table public.task_workflow_instances
  add constraint task_workflow_instances_current_step_fk
  foreign key (user_id, id, current_step_id)
  references public.task_workflow_steps(user_id, instance_id, id);

create table public.task_workflow_step_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workflow_step_id uuid not null,
  title text not null check (title = btrim(title) and title <> ''),
  is_completed boolean not null default false,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_workflow_step_checklist_items_step_fk
    foreign key (user_id, workflow_step_id)
    references public.task_workflow_steps(user_id, id) on delete cascade,
  constraint task_workflow_step_checklist_items_position_key
    unique (user_id, workflow_step_id, position)
);

create table public.workflow_step_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workflow_step_id uuid not null,
  title text not null check (title = btrim(title) and title <> ''),
  url text not null check (url ~ '^https?://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_step_links_step_fk
    foreign key (user_id, workflow_step_id)
    references public.task_workflow_steps(user_id, id) on delete cascade
);

create table public.workflow_timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instance_id uuid not null,
  workflow_step_id uuid,
  event_type text not null check (event_type = btrim(event_type) and event_type <> ''),
  message text not null check (message = btrim(message) and message <> ''),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_timeline_events_instance_fk
    foreign key (user_id, instance_id)
    references public.task_workflow_instances(user_id, id) on delete cascade,
  constraint workflow_timeline_events_step_fk
    foreign key (user_id, instance_id, workflow_step_id)
    references public.task_workflow_steps(user_id, instance_id, id)
    on delete cascade
);

create table public.workflow_followup_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid,
  instance_id uuid,
  trigger_type text not null check (trigger_type in ('step_completed', 'workflow_completed')),
  trigger_step_position integer,
  title text not null check (title = btrim(title) and title <> ''),
  description text,
  category text not null default 'other' check (category in (
    'studentHealthScreening', 'additionalScreening', 'infectiousDisease',
    'firstAid', 'medication', 'officialDocument', 'training', 'event',
    'counseling', 'other'
  )),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  delay_days integer not null default 0 check (delay_days between 0 and 3650),
  include_checklist boolean not null default false,
  generated_task_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_followup_rules_template_fk
    foreign key (user_id, template_id)
    references public.workflow_templates(user_id, id) on delete cascade,
  constraint workflow_followup_rules_instance_fk
    foreign key (user_id, instance_id)
    references public.task_workflow_instances(user_id, id) on delete cascade,
  constraint workflow_followup_rules_generated_task_fk
    foreign key (user_id, generated_task_id)
    references public.tasks(user_id, id)
    on delete set null (generated_task_id),
  constraint workflow_followup_rules_parent_check check (
    (template_id is not null and instance_id is null and generated_task_id is null)
    or (template_id is null and instance_id is not null)
  ),
  constraint workflow_followup_rules_trigger_check check (
    (trigger_type = 'step_completed' and trigger_step_position is not null and trigger_step_position >= 0)
    or (trigger_type = 'workflow_completed' and trigger_step_position is null)
  )
);

create index workflow_templates_user_updated_idx
  on public.workflow_templates (user_id, updated_at desc);
create index workflow_template_steps_user_template_idx
  on public.workflow_template_steps (user_id, template_id, position);
create index workflow_template_checklist_user_step_idx
  on public.workflow_template_step_checklist_items (user_id, template_step_id, position);
create index workflow_template_links_user_step_idx
  on public.workflow_template_step_links (user_id, template_step_id);
create index task_workflow_instances_user_task_idx
  on public.task_workflow_instances (user_id, task_id, updated_at desc);
create unique index task_workflow_instances_user_task_key
  on public.task_workflow_instances (user_id, task_id);
create index task_workflow_instances_user_status_idx
  on public.task_workflow_instances (user_id, status, updated_at desc);
create index task_workflow_instances_user_template_idx
  on public.task_workflow_instances (user_id, source_template_id)
  where source_template_id is not null;
create index task_workflow_steps_user_instance_status_idx
  on public.task_workflow_steps (user_id, instance_id, status, position);
create index task_workflow_checklist_user_step_idx
  on public.task_workflow_step_checklist_items (user_id, workflow_step_id, position);
create index workflow_step_links_user_step_idx
  on public.workflow_step_links (user_id, workflow_step_id);
create index workflow_timeline_user_instance_idx
  on public.workflow_timeline_events (user_id, instance_id, created_at desc);
create index workflow_timeline_user_step_idx
  on public.workflow_timeline_events (user_id, workflow_step_id, created_at desc)
  where workflow_step_id is not null;
create index workflow_followups_user_template_idx
  on public.workflow_followup_rules (user_id, template_id)
  where template_id is not null;
create index workflow_followups_user_instance_trigger_idx
  on public.workflow_followup_rules (user_id, instance_id, trigger_type, trigger_step_position)
  where instance_id is not null;
create unique index workflow_followups_generated_task_key
  on public.workflow_followup_rules (user_id, generated_task_id)
  where generated_task_id is not null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'workflow_templates', 'workflow_template_steps',
    'workflow_template_step_checklist_items', 'workflow_template_step_links',
    'task_workflow_instances', 'task_workflow_steps',
    'task_workflow_step_checklist_items', 'workflow_step_links',
    'workflow_timeline_events', 'workflow_followup_rules'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
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

revoke insert, update, delete on table public.task_workflow_instances from authenticated;
revoke insert, update, delete on table public.task_workflow_steps from authenticated;

create or replace function public.save_workflow_template_bundle(
  p_template_id uuid default null,
  p_values jsonb default '{}'::jsonb,
  p_steps jsonb default '[]'::jsonb,
  p_followups jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_template_id uuid;
  v_template_step_id uuid;
  step_record record;
  item_record record;
begin
  if v_owner_id is null then raise exception 'authentication required'; end if;
  if jsonb_typeof(p_values) <> 'object' then raise exception 'values must be an object'; end if;
  if jsonb_typeof(p_steps) <> 'array' or jsonb_array_length(p_steps) = 0 then
    raise exception 'steps must be a non-empty array';
  end if;
  if jsonb_typeof(p_followups) <> 'array' then raise exception 'followups must be an array'; end if;

  if p_template_id is null then
    insert into public.workflow_templates (
      user_id, name, description, category, default_priority, recommended_timing
    ) values (
      v_owner_id,
      p_values->>'name',
      nullif(btrim(p_values->>'description'), ''),
      coalesce(p_values->>'category', 'other'),
      coalesce(p_values->>'default_priority', p_values->>'defaultPriority', 'normal'),
      nullif(btrim(coalesce(p_values->>'recommended_timing', p_values->>'recommendedTiming')), '')
    ) returning id into v_template_id;
  else
    select workflow_templates.id into v_template_id
    from public.workflow_templates
    where workflow_templates.id = p_template_id
      and workflow_templates.user_id = v_owner_id
    for update;
    if not found then raise exception 'workflow template not found'; end if;

    update public.workflow_templates set
      name = p_values->>'name',
      description = nullif(btrim(p_values->>'description'), ''),
      category = coalesce(p_values->>'category', 'other'),
      default_priority = coalesce(p_values->>'default_priority', p_values->>'defaultPriority', 'normal'),
      recommended_timing = nullif(btrim(coalesce(p_values->>'recommended_timing', p_values->>'recommendedTiming')), '')
    where workflow_templates.id = v_template_id
      and workflow_templates.user_id = v_owner_id;

    delete from public.workflow_template_steps
    where workflow_template_steps.user_id = v_owner_id
      and workflow_template_steps.template_id = v_template_id;
    delete from public.workflow_followup_rules
    where workflow_followup_rules.user_id = v_owner_id
      and workflow_followup_rules.template_id = v_template_id;
  end if;

  for step_record in
    select value, ordinality
    from jsonb_array_elements(p_steps) with ordinality
  loop
    if jsonb_typeof(step_record.value) <> 'object' then raise exception 'each step must be an object'; end if;
    if jsonb_typeof(coalesce(step_record.value->'checklist', '[]'::jsonb)) <> 'array'
      or jsonb_typeof(coalesce(step_record.value->'links', '[]'::jsonb)) <> 'array' then
      raise exception 'step checklist and links must be arrays';
    end if;

    insert into public.workflow_template_steps (
      user_id, template_id, name, description, position, estimated_minutes,
      default_memo, assignee_label, completion_condition
    ) values (
      v_owner_id,
      v_template_id,
      step_record.value->>'name',
      nullif(btrim(step_record.value->>'description'), ''),
      step_record.ordinality - 1,
      nullif(coalesce(step_record.value->>'estimated_minutes', step_record.value->>'estimatedMinutes'), '')::integer,
      nullif(btrim(coalesce(step_record.value->>'default_memo', step_record.value->>'defaultMemo')), ''),
      nullif(btrim(coalesce(step_record.value->>'assignee_label', step_record.value->>'assigneeLabel')), ''),
      nullif(btrim(coalesce(step_record.value->>'completion_condition', step_record.value->>'completionCondition')), '')
    ) returning id into v_template_step_id;

    insert into public.workflow_template_step_checklist_items (
      user_id, template_step_id, title, position
    )
    select
      v_owner_id,
      v_template_step_id,
      case when jsonb_typeof(value) = 'string' then value #>> '{}' else value->>'title' end,
      ordinality - 1
    from jsonb_array_elements(coalesce(step_record.value->'checklist', '[]'::jsonb)) with ordinality;

    for item_record in
      select value
      from jsonb_array_elements(coalesce(step_record.value->'links', '[]'::jsonb))
    loop
      insert into public.workflow_template_step_links (user_id, template_step_id, title, url)
      values (v_owner_id, v_template_step_id, item_record.value->>'title', item_record.value->>'url');
    end loop;
  end loop;

  for item_record in select value from jsonb_array_elements(p_followups)
  loop
    if jsonb_typeof(item_record.value) <> 'object' then raise exception 'each followup must be an object'; end if;
    insert into public.workflow_followup_rules (
      user_id, template_id, trigger_type, trigger_step_position, title, description,
      category, priority, delay_days, include_checklist
    ) values (
      v_owner_id,
      v_template_id,
      coalesce(item_record.value->>'trigger_type', item_record.value->>'triggerType'),
      nullif(coalesce(item_record.value->>'trigger_step_position', item_record.value->>'triggerStepPosition'), '')::integer,
      item_record.value->>'title',
      nullif(btrim(item_record.value->>'description'), ''),
      coalesce(item_record.value->>'category', 'other'),
      coalesce(item_record.value->>'priority', 'normal'),
      coalesce(nullif(coalesce(item_record.value->>'delay_days', item_record.value->>'delayDays'), '')::integer, 0),
      coalesce(nullif(coalesce(item_record.value->>'include_checklist', item_record.value->>'includeChecklist'), '')::boolean, false)
    );
  end loop;

  return v_template_id;
end;
$$;

create or replace function public.create_workflow_instance_bundle(
  p_task_id uuid,
  p_template_id uuid default null,
  p_values jsonb default '{}'::jsonb,
  p_steps jsonb default '[]'::jsonb,
  p_followups jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_instance_id uuid;
  v_workflow_step_id uuid;
  v_first_step_id uuid;
  step_record record;
  item_record record;
  v_task_record public.tasks%rowtype;
  v_template_record public.workflow_templates%rowtype;
begin
  if v_owner_id is null then raise exception 'authentication required'; end if;
  if jsonb_typeof(p_values) <> 'object' then raise exception 'values must be an object'; end if;
  if jsonb_typeof(p_steps) <> 'array' or jsonb_typeof(p_followups) <> 'array' then
    raise exception 'steps and followups must be arrays';
  end if;

  select * into v_task_record
  from public.tasks
  where tasks.id = p_task_id and tasks.user_id = v_owner_id
  for update;
  if not found then raise exception 'task not found'; end if;

  if p_template_id is not null then
    select * into v_template_record
    from public.workflow_templates
    where workflow_templates.id = p_template_id
      and workflow_templates.user_id = v_owner_id
    for update;
    if not found then raise exception 'workflow template not found'; end if;
  end if;

  if jsonb_array_length(p_steps) = 0 and p_template_id is null then
    raise exception 'steps must be a non-empty array when no template is provided';
  end if;

  insert into public.task_workflow_instances (
    user_id, task_id, source_template_id, name, description, category, priority,
    status, started_at
  ) values (
    v_owner_id,
    p_task_id,
    p_template_id,
    coalesce(p_values->>'name', v_template_record.name, v_task_record.title),
    coalesce(nullif(btrim(p_values->>'description'), ''), v_template_record.description),
    coalesce(p_values->>'category', v_template_record.category, v_task_record.category),
    coalesce(p_values->>'priority', v_template_record.default_priority, v_task_record.priority),
    'active',
    now()
  ) returning id into v_instance_id;

  if jsonb_array_length(p_steps) > 0 then
    for step_record in
      select value, ordinality
      from jsonb_array_elements(p_steps) with ordinality
    loop
      if jsonb_typeof(step_record.value) <> 'object' then raise exception 'each step must be an object'; end if;
      if jsonb_typeof(coalesce(step_record.value->'checklist', '[]'::jsonb)) <> 'array'
        or jsonb_typeof(coalesce(step_record.value->'links', '[]'::jsonb)) <> 'array' then
        raise exception 'step checklist and links must be arrays';
      end if;

      insert into public.task_workflow_steps (
        user_id, instance_id, template_step_id, name, description, position, status,
        estimated_minutes, memo, internal_notes, assignee_label, completion_condition
      ) values (
        v_owner_id,
        v_instance_id,
        nullif(coalesce(step_record.value->>'template_step_id', step_record.value->>'templateStepId'), '')::uuid,
        step_record.value->>'name',
        nullif(btrim(step_record.value->>'description'), ''),
        step_record.ordinality - 1,
        'pending',
        nullif(coalesce(step_record.value->>'estimated_minutes', step_record.value->>'estimatedMinutes'), '')::integer,
        nullif(btrim(coalesce(step_record.value->>'memo', step_record.value->>'default_memo', step_record.value->>'defaultMemo')), ''),
        nullif(btrim(coalesce(step_record.value->>'internal_notes', step_record.value->>'internalNotes')), ''),
        nullif(btrim(coalesce(step_record.value->>'assignee_label', step_record.value->>'assigneeLabel')), ''),
        nullif(btrim(coalesce(step_record.value->>'completion_condition', step_record.value->>'completionCondition')), '')
      ) returning id into v_workflow_step_id;

      if v_first_step_id is null then v_first_step_id := v_workflow_step_id; end if;

      insert into public.task_workflow_step_checklist_items (
        user_id, workflow_step_id, title, is_completed, position
      )
      select
        v_owner_id,
        v_workflow_step_id,
        case when jsonb_typeof(value) = 'string' then value #>> '{}' else value->>'title' end,
        case when jsonb_typeof(value) = 'object'
          then coalesce(nullif(coalesce(value->>'is_completed', value->>'isCompleted'), '')::boolean, false)
          else false
        end,
        ordinality - 1
      from jsonb_array_elements(coalesce(step_record.value->'checklist', '[]'::jsonb)) with ordinality;

      insert into public.workflow_step_links (user_id, workflow_step_id, title, url)
      select v_owner_id, v_workflow_step_id, value->>'title', value->>'url'
      from jsonb_array_elements(coalesce(step_record.value->'links', '[]'::jsonb));
    end loop;
  else
    for step_record in
      select *
      from public.workflow_template_steps
      where workflow_template_steps.user_id = v_owner_id
        and workflow_template_steps.template_id = p_template_id
      order by position
    loop
      insert into public.task_workflow_steps (
        user_id, instance_id, template_step_id, name, description, position, status,
        estimated_minutes, memo, assignee_label, completion_condition
      ) values (
        v_owner_id, v_instance_id, step_record.id, step_record.name, step_record.description,
        step_record.position, 'pending', step_record.estimated_minutes, step_record.default_memo,
        step_record.assignee_label, step_record.completion_condition
      ) returning id into v_workflow_step_id;

      if v_first_step_id is null then v_first_step_id := v_workflow_step_id; end if;

      insert into public.task_workflow_step_checklist_items (
        user_id, workflow_step_id, title, position
      )
      select v_owner_id, v_workflow_step_id, title, position
      from public.workflow_template_step_checklist_items
      where workflow_template_step_checklist_items.user_id = v_owner_id
        and workflow_template_step_checklist_items.template_step_id = step_record.id
      order by position;

      insert into public.workflow_step_links (user_id, workflow_step_id, title, url)
      select v_owner_id, v_workflow_step_id, title, url
      from public.workflow_template_step_links
      where workflow_template_step_links.user_id = v_owner_id
        and workflow_template_step_links.template_step_id = step_record.id;
    end loop;
  end if;

  if v_first_step_id is null then raise exception 'workflow instance requires at least one step'; end if;

  update public.task_workflow_instances
  set current_step_id = v_first_step_id
  where task_workflow_instances.id = v_instance_id
    and task_workflow_instances.user_id = v_owner_id;

  if jsonb_array_length(p_followups) > 0 then
    for item_record in select value from jsonb_array_elements(p_followups)
    loop
      if jsonb_typeof(item_record.value) <> 'object' then raise exception 'each followup must be an object'; end if;
      insert into public.workflow_followup_rules (
        user_id, instance_id, trigger_type, trigger_step_position, title, description,
        category, priority, delay_days, include_checklist
      ) values (
        v_owner_id,
        v_instance_id,
        coalesce(item_record.value->>'trigger_type', item_record.value->>'triggerType'),
        nullif(coalesce(item_record.value->>'trigger_step_position', item_record.value->>'triggerStepPosition'), '')::integer,
        item_record.value->>'title',
        nullif(btrim(item_record.value->>'description'), ''),
        coalesce(item_record.value->>'category', v_task_record.category),
        coalesce(item_record.value->>'priority', v_task_record.priority),
        coalesce(nullif(coalesce(item_record.value->>'delay_days', item_record.value->>'delayDays'), '')::integer, 0),
        coalesce(nullif(coalesce(item_record.value->>'include_checklist', item_record.value->>'includeChecklist'), '')::boolean, false)
      );
    end loop;
  elsif p_template_id is not null then
    insert into public.workflow_followup_rules (
      user_id, instance_id, trigger_type, trigger_step_position, title, description,
      category, priority, delay_days, include_checklist
    )
    select
      v_owner_id, v_instance_id, trigger_type, trigger_step_position, title, description,
      category, priority, delay_days, include_checklist
    from public.workflow_followup_rules
    where workflow_followup_rules.user_id = v_owner_id
      and workflow_followup_rules.template_id = p_template_id;
  end if;

  insert into public.workflow_timeline_events (
    user_id, instance_id, event_type, message, metadata
  ) values (
    v_owner_id, v_instance_id, 'workflow_created', 'Workflow created',
    jsonb_build_object('task_id', p_task_id, 'template_id', p_template_id)
  );

  return v_instance_id;
end;
$$;

create or replace function public.update_workflow_step_bundle(
  p_step_id uuid,
  p_values jsonb,
  p_checklist jsonb,
  p_links jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_instance_id uuid;
begin
  if v_owner_id is null then raise exception 'authentication required'; end if;
  if jsonb_typeof(p_values) <> 'object' then raise exception 'values must be an object'; end if;
  if jsonb_typeof(p_checklist) <> 'array' or jsonb_typeof(p_links) <> 'array' then
    raise exception 'checklist and links must be arrays';
  end if;

  select task_workflow_steps.instance_id into v_instance_id
  from public.task_workflow_steps
  where task_workflow_steps.id = p_step_id
    and task_workflow_steps.user_id = v_owner_id
  for update;
  if not found then raise exception 'workflow step not found'; end if;

  update public.task_workflow_steps set
    name = case when p_values ? 'name' then p_values->>'name' else name end,
    description = case when p_values ? 'description' then nullif(btrim(p_values->>'description'), '') else description end,
    estimated_minutes = case
      when p_values ? 'estimated_minutes' or p_values ? 'estimatedMinutes'
        then nullif(coalesce(p_values->>'estimated_minutes', p_values->>'estimatedMinutes'), '')::integer
      else estimated_minutes
    end,
    memo = case when p_values ? 'memo' then nullif(btrim(p_values->>'memo'), '') else memo end,
    internal_notes = case
      when p_values ? 'internal_notes' or p_values ? 'internalNotes'
        then nullif(btrim(coalesce(p_values->>'internal_notes', p_values->>'internalNotes')), '')
      else internal_notes
    end,
    assignee_label = case
      when p_values ? 'assignee_label' or p_values ? 'assigneeLabel'
        then nullif(btrim(coalesce(p_values->>'assignee_label', p_values->>'assigneeLabel')), '')
      else assignee_label
    end,
    completion_condition = case
      when p_values ? 'completion_condition' or p_values ? 'completionCondition'
        then nullif(btrim(coalesce(p_values->>'completion_condition', p_values->>'completionCondition')), '')
      else completion_condition
    end
  where task_workflow_steps.id = p_step_id
    and task_workflow_steps.user_id = v_owner_id;

  delete from public.task_workflow_step_checklist_items
  where task_workflow_step_checklist_items.user_id = v_owner_id
    and task_workflow_step_checklist_items.workflow_step_id = p_step_id;
  delete from public.workflow_step_links
  where workflow_step_links.user_id = v_owner_id
    and workflow_step_links.workflow_step_id = p_step_id;

  insert into public.task_workflow_step_checklist_items (
    user_id, workflow_step_id, title, is_completed, position
  )
  select
    v_owner_id,
    p_step_id,
    case when jsonb_typeof(value) = 'string' then value #>> '{}' else value->>'title' end,
    case when jsonb_typeof(value) = 'object'
      then coalesce(nullif(coalesce(value->>'is_completed', value->>'isCompleted'), '')::boolean, false)
      else false
    end,
    ordinality - 1
  from jsonb_array_elements(p_checklist) with ordinality;

  insert into public.workflow_step_links (user_id, workflow_step_id, title, url)
  select v_owner_id, p_step_id, value->>'title', value->>'url'
  from jsonb_array_elements(p_links);

  insert into public.workflow_timeline_events (
    user_id, instance_id, workflow_step_id, event_type, message, metadata
  ) values (
    v_owner_id, v_instance_id, p_step_id, 'step_updated', 'Workflow step updated', '{}'::jsonb
  );

  return p_step_id;
end;
$$;

create or replace function public.transition_workflow_step(
  p_step_id uuid,
  p_target_status text,
  p_force boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_step_record public.task_workflow_steps%rowtype;
  v_instance_record public.task_workflow_instances%rowtype;
  v_next_step_id uuid;
  v_followup_record record;
  v_generated_task_id uuid;
begin
  if v_owner_id is null then raise exception 'authentication required'; end if;
  if p_target_status not in ('pending', 'in_progress', 'completed', 'skipped', 'blocked') then
    raise exception 'invalid workflow step status';
  end if;

  select * into v_step_record
  from public.task_workflow_steps
  where task_workflow_steps.id = p_step_id
    and task_workflow_steps.user_id = v_owner_id
  for update;
  if not found then raise exception 'workflow step not found'; end if;

  select * into v_instance_record
  from public.task_workflow_instances
  where task_workflow_instances.id = v_step_record.instance_id
    and task_workflow_instances.user_id = v_owner_id
  for update;
  if v_instance_record.status <> 'active' then raise exception 'workflow instance is not active'; end if;

  if v_step_record.status = p_target_status then return p_step_id; end if;

  if not (
    (v_step_record.status = 'pending' and p_target_status in ('in_progress', 'skipped', 'blocked'))
    or (v_step_record.status = 'in_progress' and p_target_status in ('completed', 'skipped', 'blocked', 'pending'))
    or (v_step_record.status = 'completed' and p_target_status = 'in_progress')
    or (v_step_record.status = 'skipped' and p_target_status = 'in_progress')
    or (v_step_record.status = 'blocked' and p_target_status in ('in_progress', 'skipped', 'pending'))
  ) then
    raise exception 'invalid workflow step transition from % to %', v_step_record.status, p_target_status;
  end if;

  if p_target_status = 'completed' and not p_force and exists (
    select 1
    from public.task_workflow_step_checklist_items
    where task_workflow_step_checklist_items.user_id = v_owner_id
      and task_workflow_step_checklist_items.workflow_step_id = p_step_id
      and not task_workflow_step_checklist_items.is_completed
  ) then
    raise exception 'workflow step checklist is incomplete';
  end if;

  if p_target_status = 'completed' and not p_force and exists (
    select 1
    from public.task_workflow_steps
    where user_id = v_owner_id
      and instance_id = v_step_record.instance_id
      and position < v_step_record.position
      and status not in ('completed', 'skipped')
  ) then
    raise exception 'previous workflow steps are incomplete';
  end if;

  update public.task_workflow_steps set
    status = p_target_status,
    started_at = case
      when p_target_status = 'pending' then null
      else coalesce(started_at, now())
    end,
    completed_at = case
      when p_target_status in ('completed', 'skipped') then now()
      else null
    end
  where task_workflow_steps.id = p_step_id
    and task_workflow_steps.user_id = v_owner_id;

  if p_target_status in ('in_progress', 'blocked') then
    v_next_step_id := p_step_id;
  else
    select task_workflow_steps.id into v_next_step_id
    from public.task_workflow_steps
    where task_workflow_steps.user_id = v_owner_id
      and task_workflow_steps.instance_id = v_step_record.instance_id
      and task_workflow_steps.id <> p_step_id
      and task_workflow_steps.status in ('in_progress', 'blocked', 'pending')
    order by
      case task_workflow_steps.status when 'in_progress' then 0 when 'blocked' then 1 else 2 end,
      task_workflow_steps.position
    limit 1;
  end if;

  update public.task_workflow_instances
  set current_step_id = v_next_step_id
  where task_workflow_instances.id = v_step_record.instance_id
    and task_workflow_instances.user_id = v_owner_id;

  insert into public.workflow_timeline_events (
    user_id, instance_id, workflow_step_id, event_type, message, metadata
  ) values (
    v_owner_id,
    v_step_record.instance_id,
    p_step_id,
    'step_transitioned',
    'Workflow step transitioned',
    jsonb_build_object('from_status', v_step_record.status, 'to_status', p_target_status, 'forced', p_force)
  );

  if p_target_status = 'completed' then
    for v_followup_record in
      select *
      from public.workflow_followup_rules
      where workflow_followup_rules.user_id = v_owner_id
        and workflow_followup_rules.instance_id = v_step_record.instance_id
        and workflow_followup_rules.trigger_type = 'step_completed'
        and workflow_followup_rules.trigger_step_position = v_step_record.position
        and workflow_followup_rules.generated_task_id is null
      order by workflow_followup_rules.id
      for update
    loop
      insert into public.tasks (
        user_id, title, area, status, priority, category, scheduled_date, due_date, description
      ) values (
        v_owner_id,
        v_followup_record.title,
        'healthWork',
        'planned',
        v_followup_record.priority,
        v_followup_record.category,
        current_date + v_followup_record.delay_days,
        current_date + v_followup_record.delay_days,
        v_followup_record.description
      ) returning id into v_generated_task_id;

      if v_followup_record.include_checklist then
        insert into public.task_checklist_items (user_id, task_id, title, is_completed, position)
        select v_owner_id, v_generated_task_id,
          task_workflow_step_checklist_items.title, false,
          task_workflow_step_checklist_items.position
        from public.task_workflow_step_checklist_items
        where task_workflow_step_checklist_items.user_id = v_owner_id
          and task_workflow_step_checklist_items.workflow_step_id = p_step_id
        order by task_workflow_step_checklist_items.position;
      end if;

      update public.workflow_followup_rules
      set generated_task_id = v_generated_task_id
      where workflow_followup_rules.id = v_followup_record.id
        and workflow_followup_rules.user_id = v_owner_id;

      insert into public.workflow_timeline_events (
        user_id, instance_id, workflow_step_id, event_type, message, metadata
      ) values (
        v_owner_id,
        v_step_record.instance_id,
        p_step_id,
        'followup_created',
        'Follow-up task created',
        jsonb_build_object('followup_rule_id', v_followup_record.id, 'task_id', v_generated_task_id)
      );
    end loop;
  end if;

  return p_step_id;
end;
$$;

create or replace function public.transition_workflow_instance(
  p_instance_id uuid,
  p_target_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_instance_record public.task_workflow_instances%rowtype;
  v_next_step_id uuid;
  v_followup_record record;
  v_generated_task_id uuid;
begin
  if v_owner_id is null then raise exception 'authentication required'; end if;
  if p_target_status not in ('active', 'paused', 'completed', 'cancelled') then
    raise exception 'invalid workflow instance status';
  end if;

  select * into v_instance_record
  from public.task_workflow_instances
  where task_workflow_instances.id = p_instance_id
    and task_workflow_instances.user_id = v_owner_id
  for update;
  if not found then raise exception 'workflow instance not found'; end if;

  if v_instance_record.status = p_target_status then return p_instance_id; end if;

  if not (
    (v_instance_record.status = 'active' and p_target_status in ('paused', 'completed', 'cancelled'))
    or (v_instance_record.status = 'paused' and p_target_status in ('active', 'cancelled'))
  ) then
    raise exception 'invalid workflow instance transition from % to %', v_instance_record.status, p_target_status;
  end if;

  if p_target_status = 'completed' and exists (
    select 1
    from public.task_workflow_steps
    where task_workflow_steps.user_id = v_owner_id
      and task_workflow_steps.instance_id = p_instance_id
      and task_workflow_steps.status not in ('completed', 'skipped')
  ) then
    raise exception 'workflow instance has incomplete steps';
  end if;

  if p_target_status = 'active' then
    select task_workflow_steps.id into v_next_step_id
    from public.task_workflow_steps
    where task_workflow_steps.user_id = v_owner_id
      and task_workflow_steps.instance_id = p_instance_id
      and task_workflow_steps.status in ('in_progress', 'blocked', 'pending')
    order by
      case task_workflow_steps.status when 'in_progress' then 0 when 'blocked' then 1 else 2 end,
      task_workflow_steps.position
    limit 1;
  end if;

  update public.task_workflow_instances set
    status = p_target_status,
    current_step_id = case
      when p_target_status = 'active' then v_next_step_id
      when p_target_status in ('completed', 'cancelled') then null
      else current_step_id
    end,
    paused_at = case when p_target_status = 'paused' then now() else null end,
    completed_at = case when p_target_status = 'completed' then now() else null end,
    cancelled_at = case when p_target_status = 'cancelled' then now() else null end
  where task_workflow_instances.id = p_instance_id
    and task_workflow_instances.user_id = v_owner_id;

  if p_target_status = 'completed' then
    update public.tasks
    set status = 'completed', completed_at = now()
    where tasks.id = v_instance_record.task_id
      and tasks.user_id = v_owner_id;
  end if;

  insert into public.workflow_timeline_events (
    user_id, instance_id, event_type, message, metadata
  ) values (
    v_owner_id,
    p_instance_id,
    'workflow_transitioned',
    'Workflow transitioned',
    jsonb_build_object('from_status', v_instance_record.status, 'to_status', p_target_status)
  );

  if p_target_status = 'completed' then
    for v_followup_record in
      select *
      from public.workflow_followup_rules
      where workflow_followup_rules.user_id = v_owner_id
        and workflow_followup_rules.instance_id = p_instance_id
        and workflow_followup_rules.trigger_type = 'workflow_completed'
        and workflow_followup_rules.generated_task_id is null
      order by workflow_followup_rules.id
      for update
    loop
      insert into public.tasks (
        user_id, title, area, status, priority, category, scheduled_date, due_date, description
      ) values (
        v_owner_id,
        v_followup_record.title,
        'healthWork',
        'planned',
        v_followup_record.priority,
        v_followup_record.category,
        current_date + v_followup_record.delay_days,
        current_date + v_followup_record.delay_days,
        v_followup_record.description
      ) returning id into v_generated_task_id;

      if v_followup_record.include_checklist then
        insert into public.task_checklist_items (user_id, task_id, title, is_completed, position)
        select
          v_owner_id,
          v_generated_task_id,
          task_workflow_step_checklist_items.title,
          false,
          row_number() over (
            order by task_workflow_steps.position, task_workflow_step_checklist_items.position
          )::integer - 1
        from public.task_workflow_step_checklist_items
        join public.task_workflow_steps
          on task_workflow_steps.user_id = task_workflow_step_checklist_items.user_id
          and task_workflow_steps.id = task_workflow_step_checklist_items.workflow_step_id
        where task_workflow_step_checklist_items.user_id = v_owner_id
          and task_workflow_steps.instance_id = p_instance_id;
      end if;

      update public.workflow_followup_rules
      set generated_task_id = v_generated_task_id
      where workflow_followup_rules.id = v_followup_record.id
        and workflow_followup_rules.user_id = v_owner_id;

      insert into public.workflow_timeline_events (
        user_id, instance_id, event_type, message, metadata
      ) values (
        v_owner_id,
        p_instance_id,
        'followup_created',
        'Follow-up task created',
        jsonb_build_object('followup_rule_id', v_followup_record.id, 'task_id', v_generated_task_id)
      );
    end loop;
  end if;

  return p_instance_id;
end;
$$;

create or replace function public.complete_workflow_instance(p_instance_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.transition_workflow_instance(p_instance_id, 'completed');
end;
$$;

revoke all on function public.save_workflow_template_bundle(uuid, jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.create_workflow_instance_bundle(uuid, uuid, jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.update_workflow_step_bundle(uuid, jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.transition_workflow_step(uuid, text, boolean) from public, anon;
revoke all on function public.transition_workflow_instance(uuid, text) from public, anon;
revoke all on function public.complete_workflow_instance(uuid) from public, anon;

grant execute on function public.save_workflow_template_bundle(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.create_workflow_instance_bundle(uuid, uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.update_workflow_step_bundle(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.transition_workflow_step(uuid, text, boolean) to authenticated;
grant execute on function public.transition_workflow_instance(uuid, text) to authenticated;
grant execute on function public.complete_workflow_instance(uuid) to authenticated;

commit;
