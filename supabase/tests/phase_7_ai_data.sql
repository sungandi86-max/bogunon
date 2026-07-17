begin;

select plan(34);

select has_table('public', 'ai_preferences', 'ai_preferences exists');
select has_table('public', 'ai_requests', 'ai_requests exists');
select has_table('public', 'ai_action_drafts', 'ai_action_drafts exists');
select has_function(
  'public',
  'save_ai_history_bundle',
  array['uuid', 'text', 'text', 'jsonb'],
  'atomic AI history bundle function exists'
);
select is(
  (select count(*)::integer
   from information_schema.role_routine_grants
   where grantee = 'authenticated'
     and routine_schema = 'public'
     and routine_name = 'save_ai_history_bundle'
     and privilege_type = 'EXECUTE'),
  1,
  'authenticated can execute the AI history bundle function'
);
select is(
  (select count(*)::integer
   from information_schema.role_routine_grants
   where grantee = 'anon'
     and routine_schema = 'public'
     and routine_name = 'save_ai_history_bundle'),
  0,
  'anon cannot execute the AI history bundle function'
);

select is(
  (select count(*)::integer from pg_class
   where oid in (
     'public.ai_preferences'::regclass,
     'public.ai_requests'::regclass,
     'public.ai_action_drafts'::regclass
   ) and relrowsecurity),
  3,
  'RLS is enabled on every Phase 7 AI table'
);
select is(
  (select count(*)::integer from pg_policies
   where schemaname = 'public'
     and tablename in ('ai_preferences', 'ai_requests', 'ai_action_drafts')),
  12,
  'every Phase 7 AI table has four own-row policies'
);
select is(
  (select count(*)::integer
   from information_schema.role_table_grants
   where grantee = 'authenticated'
     and table_schema = 'public'
     and table_name in ('ai_preferences', 'ai_requests', 'ai_action_drafts')
     and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  12,
  'authenticated receives exact CRUD grants on all Phase 7 AI tables'
);
select is(
  (select count(*)::integer
   from information_schema.role_table_grants
   where grantee = 'anon'
     and table_schema = 'public'
     and table_name in ('ai_preferences', 'ai_requests', 'ai_action_drafts')),
  0,
  'anon receives no Phase 7 AI table grants'
);
select is(
  (select count(*)::integer
   from information_schema.columns
   where table_schema = 'public'
     and table_name in ('ai_preferences', 'ai_requests', 'ai_action_drafts')
     and column_name in ('id', 'user_id', 'created_at', 'updated_at')),
  12,
  'every Phase 7 AI table has the four required ownership columns'
);
select ok(
  (select column_default = 'false'
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'ai_preferences'
     and column_name = 'history_enabled'),
  'AI request history is disabled by default'
);
select is(
  (select count(*)::integer
   from information_schema.columns
   where table_schema = 'public'
     and table_name in ('ai_requests', 'ai_action_drafts')
     and column_name like '%context%'),
  0,
  'AI tables do not persist context snapshots'
);
select has_index('public', 'ai_preferences', 'ai_preferences_user_id_key', 'preferences ownership lookup is indexed uniquely');
select has_index('public', 'ai_requests', 'ai_requests_user_created_idx', 'request history lookup is indexed');
select has_index('public', 'ai_requests', 'ai_requests_user_status_created_idx', 'request status lookup is indexed');
select has_index('public', 'ai_action_drafts', 'ai_action_drafts_user_request_idx', 'draft request lookup is indexed');
select has_index('public', 'ai_action_drafts', 'ai_action_drafts_user_status_created_idx', 'draft status lookup is indexed');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase7-a@example.invalid', '', now(), now(), now()),
  ('92000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase7-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$insert into public.ai_preferences (user_id)
    values ('91000000-0000-0000-0000-000000000001')$$,
  'user A can create own AI preferences'
);
select is(
  (select history_enabled from public.ai_preferences),
  false,
  'new preferences keep history off'
);
select lives_ok(
  $$insert into public.ai_requests (id, user_id, request_type, prompt)
    values (
      '93000000-0000-0000-0000-000000000003',
      '91000000-0000-0000-0000-000000000001',
      'action_draft',
      'Draft a task without personal information'
    )$$,
  'user A can create an own AI request'
);
select lives_ok(
  $$insert into public.ai_action_drafts (user_id, request_id, action_type, payload)
    values (
      '91000000-0000-0000-0000-000000000001',
      '93000000-0000-0000-0000-000000000003',
      'create_task',
      '{"title":"Prepare health screening notice"}'
    )$$,
  'user A can create an own action draft'
);
select lives_ok(
  $$update public.ai_requests
    set status = 'completed', completed_at = now()
    where id = '93000000-0000-0000-0000-000000000003'$$,
  'user A can update an own AI request'
);
select is(
  (select count(*)::integer from pg_trigger
   where tgrelid = 'public.ai_requests'::regclass
     and tgname = 'ai_requests_set_updated_at'
     and not tgisinternal),
  1,
  'AI requests have an updated_at trigger'
);
select throws_ok(
  $$update public.ai_requests
    set user_id = '92000000-0000-0000-0000-000000000002'
    where id = '93000000-0000-0000-0000-000000000003'$$,
  '42501',
  null,
  'user A cannot reassign an AI request to user B'
);

select set_config('request.jwt.claim.sub', '92000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.ai_preferences), 0, 'user B cannot see user A preferences');
select is((select count(*)::integer from public.ai_requests), 0, 'user B cannot see user A requests');
select is((select count(*)::integer from public.ai_action_drafts), 0, 'user B cannot see user A drafts');
select throws_ok(
  $$insert into public.ai_preferences (user_id)
    values ('91000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'user B cannot create preferences owned by user A'
);
select throws_ok(
  $$insert into public.ai_action_drafts (user_id, request_id, action_type, payload)
    values (
      '92000000-0000-0000-0000-000000000002',
      '93000000-0000-0000-0000-000000000003',
      'create_task',
      '{"title":"Cross-owner draft"}'
    )$$,
  '23503',
  null,
  'ownership-preserving foreign key rejects cross-owner drafts'
);

select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$delete from public.ai_action_drafts
    where request_id = '93000000-0000-0000-0000-000000000003'$$,
  'user A can delete an own action draft'
);

set local role anon;
select throws_ok($$select * from public.ai_preferences$$, '42501', null, 'anon cannot read AI preferences');
select throws_ok($$select * from public.ai_requests$$, '42501', null, 'anon cannot read AI requests');
select throws_ok($$select * from public.ai_action_drafts$$, '42501', null, 'anon cannot read AI action drafts');

select * from finish();
rollback;
