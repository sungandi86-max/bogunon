begin;

select plan(13);

select has_table('public', 'project_notes');
select row_security_active('public.project_notes');
select col_is_fk('public', 'project_notes', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'project_notes', 'project_id', 'public', 'projects', 'id');
select policies_are(
  'public',
  'project_notes',
  array[
    'project_notes_delete_own',
    'project_notes_insert_own',
    'project_notes_select_own',
    'project_notes_update_own'
  ]
);
select table_privs_are('public', 'project_notes', 'anon', array[]::text[]);
select table_privs_are(
  'public',
  'project_notes',
  'authenticated',
  array['DELETE', 'INSERT', 'SELECT', 'UPDATE']
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('a1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'notes-a@example.invalid', '', now(), now(), now()),
  ('a2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'notes-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
insert into public.projects (id, user_id, name, icon, color)
values ('a3000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '제주 여행', 'calendar', 'mint');
insert into public.project_notes (user_id, project_id, title, content, is_pinned)
values (
  'a1000000-0000-4000-8000-000000000001',
  'a3000000-0000-4000-8000-000000000003',
  '제주 여행 계획',
  '# 준비',
  true
);

select is((select count(*)::integer from public.project_notes), 1, '본인 노트를 조회한다');
select lives_ok(
  $$update public.project_notes set title = '제주 여행 준비'
    where title = '제주 여행 계획'$$,
  '본인 노트를 수정한다'
);

select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.project_notes), 0, '다른 사용자 노트를 조회하지 못한다');
select throws_ok(
  $$insert into public.project_notes (user_id, project_id, title, content)
    values (
      'a2000000-0000-4000-8000-000000000002',
      'a3000000-0000-4000-8000-000000000003',
      '위조 노트',
      ''
    )$$,
  '23503', null, '다른 사용자의 프로젝트에 노트를 생성하지 못한다'
);
select is_empty(
  $$delete from public.project_notes
    where title = '제주 여행 준비' returning id$$,
  '다른 사용자 노트를 삭제하지 못한다'
);

set local role postgres;
delete from public.projects where id = 'a3000000-0000-4000-8000-000000000003';
select is(
  (select count(*)::integer from public.project_notes where project_id = 'a3000000-0000-4000-8000-000000000003'),
  0,
  '프로젝트 삭제 시 노트도 삭제한다'
);

select * from finish();
rollback;
