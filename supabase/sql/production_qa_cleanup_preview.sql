with recursive
base_task_candidates as (
  select t.user_id, t.id
  from public.tasks t
  where left(t.title, 4) = '[QA-'
     or t.title in (
       'Phase5 QA 약품 점검',
       'Phase5 QA 약품 점검 복사본',
       'Phase5 Atomic QA',
       'Phase5 Atomic QA 복사본'
     )
     or strpos(coalesce(t.description, ''), '[QA-P6]') > 0
     or strpos(coalesce(t.memo, ''), '[QA-P6]') > 0
),
workflow_template_candidates as (
  select wt.user_id, wt.id
  from public.workflow_templates wt
  where left(wt.name, 4) = '[QA-'
     or wt.name = '[QA-P6] Workflow 기본 QA'
     or strpos(coalesce(wt.description, ''), '[QA-P6]') > 0
),
base_workflow_candidates as (
  select wi.user_id, wi.id
  from public.task_workflow_instances wi
  where left(wi.name, 4) = '[QA-'
     or wi.name = '[QA-P6] Workflow 기본 QA'
     or strpos(coalesce(wi.description, ''), '[QA-P6]') > 0
     or exists (
       select 1 from base_task_candidates bt
       where bt.user_id = wi.user_id and bt.id = wi.task_id
     )
     or exists (
       select 1 from workflow_template_candidates wt
       where wt.user_id = wi.user_id and wt.id = wi.source_template_id
     )
),
followup_task_candidates as (
  select r.user_id, r.generated_task_id as id
  from public.workflow_followup_rules r
  join base_workflow_candidates wi
    on wi.user_id = r.user_id and wi.id = r.instance_id
  where r.generated_task_id is not null
),
task_seed as (
  select * from base_task_candidates
  union
  select * from followup_task_candidates
),
task_candidates(user_id, id) as (
  select user_id, id from task_seed
  union
  select child.user_id, child.id
  from public.tasks child
  join task_candidates parent
    on parent.user_id = child.user_id
   and parent.id = child.recurrence_source_id
),
workflow_candidates as (
  select * from base_workflow_candidates
  union
  select wi.user_id, wi.id
  from public.task_workflow_instances wi
  join task_candidates t
    on t.user_id = wi.user_id and t.id = wi.task_id
),
candidate_rows as (
select
  'task'::text as object_type,
  t.user_id,
  t.id,
  t.title as label,
  t.status::text as status,
  t.created_at,
  t.due_date::text as item_date,
  t.recurrence_source_id as parent_task_id,
  source_rule.instance_id as source_workflow_id,
  (select count(*) from public.task_checklist_items c where c.user_id = t.user_id and c.task_id = t.id) as checklist_count,
  (case when t.memo is null then 0 else 1 end)::bigint as note_count,
  (select count(*) from public.task_links l where l.user_id = t.user_id and l.task_id = t.id) as link_count,
  (select count(*) from public.task_reminders r where r.user_id = t.user_id and r.task_id = t.id) as reminder_or_timeline_count,
  (select count(*) from public.task_workflow_instances wi where wi.user_id = t.user_id and wi.task_id = t.id) as workflow_or_step_count
from task_candidates candidate
join public.tasks t on t.user_id = candidate.user_id and t.id = candidate.id
left join lateral (
  select r.instance_id
  from public.workflow_followup_rules r
  where r.user_id = t.user_id and r.generated_task_id = t.id
  order by r.created_at
  limit 1
) source_rule on true
union all
select
  'workflow_instance',
  wi.user_id,
  wi.id,
  wi.name,
  wi.status::text,
  wi.created_at,
  null::text,
  wi.task_id,
  wi.id,
  (select count(*) from public.task_workflow_step_checklist_items c join public.task_workflow_steps s on s.user_id = c.user_id and s.id = c.workflow_step_id where s.user_id = wi.user_id and s.instance_id = wi.id),
  (select count(*) from public.task_workflow_steps s where s.user_id = wi.user_id and s.instance_id = wi.id and (s.memo is not null or s.internal_notes is not null)),
  (select count(*) from public.workflow_step_links l join public.task_workflow_steps s on s.user_id = l.user_id and s.id = l.workflow_step_id where s.user_id = wi.user_id and s.instance_id = wi.id),
  (select count(*) from public.workflow_timeline_events e where e.user_id = wi.user_id and e.instance_id = wi.id),
  (select count(*) from public.task_workflow_steps s where s.user_id = wi.user_id and s.instance_id = wi.id)
from workflow_candidates candidate
join public.task_workflow_instances wi
  on wi.user_id = candidate.user_id and wi.id = candidate.id
union all
select
  'event',
  e.user_id,
  e.id,
  e.title as label,
  null::text,
  e.created_at,
  e.start_date::text,
  e.recurrence_source_id,
  null::uuid,
  0::bigint,
  (case when e.memo is null then 0 else 1 end)::bigint as note_count,
  (select count(*) from public.event_links l where l.user_id = e.user_id and l.event_id = e.id) as link_count,
  (select count(*) from public.event_reminders r where r.user_id = e.user_id and r.event_id = e.id) as reminder_count,
  0::bigint
from public.events e
where e.area <> 'exercise'
  and (
    left(e.title, 4) = '[QA-'
    or e.title in ('Phase5 QA 약품 점검', 'Phase5 Atomic QA')
    or strpos(coalesce(e.description, ''), '[QA-P6]') > 0
    or strpos(coalesce(e.memo, ''), '[QA-P6]') > 0
  )
union all
select
  'task_template',
  t.user_id,
  t.id,
  t.name,
  null::text,
  t.created_at,
  null::text,
  null::uuid,
  null::uuid,
  (select count(*) from public.task_template_checklist_items c where c.user_id = t.user_id and c.template_id = t.id),
  0::bigint,
  0::bigint,
  0::bigint,
  0::bigint
from public.task_templates t
where left(t.name, 4) = '[QA-'
   or t.name = 'Phase5 Atomic QA'
union all
select
  'workflow_template',
  t.user_id,
  t.id,
  t.name,
  null::text,
  t.created_at,
  null::text,
  null::uuid,
  null::uuid,
  (select count(*) from public.workflow_template_step_checklist_items c join public.workflow_template_steps s on s.user_id = c.user_id and s.id = c.template_step_id where s.user_id = t.user_id and s.template_id = t.id),
  0::bigint,
  (select count(*) from public.workflow_template_step_links l join public.workflow_template_steps s on s.user_id = l.user_id and s.id = l.template_step_id where s.user_id = t.user_id and s.template_id = t.id),
  0::bigint,
  (select count(*) from public.workflow_template_steps s where s.user_id = t.user_id and s.template_id = t.id)
from public.workflow_templates t
where left(t.name, 4) = '[QA-'
   or t.name = '[QA-P6] Workflow 기본 QA'
   or strpos(coalesce(t.description, ''), '[QA-P6]') > 0
)
select
  candidate_rows.*,
  count(*) over (partition by object_type) as object_count,
  count(*) over () as total_count
from candidate_rows
order by user_id, object_type, created_at, id;
