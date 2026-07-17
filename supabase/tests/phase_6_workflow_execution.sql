begin;

select plan(78);

select has_table('public', 'workflow_templates', 'workflow_templates exists');
select has_table('public', 'workflow_template_steps', 'workflow_template_steps exists');
select has_table('public', 'workflow_template_step_checklist_items', 'template checklist table exists');
select has_table('public', 'workflow_template_step_links', 'template step links table exists');
select has_table('public', 'task_workflow_instances', 'task workflow instances table exists');
select has_table('public', 'task_workflow_steps', 'task workflow steps table exists');
select has_table('public', 'task_workflow_step_checklist_items', 'instance checklist table exists');
select has_table('public', 'workflow_step_links', 'instance step links table exists');
select has_table('public', 'workflow_timeline_events', 'workflow timeline table exists');
select has_table('public', 'workflow_followup_rules', 'workflow follow-up rules table exists');

select is(
  (select count(*)::integer from pg_class
   where oid in (
     'public.workflow_templates'::regclass,
     'public.workflow_template_steps'::regclass,
     'public.workflow_template_step_checklist_items'::regclass,
     'public.workflow_template_step_links'::regclass,
     'public.task_workflow_instances'::regclass,
     'public.task_workflow_steps'::regclass,
     'public.task_workflow_step_checklist_items'::regclass,
     'public.workflow_step_links'::regclass,
     'public.workflow_timeline_events'::regclass,
     'public.workflow_followup_rules'::regclass
   ) and relrowsecurity),
  10,
  'RLS is enabled on every Phase 6 table'
);
select is(
  (select count(*)::integer from pg_policies
   where schemaname = 'public'
     and tablename in (
       'workflow_templates', 'workflow_template_steps',
       'workflow_template_step_checklist_items', 'workflow_template_step_links',
       'task_workflow_instances', 'task_workflow_steps',
       'task_workflow_step_checklist_items', 'workflow_step_links',
       'workflow_timeline_events', 'workflow_followup_rules'
     )),
  40,
  'every Phase 6 table has four own-row policies'
);
select is(
  (select count(*)::integer
   from information_schema.role_table_grants
   where grantee = 'authenticated'
     and table_schema = 'public'
     and table_name in (
       'workflow_templates', 'workflow_template_steps',
       'workflow_template_step_checklist_items', 'workflow_template_step_links',
       'task_workflow_instances', 'task_workflow_steps',
       'task_workflow_step_checklist_items', 'workflow_step_links',
       'workflow_timeline_events', 'workflow_followup_rules'
     )
     and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  34,
  'authenticated receives CRUD grants except direct instance and step lifecycle writes'
);
select is(
  (select count(*)::integer
   from information_schema.role_table_grants
   where grantee = 'anon'
     and table_schema = 'public'
     and table_name like 'workflow%'),
  0,
  'anon receives no Phase 6 table grants'
);

select has_function_privilege('authenticated', 'public.save_workflow_template_bundle(uuid,jsonb,jsonb,jsonb)', 'EXECUTE', 'authenticated can save a workflow template bundle');
select has_function_privilege('authenticated', 'public.create_workflow_instance_bundle(uuid,uuid,jsonb,jsonb,jsonb)', 'EXECUTE', 'authenticated can create a workflow instance bundle');
select has_function_privilege('authenticated', 'public.update_workflow_step_bundle(uuid,jsonb,jsonb,jsonb)', 'EXECUTE', 'authenticated can update a workflow step bundle');
select has_function_privilege('authenticated', 'public.transition_workflow_step(uuid,text,boolean)', 'EXECUTE', 'authenticated can transition a workflow step');
select has_function_privilege('authenticated', 'public.transition_workflow_instance(uuid,text)', 'EXECUTE', 'authenticated can transition a workflow instance');
select has_function_privilege('authenticated', 'public.complete_workflow_instance(uuid)', 'EXECUTE', 'authenticated can complete a workflow instance');
select is(
  (select count(*)::integer from pg_proc
   where oid in (
     'public.save_workflow_template_bundle(uuid,jsonb,jsonb,jsonb)'::regprocedure,
     'public.create_workflow_instance_bundle(uuid,uuid,jsonb,jsonb,jsonb)'::regprocedure,
     'public.update_workflow_step_bundle(uuid,jsonb,jsonb,jsonb)'::regprocedure,
     'public.transition_workflow_step(uuid,text,boolean)'::regprocedure,
     'public.transition_workflow_instance(uuid,text)'::regprocedure,
     'public.complete_workflow_instance(uuid)'::regprocedure
   ) and prosecdef = true),
  6,
  'stateful Phase 6 RPCs use restricted security definer execution'
);
select is(
  (select count(*)::integer from pg_proc
   where oid in (
     'public.save_workflow_template_bundle(uuid,jsonb,jsonb,jsonb)'::regprocedure,
     'public.create_workflow_instance_bundle(uuid,uuid,jsonb,jsonb,jsonb)'::regprocedure,
     'public.update_workflow_step_bundle(uuid,jsonb,jsonb,jsonb)'::regprocedure,
     'public.transition_workflow_step(uuid,text,boolean)'::regprocedure,
     'public.transition_workflow_instance(uuid,text)'::regprocedure,
     'public.complete_workflow_instance(uuid)'::regprocedure
   ) and has_function_privilege('anon', oid, 'EXECUTE')),
  0,
  'anon cannot execute any Phase 6 RPC'
);
select is((select proargnames::text from pg_proc where oid = 'public.save_workflow_template_bundle(uuid,jsonb,jsonb,jsonb)'::regprocedure), '{p_template_id,p_values,p_steps,p_followups}', 'save template argument names match the app contract');
select is((select proargnames::text from pg_proc where oid = 'public.create_workflow_instance_bundle(uuid,uuid,jsonb,jsonb,jsonb)'::regprocedure), '{p_task_id,p_template_id,p_values,p_steps,p_followups}', 'create instance argument names match the app contract');
select is((select proargnames::text from pg_proc where oid = 'public.update_workflow_step_bundle(uuid,jsonb,jsonb,jsonb)'::regprocedure), '{p_step_id,p_values,p_checklist,p_links}', 'update step argument names match the app contract');
select is((select proargnames::text from pg_proc where oid = 'public.transition_workflow_step(uuid,text,boolean)'::regprocedure), '{p_step_id,p_target_status,p_force}', 'step transition argument names match the app contract');
select is((select proargnames::text from pg_proc where oid = 'public.transition_workflow_instance(uuid,text)'::regprocedure), '{p_instance_id,p_target_status}', 'instance transition argument names match the app contract');
select is((select proargnames::text from pg_proc where oid = 'public.complete_workflow_instance(uuid)'::regprocedure), '{p_instance_id}', 'complete instance argument names match the app contract');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase6-a@example.invalid', '', now(), now(), now()),
  ('82000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase6-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.save_workflow_template_bundle(
    null,
    '{"name":"Screening workflow","description":"Run screening","category":"additionalScreening","default_priority":"high","recommended_timing":"This week"}',
    '[
      {"name":"Prepare","description":"Prepare materials","estimated_minutes":20,"checklist":["Confirm scope"],"links":[{"title":"Guide","url":"https://example.invalid/guide"}]},
      {"name":"Report","description":"Submit report","estimated_minutes":10,"checklist":[],"links":[]}
    ]',
    '[
      {"trigger_type":"step_completed","trigger_step_position":0,"title":"Step follow-up","category":"additionalScreening","priority":"normal","delay_days":1,"include_checklist":true},
      {"trigger_type":"workflow_completed","trigger_step_position":null,"title":"Workflow follow-up","category":"additionalScreening","priority":"normal","delay_days":2,"include_checklist":false}
    ]'
  )$$,
  'template bundle saves atomically'
);
select is((select count(*)::integer from public.workflow_template_steps), 2, 'template bundle stores both steps');
select is((select count(*)::integer from public.workflow_template_step_checklist_items), 1, 'template bundle stores checklist items');
select is((select count(*)::integer from public.workflow_template_step_links), 1, 'template bundle stores links');
select is((select count(*)::integer from public.workflow_followup_rules where template_id is not null), 2, 'template bundle stores follow-up rules');

