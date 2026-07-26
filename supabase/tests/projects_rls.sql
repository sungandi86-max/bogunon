begin;

select plan(14);

select has_table('public', 'projects');
select row_security_active('public.projects');
select col_is_fk('public', 'projects', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'events', 'project_id', 'public', 'projects', 'id');
select policies_are(
  'public',
  'projects',
  array[
    'projects_delete_own',
    'projects_insert_own',
    'projects_select_own',
    'projects_update_own'
  ]
);
select table_privs_are('public', 'projects', 'anon', array[]::text[]);
select table_privs_are(
  'public',
  'projects',
  'authenticated',
  array['DELETE', 'INSERT', 'SELECT', 'UPDATE']
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'project-a@example.invalid', '', now(), now(), now()),
  ('82000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'project-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);

insert into public.projects (
  id, user_id, name, icon, color, description, start_date, end_date
) values (
  '83000000-0000-0000-0000-000000000003',
  '81000000-0000-0000-0000-000000000001',
  '학교 행사', 'calendar', 'mint', '행사 일정 모음', '2026-07-01', '2026-07-31'
);

select is((select count(*)::integer from public.projects), 1, '본인 프로젝트를 조회한다');
select lives_ok(
  $$update public.projects set name = '학교 행사 준비'
    where id = '83000000-0000-0000-0000-000000000003'$$,
  '본인 프로젝트를 수정한다'
);

select set_config('request.jwt.claim.sub', '82000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.projects), 0, '다른 사용자 프로젝트를 조회하지 못한다');
select is_empty(
  $$delete from public.projects
    where id = '83000000-0000-0000-0000-000000000003' returning id$$,
  '다른 사용자 프로젝트를 삭제하지 못한다'
);
select throws_ok(
  $$insert into public.projects (user_id, name, icon, color)
    values ('81000000-0000-0000-0000-000000000001', '위조 프로젝트', 'folder', 'blue')$$,
  '42501', null, '다른 사용자 소유 프로젝트를 등록하지 못한다'
);
select throws_ok(
  $$insert into public.events (
      user_id, project_id, title, area, start_date, end_date
    ) values (
      '82000000-0000-0000-0000-000000000002',
      '83000000-0000-0000-0000-000000000003',
      '위조 연결', 'personal', '2026-07-27', '2026-07-27'
    )$$,
  '23503', null, '다른 사용자 프로젝트를 일정에 연결하지 못한다'
);

select set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
insert into public.events (
  id, user_id, project_id, title, area, start_date, end_date
) values (
  '84000000-0000-0000-0000-000000000004',
  '81000000-0000-0000-0000-000000000001',
  '83000000-0000-0000-0000-000000000003',
  '행사 준비', 'schoolSchedule', '2026-07-27', '2026-07-27'
);
delete from public.projects where id = '83000000-0000-0000-0000-000000000003';
select is(
  (select project_id from public.events where id = '84000000-0000-0000-0000-000000000004'),
  null::uuid,
  '프로젝트 삭제 시 일정은 보존하고 연결만 해제한다'
);

select * from finish();
rollback;
