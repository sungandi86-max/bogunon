begin;

create temporary table qa_cleanup_owner (
  user_id uuid primary key
) on commit drop;

insert into qa_cleanup_owner (user_id)
values ('b61184fe-b423-416d-bea5-d5b5bece74e6');

do $$
begin
  if exists (select 1 from qa_cleanup_owner where user_id = '00000000-0000-0000-0000-000000000000') then
    raise exception 'Set qa_cleanup_owner.user_id from the preview before running cleanup';
  end if;
  if not exists (
    select 1 from auth.users u join qa_cleanup_owner o on o.user_id = u.id
  ) then
    raise exception 'The selected cleanup owner does not exist';
  end if;
end;
$$;

create temporary table qa_requested_targets (
  object_type text not null check (object_type in ('task', 'event', 'workflow_instance', 'task_template', 'workflow_template')),
  id uuid not null,
  primary key (object_type, id)
) on commit drop;

insert into qa_requested_targets (object_type, id)
values
  ('task', '268808c3-709d-494f-b9c9-9e1146bf060c'),
  ('task', '0f278633-d349-4f4a-9d46-ec8ea1b0102b'),
  ('task', 'b646387f-e269-42d2-8ca9-8c327e002302'),
  ('task', '3061638d-c709-4a39-ac8c-bdbe1965792c'),
  ('task', '437410c5-00a1-45b6-bd26-6fd1f7ed4ca0'),
  ('task', 'e03f397c-6bca-4225-8890-f6d9c84268f0'),
  ('task', '73872b48-28d2-48a7-9fe7-05040dc4dc52'),
  ('task', 'd4108691-d38c-4284-9f69-91b2c37bb8f3'),
  ('task_template', '271199a3-a870-456a-b847-65b652142252'),
  ('workflow_instance', '80482b03-6737-4f70-8d20-86bd765b8c41'),
  ('workflow_instance', 'c3f4176a-a59c-4367-ad84-bd71753795ff'),
  ('workflow_template', '18c7aa92-7731-49ce-b5d7-90bc2d9272dc');

insert into qa_requested_targets (object_type, id)
select 'task', task.id
from public.tasks task
join public.workflow_followup_rules rule
  on rule.user_id = task.user_id
 and rule.generated_task_id = task.id
where task.user_id = 'b61184fe-b423-416d-bea5-d5b5bece74e6'
  and task.title = '[QA-P6] Workflow 완료 후속 업무'
  and rule.instance_id = '80482b03-6737-4f70-8d20-86bd765b8c41';

create temporary table qa_task_targets (
  user_id uuid not null,
  id uuid not null,
  reason text not null,
  primary key (user_id, id)
) on commit drop;
create temporary table qa_event_targets (like qa_task_targets including all) on commit drop;
create temporary table qa_workflow_instance_targets (like qa_task_targets including all) on commit drop;
create temporary table qa_task_template_targets (like qa_task_targets including all) on commit drop;
create temporary table qa_workflow_template_targets (like qa_task_targets including all) on commit drop;

do $$
begin
  if (select count(*) from qa_requested_targets) <> 13 then
    raise exception 'Expected exactly 13 reviewed QA targets';
  end if;
  if exists (select 1 from qa_requested_targets where id = '00000000-0000-0000-0000-000000000000') then
    raise exception 'Replace the cleanup target sentinel with exact Preview IDs';
  end if;
end;
$$;

insert into qa_task_targets
select t.user_id, t.id, 'explicit Preview task ID'
from qa_requested_targets requested
join public.tasks t on t.id = requested.id
join qa_cleanup_owner owner on owner.user_id = t.user_id
where requested.object_type = 'task';
insert into qa_event_targets
select e.user_id, e.id, 'explicit Preview event ID'
from qa_requested_targets requested
join public.events e on e.id = requested.id
join qa_cleanup_owner owner on owner.user_id = e.user_id
where requested.object_type = 'event';
insert into qa_workflow_instance_targets
select i.user_id, i.id, 'explicit Preview workflow ID'
from qa_requested_targets requested
join public.task_workflow_instances i on i.id = requested.id
join qa_cleanup_owner owner on owner.user_id = i.user_id
where requested.object_type = 'workflow_instance';
insert into qa_task_template_targets
select t.user_id, t.id, 'explicit Preview task template ID'
from qa_requested_targets requested
join public.task_templates t on t.id = requested.id
join qa_cleanup_owner owner on owner.user_id = t.user_id
where requested.object_type = 'task_template';
insert into qa_workflow_template_targets
select t.user_id, t.id, 'explicit Preview workflow template ID'
from qa_requested_targets requested
join public.workflow_templates t on t.id = requested.id
join qa_cleanup_owner owner on owner.user_id = t.user_id
where requested.object_type = 'workflow_template';

do $$
declare
  requested_count integer;
  resolved_count integer;
begin
  select count(*) into requested_count from qa_requested_targets;
  select
    (select count(*) from qa_task_targets)
    + (select count(*) from qa_event_targets)
    + (select count(*) from qa_workflow_instance_targets)
    + (select count(*) from qa_task_template_targets)
    + (select count(*) from qa_workflow_template_targets)
  into resolved_count;
  if requested_count <> resolved_count then
    raise exception 'At least one requested ID is missing or belongs to another user';
  end if;
end;
$$;

do $$
declare
  changed_count integer;
  inserted_count integer;