select throws_ok(
  $$select public.save_workflow_template_bundle(
    (select id from public.workflow_templates where name = 'Screening workflow'),
    '{"name":"Broken replacement","category":"other","default_priority":"normal"}',
    '[{"name":"Broken step","checklist":[],"links":[{"title":"Bad","url":"javascript:alert(1)"}]}]',
    '[]'
  )$$,
  '23514',
  null,
  'invalid nested data rolls back a template replacement'
);
select is((select count(*)::integer from public.workflow_template_steps), 2, 'failed replacement preserves only the target template steps');

select lives_ok(
  $$insert into public.tasks (id, user_id, title, area, category)
    values ('83000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000001', 'Screening task', 'healthWork', 'additionalScreening')$$,
  'parent task is created'
);
select lives_ok(
  $$select public.create_workflow_instance_bundle(
    '83000000-0000-0000-0000-000000000003',
    (select id from public.workflow_templates where name = 'Screening workflow'),
    '{}',
    '[]',
    '[]'
  )$$,
  'workflow instance snapshots the template bundle'
);
select is((select count(*)::integer from public.task_workflow_instances), 1, 'one workflow instance is stored');
select is((select count(*)::integer from public.task_workflow_steps), 2, 'template steps are copied to the instance');
select is((select count(*)::integer from public.task_workflow_step_checklist_items), 1, 'template checklist is copied to the instance');
select is((select count(*)::integer from public.workflow_step_links), 1, 'template links are copied to the instance');
select is((select count(*)::integer from public.workflow_followup_rules where instance_id is not null), 2, 'template follow-ups are copied to the instance');
select is((select count(*)::integer from public.workflow_timeline_events where event_type = 'workflow_created'), 1, 'instance creation is recorded on the timeline');
select throws_ok(
  $$select public.create_workflow_instance_bundle(
    '83000000-0000-0000-0000-000000000003',
    (select id from public.workflow_templates where name = 'Screening workflow'),
    '{}',
    '[]',
    '[]'
  )$$,
  '23505',
  null,
  'a task cannot receive duplicate workflow instances'
);
select throws_ok(
  $$update public.task_workflow_steps set status = 'completed' where position = 0$$,
  '42501',
  null,
  'direct table updates cannot bypass the workflow state machine'
);
select throws_ok(
  $$delete from public.task_workflow_steps where position = 1$$,
  '42501',
  null,
  'direct table deletes cannot bypass workflow completion requirements'
);

