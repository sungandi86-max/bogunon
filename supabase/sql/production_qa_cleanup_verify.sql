with cleanup_owner(user_id) as (
  values ('b61184fe-b423-416d-bea5-d5b5bece74e6'::uuid)
),
qa_tasks as (
  select t.id
  from public.tasks t join cleanup_owner o on o.user_id = t.user_id
  where left(t.title, 4) = '[QA-'
     or t.title in ('Phase5 QA 약품 점검', 'Phase5 QA 약품 점검 복사본', 'Phase5 Atomic QA', 'Phase5 Atomic QA 복사본')
     or strpos(coalesce(t.description, ''), '[QA-P6]') > 0
     or strpos(coalesce(t.memo, ''), '[QA-P6]') > 0
),
qa_workflows as (
  select i.id
  from public.task_workflow_instances i join cleanup_owner o on o.user_id = i.user_id
  where left(i.name, 4) = '[QA-'
     or i.name = '[QA-P6] Workflow 기본 QA'
     or strpos(coalesce(i.description, ''), '[QA-P6]') > 0
),
qa_followups as (
  select t.id
  from public.tasks t
  join cleanup_owner o on o.user_id = t.user_id
  join public.workflow_followup_rules r on r.user_id = t.user_id and r.generated_task_id = t.id
  join qa_workflows w on w.id = r.instance_id
)
select 'qa_task' as check_name, count(*)::bigint as remaining_count from qa_tasks
union all
select 'qa_workflow', count(*) from qa_workflows
union all
select 'qa_followup_task', count(*) from qa_followups
union all
select 'orphan_task_checklist', count(*)
from public.task_checklist_items c left join public.tasks t on t.user_id = c.user_id and t.id = c.task_id
where t.id is null
union all
select 'orphan_task_link', count(*)
from public.task_links l left join public.tasks t on t.user_id = l.user_id and t.id = l.task_id
where t.id is null
union all
select 'orphan_workflow_step', count(*)
from public.task_workflow_steps s left join public.task_workflow_instances i on i.user_id = s.user_id and i.id = s.instance_id
where i.id is null
union all
select 'orphan_workflow_child',
  (select count(*) from public.task_workflow_step_checklist_items c left join public.task_workflow_steps s on s.user_id = c.user_id and s.id = c.workflow_step_id where s.id is null)
  + (select count(*) from public.workflow_step_links l left join public.task_workflow_steps s on s.user_id = l.user_id and s.id = l.workflow_step_id where s.id is null)
  + (select count(*) from public.workflow_timeline_events e left join public.task_workflow_instances i on i.user_id = e.user_id and i.id = e.instance_id where i.id is null)
union all
select 'orphan_workflow_relation', count(*)
from public.workflow_followup_rules r
left join public.task_workflow_instances i on i.user_id = r.user_id and i.id = r.instance_id
left join public.workflow_templates t on t.user_id = r.user_id and t.id = r.template_id
where (r.instance_id is not null and i.id is null)
   or (r.template_id is not null and t.id is null)
order by check_name;

with cleanup_owner(user_id) as (
  values ('b61184fe-b423-416d-bea5-d5b5bece74e6'::uuid)
)
select 'ordinary_tasks' as object_type, count(*)::bigint as row_count
from public.tasks t join cleanup_owner o on o.user_id = t.user_id
where left(t.title, 4) <> '[QA-'
  and t.title not in ('Phase5 QA 약품 점검', 'Phase5 QA 약품 점검 복사본', 'Phase5 Atomic QA', 'Phase5 Atomic QA 복사본')
  and strpos(coalesce(t.description, ''), '[QA-P6]') = 0
  and strpos(coalesce(t.memo, ''), '[QA-P6]') = 0
union all
select 'ordinary_events', count(*)
from public.events e join cleanup_owner o on o.user_id = e.user_id
where e.area = 'exercise'
   or (
     left(e.title, 4) <> '[QA-'
     and e.title not in ('Phase5 QA 약품 점검', 'Phase5 Atomic QA')
     and strpos(coalesce(e.description, ''), '[QA-P6]') = 0
     and strpos(coalesce(e.memo, ''), '[QA-P6]') = 0
   )
union all
select 'calendar_stickers', count(*)
from public.calendar_stickers s join cleanup_owner o on o.user_id = s.user_id
union all
select 'exercise_logs', count(*)
from public.exercise_logs e join cleanup_owner o on o.user_id = e.user_id
order by object_type;