begin
  loop
    changed_count := 0;
    insert into qa_task_targets
    select r.user_id, r.generated_task_id, 'generated by selected QA workflow ' || r.instance_id::text
    from public.workflow_followup_rules r
    join qa_workflow_instance_targets i on i.user_id = r.user_id and i.id = r.instance_id
    where r.generated_task_id is not null
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
    changed_count := changed_count + inserted_count;

    insert into qa_task_targets
    select child.user_id, child.id, 'recurrence child of selected QA task ' || child.recurrence_source_id::text
    from public.tasks child
    join qa_task_targets parent on parent.user_id = child.user_id and parent.id = child.recurrence_source_id
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
    changed_count := changed_count + inserted_count;

    insert into qa_event_targets
    select child.user_id, child.id, 'recurrence child of selected QA event ' || child.recurrence_source_id::text
    from public.events child
    join qa_event_targets parent on parent.user_id = child.user_id and parent.id = child.recurrence_source_id
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
    changed_count := changed_count + inserted_count;

    insert into qa_workflow_instance_targets
    select i.user_id, i.id, 'workflow attached to selected QA task ' || i.task_id::text
    from public.task_workflow_instances i
    join qa_task_targets t on t.user_id = i.user_id and t.id = i.task_id
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
    changed_count := changed_count + inserted_count;

    insert into qa_workflow_instance_targets
    select i.user_id, i.id, 'workflow created from selected QA template ' || i.source_template_id::text
    from public.task_workflow_instances i
    join qa_workflow_template_targets t on t.user_id = i.user_id and t.id = i.source_template_id
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
    changed_count := changed_count + inserted_count;

    exit when changed_count = 0;
  end loop;
end;
$$;

select 'task' as object_type, t.user_id, t.id, t.title as label, target.reason
from qa_task_targets target join public.tasks t on t.user_id = target.user_id and t.id = target.id
union all
select 'event', e.user_id, e.id, e.title, target.reason
from qa_event_targets target join public.events e on e.user_id = target.user_id and e.id = target.id
union all
select 'workflow_instance', i.user_id, i.id, i.name, target.reason
from qa_workflow_instance_targets target join public.task_workflow_instances i on i.user_id = target.user_id and i.id = target.id
union all
select 'task_template', t.user_id, t.id, t.name, target.reason
from qa_task_template_targets target join public.task_templates t on t.user_id = target.user_id and t.id = target.id
union all
select 'workflow_template', t.user_id, t.id, t.name, target.reason
from qa_workflow_template_targets target join public.workflow_templates t on t.user_id = target.user_id and t.id = target.id
order by object_type, label, id;

update public.task_workflow_instances i
set current_step_id = null
from qa_workflow_instance_targets target
where i.user_id = target.user_id and i.id = target.id;

delete from public.workflow_timeline_events row
using qa_workflow_instance_targets target
where row.user_id = target.user_id and row.instance_id = target.id;

delete from public.workflow_step_links row
using public.task_workflow_steps step, qa_workflow_instance_targets target
where row.user_id = step.user_id and row.workflow_step_id = step.id
  and step.user_id = target.user_id and step.instance_id = target.id;

delete from public.task_workflow_step_checklist_items row
using public.task_workflow_steps step, qa_workflow_instance_targets target
where row.user_id = step.user_id and row.workflow_step_id = step.id
  and step.user_id = target.user_id and step.instance_id = target.id;

delete from public.workflow_followup_rules row
using qa_workflow_instance_targets target
where row.user_id = target.user_id and row.instance_id = target.id;

delete from public.task_workflow_steps row
using qa_workflow_instance_targets target
where row.user_id = target.user_id and row.instance_id = target.id;

delete from public.task_workflow_instances row
using qa_workflow_instance_targets target
where row.user_id = target.user_id and row.id = target.id;

delete from public.task_checklist_items row using qa_task_targets target
where row.user_id = target.user_id and row.task_id = target.id;
delete from public.task_links row using qa_task_targets target
where row.user_id = target.user_id and row.task_id = target.id;
delete from public.task_reminders row using qa_task_targets target
where row.user_id = target.user_id and row.task_id = target.id;
delete from public.tasks row using qa_task_targets target
where row.user_id = target.user_id and row.id = target.id;

delete from public.event_links row using qa_event_targets target
where row.user_id = target.user_id and row.event_id = target.id;
delete from public.event_reminders row using qa_event_targets target
where row.user_id = target.user_id and row.event_id = target.id;
delete from public.events row using qa_event_targets target
where row.user_id = target.user_id and row.id = target.id;

delete from public.task_template_checklist_items row using qa_task_template_targets target
where row.user_id = target.user_id and row.template_id = target.id;
delete from public.task_templates row using qa_task_template_targets target
where row.user_id = target.user_id and row.id = target.id;

delete from public.workflow_followup_rules row using qa_workflow_template_targets target
where row.user_id = target.user_id and row.template_id = target.id;
delete from public.workflow_template_step_checklist_items row
using public.workflow_template_steps step, qa_workflow_template_targets target
where row.user_id = step.user_id and row.template_step_id = step.id
  and step.user_id = target.user_id and step.template_id = target.id;
delete from public.workflow_template_step_links row
using public.workflow_template_steps step, qa_workflow_template_targets target
where row.user_id = step.user_id and row.template_step_id = step.id
  and step.user_id = target.user_id and step.template_id = target.id;
delete from public.workflow_template_steps row using qa_workflow_template_targets target
where row.user_id = target.user_id and row.template_id = target.id;
delete from public.workflow_templates row using qa_workflow_template_targets target
where row.user_id = target.user_id and row.id = target.id;

rollback;
