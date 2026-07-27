begin;

select plan(21);

select has_table('public', 'project_checklist_items');
select row_security_active('public.project_checklist_items');
select col_is_fk('public', 'project_checklist_items', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'project_checklist_items', 'project_id', 'public', 'projects', 'id');
select policies_are(
  'public',
  'project_checklist_items',
  array[
    'project_checklist_items_delete_own',
    'project_checklist_items_insert_own',
    'project_checklist_items_select_own',
    'project_checklist_items_update_own'
  ]
);
select table_privs_are('public', 'project_checklist_items', 'anon', array[]::text[]);
select table_privs_are(
  'public',
  'project_checklist_items',
  'authenticated',
  array['DELETE', 'SELECT']
);
select column_privs_are(
  'public', 'project_checklist_items', 'title', 'authenticated',
  array['INSERT', 'UPDATE']
);
select column_privs_are(
  'public', 'project_checklist_items', 'is_completed', 'authenticated',
  array['UPDATE']
);
select column_privs_are(
  'public', 'project_checklist_items', 'due_date', 'authenticated',
  array['INSERT', 'UPDATE']
);
select column_privs_are(
  'public', 'project_checklist_items', 'sort_order', 'authenticated',
  array[]::text[]
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'checklist-a@example.invalid', '', now(), now(), now()),
  ('92000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'checklist-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', true);
insert into public.projects (id, user_id, name, icon, color)
values ('93000000-0000-0000-0000-000000000003', '91000000-0000-0000-0000-000000000001', '제주 여행', 'calendar', 'mint');
insert into public.project_checklist_items (
  user_id, project_id, title, due_date
) values (
  '91000000-0000-0000-0000-000000000001',
  '93000000-0000-0000-0000-000000000003',
  '항공권 확인', '2026-07-27'
);

select is((select count(*)::integer from public.project_checklist_items), 1, '본인 체크리스트를 조회한다');
select is(
  (select sort_order from public.project_checklist_items where title = '항공권 확인'),
  0,
  '새 항목 순서는 DB가 배정한다'
);
select lives_ok(
  $$update public.project_checklist_items set is_completed = true
    where title = '항공권 확인'$$,
  '본인 체크리스트를 수정한다'
);
select throws_ok(
  $$update public.project_checklist_items set sort_order = 99
    where title = '항공권 확인'$$,
  '42501', null, 'RPC 밖에서는 순서를 수정하지 못한다'
);

select set_config('request.jwt.claim.sub', '92000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.project_checklist_items), 0, '다른 사용자 체크리스트를 조회하지 못한다');
select throws_ok(
  $$insert into public.project_checklist_items (user_id, project_id, title)
    values (
      '92000000-0000-0000-0000-000000000002',
      '93000000-0000-0000-0000-000000000003',
      '위조 항목'
    )$$,
  '23503', null, '다른 사용자의 프로젝트에 항목을 생성하지 못한다'
);
select is_empty(
  $$delete from public.project_checklist_items
    where title = '항공권 확인' returning id$$,
  '다른 사용자 체크리스트를 삭제하지 못한다'
);

select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select public.reorder_project_checklist_items(
    '93000000-0000-0000-0000-000000000003',
    array[
      (select id from public.project_checklist_items where title = '항공권 확인')
    ]::uuid[]
  )$$,
  '본인 체크리스트 순서를 저장한다'
);
select set_config('request.jwt.claim.sub', '92000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select public.reorder_project_checklist_items(
    '93000000-0000-0000-0000-000000000003',
    array[
      (select id from public.project_checklist_items where title = '항공권 확인')
    ]::uuid[]
  )$$,
  '42501', null, '다른 사용자 프로젝트 순서를 변경하지 못한다'
);

set local role postgres;
delete from public.projects where id = '93000000-0000-0000-0000-000000000003';
select is(
  (select count(*)::integer from public.project_checklist_items where project_id = '93000000-0000-0000-0000-000000000003'),
  0,
  '프로젝트 삭제 시 체크리스트도 삭제한다'
);

select * from finish();
rollback;