select lives_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 1), 'in_progress', false)$$,
  'a later step can be inspected in progress'
);
select throws_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 1), 'completed', false)$$,
  'P0001',
  null,
  'a later step cannot complete before its predecessor without force'
);
select lives_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 1), 'pending', false)$$,
  'the later step can return to pending'
);

select throws_ok(
  $$select public.update_workflow_step_bundle(
    (select id from public.task_workflow_steps where position = 0),
    '{"memo":"must roll back"}',
    '[{"title":"Replacement check","is_completed":false}]',
    '[{"title":"Bad","url":"javascript:alert(1)"}]'
  )$$,
  '23514',
  null,
  'invalid step link rolls back the entire step bundle update'
);
select is((select title from public.task_workflow_step_checklist_items where position = 0), 'Confirm scope', 'failed step update preserves its checklist');

select throws_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 0), 'completed', false)$$,
  'P0001',
  null,
  'pending step cannot transition directly to completed'
);
select lives_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 0), 'in_progress', false)$$,
  'pending step can start'
);
select throws_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 0), 'completed', false)$$,
  'P0001',
  null,
  'step completion rejects an incomplete checklist'
);
update public.task_workflow_step_checklist_items set is_completed = true where position = 0;
select lives_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 0), 'completed', false)$$,
  'step completes after its checklist is complete'
);
select isnt(
  (select generated_task_id from public.workflow_followup_rules where instance_id is not null and trigger_type = 'step_completed'),
  null::uuid,
  'step completion stores generated_task_id on its follow-up rule'
);
select is((select count(*)::integer from public.tasks where title = 'Step follow-up'), 1, 'step completion creates one follow-up task');
select is((select count(*)::integer from public.task_checklist_items where task_id = (select id from public.tasks where title = 'Step follow-up')), 1, 'step follow-up copies the triggering checklist');
select lives_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 0), 'completed', false)$$,
  'repeating the completed transition is idempotent'
);
select is((select count(*)::integer from public.tasks where title = 'Step follow-up'), 1, 'repeated completion does not duplicate the step follow-up task');

