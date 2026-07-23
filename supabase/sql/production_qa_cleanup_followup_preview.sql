select
  t.user_id,
  t.id as task_id,
  t.title,
  t.status,
  t.created_at,
  t.due_date,
  r.id as followup_rule_id,
  r.trigger_type,
  r.instance_id as source_workflow_id,
  i.name as source_workflow_name,
  i.task_id as source_task_id,
  parent.title as source_task_title
from public.tasks t
left join public.workflow_followup_rules r
  on r.user_id = t.user_id
 and r.generated_task_id = t.id
left join public.task_workflow_instances i
  on i.user_id = r.user_id
 and i.id = r.instance_id
left join public.tasks parent
  on parent.user_id = i.user_id
 and parent.id = i.task_id
where t.user_id = 'b61184fe-b423-416d-bea5-d5b5bece74e6'
  and t.title = '업무 절차 후속 업무'
order by t.created_at, t.id;