select throws_ok(
  $$select public.complete_workflow_instance((select id from public.task_workflow_instances))$$,
  'P0001',
  null,
  'workflow cannot complete with a pending step'
);
select lives_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 1), 'in_progress', false)$$,
  'second step can start'
);
select lives_ok(
  $$select public.transition_workflow_step((select id from public.task_workflow_steps where position = 1), 'completed', false)$$,
  'second step can complete'
);
select lives_ok(
  $$select public.complete_workflow_instance((select id from public.task_workflow_instances))$$,
  'workflow completes when every step is terminal'
);
select is((select status from public.task_workflow_instances), 'completed', 'workflow instance is completed');
select is((select status from public.tasks where id = '83000000-0000-0000-0000-000000000003'), 'completed', 'completing the workflow completes its parent task');
select isnt(
  (select generated_task_id from public.workflow_followup_rules where instance_id is not null and trigger_type = 'workflow_completed'),
  null::uuid,
  'workflow completion stores generated_task_id on its follow-up rule'
);
select is((select count(*)::integer from public.tasks where title in ('Step follow-up', 'Workflow follow-up')), 2, 'both trigger types create one task each');
select lives_ok(
  $$select public.complete_workflow_instance((select id from public.task_workflow_instances))$$,
  'repeating workflow completion is idempotent'
);
select is((select count(*)::integer from public.tasks where title in ('Step follow-up', 'Workflow follow-up')), 2, 'repeated workflow completion creates no duplicate follow-up');
select throws_ok(
  $$select public.transition_workflow_instance((select id from public.task_workflow_instances), 'active')$$,
  'P0001',
  null,
  'completed workflow cannot transition back to active'
);

select set_config('request.jwt.claim.sub', '82000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.workflow_templates), 0, 'user B cannot see user A templates');
select is((select count(*)::integer from public.task_workflow_instances), 0, 'user B cannot see user A instances');
select is((select count(*)::integer from public.task_workflow_steps), 0, 'user B cannot see user A steps');
select is((select count(*)::integer from public.workflow_followup_rules), 0, 'user B cannot see user A follow-up rules');
select throws_ok(
  $$insert into public.workflow_templates (user_id, name) values ('81000000-0000-0000-0000-000000000001', 'Cross-owner template')$$,
  '42501',
  null,
  'user B cannot insert a row owned by user A'
);

set local role anon;
select throws_ok($$select * from public.workflow_templates$$, '42501', null, 'anon cannot read workflow tables');
select throws_ok(
  $$select public.complete_workflow_instance('84000000-0000-0000-0000-000000000004')$$,
  '42501',
  null,
  'anon cannot execute workflow RPCs'
);

select * from finish();
rollback;
