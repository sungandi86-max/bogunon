begin;

select plan(19);

select has_table('public', 'project_files');
select row_security_active('public.project_files');
select col_is_fk('public', 'project_files', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'project_files', 'project_id', 'public', 'projects', 'id');
select col_is_fk('public', 'project_files', 'reservation_id', 'public', 'project_reservations', 'id');
select policies_are(
  'public',
  'project_files',
  array[
    'project_files_delete_own',
    'project_files_insert_own',
    'project_files_select_own'
  ]
);
select table_privs_are('public', 'project_files', 'anon', array[]::text[]);
select table_privs_are(
  'public',
  'project_files',
  'authenticated',
  array['DELETE', 'INSERT', 'SELECT']
);
select is(
  (select public from storage.buckets where id = 'project-files'),
  false,
  '프로젝트 파일 bucket은 private이다'
);
select is(
  (select file_size_limit from storage.buckets where id = 'project-files'),
  15728640::bigint,
  '프로젝트 파일 크기는 15MB로 제한한다'
);
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'project_files_storage_delete_own',
        'project_files_storage_insert_own',
        'project_files_storage_select_own'
      )
  ),
  3,
  'Storage 정책 3개가 적용된다'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('b1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'files-a@example.invalid', '', now(), now(), now()),
  ('b2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'files-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
insert into public.projects (id, user_id, name, icon, color)
values
  ('b3000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', '제주 여행', 'calendar', 'mint'),
  ('b4000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', '강의 준비', 'folder', 'blue');

set local role postgres;
insert into public.project_reservations (
  id, user_id, project_id, type, title, reservation_date
) values (
  'b5000000-0000-4000-8000-000000000005',
  'b1000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000004',
  'custom',
  '강의실 예약',
  '2026-08-04'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
insert into public.project_files (
  id, user_id, project_id, filename, original_filename,
  mime_type, size_bytes, storage_path
) values (
  'b6000000-0000-4000-8000-000000000006',
  'b1000000-0000-4000-8000-000000000001',
  'b3000000-0000-4000-8000-000000000003',
  'b6000000-0000-4000-8000-000000000006.pdf',
  '항공권.pdf',
  'application/pdf',
  4096,
  'b1000000-0000-4000-8000-000000000001/b3000000-0000-4000-8000-000000000003/b6000000-0000-4000-8000-000000000006.pdf'
);

select is((select count(*)::integer from public.project_files), 1, '본인 파일을 조회한다');
select throws_ok(
  $$insert into public.project_files (
      user_id, project_id, reservation_id, filename, original_filename,
      mime_type, size_bytes, storage_path
    ) values (
      'b1000000-0000-4000-8000-000000000001',
      'b3000000-0000-4000-8000-000000000003',
      'b5000000-0000-4000-8000-000000000005',
      'b7000000-0000-4000-8000-000000000007.txt',
      '잘못된 연결.txt',
      'text/plain',
      10,
      'b1000000-0000-4000-8000-000000000001/b3000000-0000-4000-8000-000000000003/b7000000-0000-4000-8000-000000000007.txt'
    )$$,
  '23503', null, '다른 프로젝트 예약을 파일에 연결하지 못한다'
);

select set_config('request.jwt.claim.sub', 'b2000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.project_files), 0, '다른 사용자 파일을 조회하지 못한다');
select throws_ok(
  $$insert into public.project_files (
      user_id, project_id, filename, original_filename,
      mime_type, size_bytes, storage_path
    ) values (
      'b2000000-0000-4000-8000-000000000002',
      'b3000000-0000-4000-8000-000000000003',
      'b8000000-0000-4000-8000-000000000008.txt',
      '위조.txt',
      'text/plain',
      10,
      'b2000000-0000-4000-8000-000000000002/b3000000-0000-4000-8000-000000000003/b8000000-0000-4000-8000-000000000008.txt'
    )$$,
  '23503', null, '다른 사용자의 프로젝트에 파일을 생성하지 못한다'
);
select is_empty(
  $$delete from public.project_files
    where id = 'b6000000-0000-4000-8000-000000000006' returning id$$,
  '다른 사용자 파일을 삭제하지 못한다'
);

set local role postgres;
delete from public.projects where id = 'b3000000-0000-4000-8000-000000000003';
select is(
  (select count(*)::integer from public.project_files where project_id = 'b3000000-0000-4000-8000-000000000003'),
  0,
  '프로젝트 삭제 시 파일 메타데이터도 삭제한다'
);

select throws_ok(
  $$insert into public.project_files (
      user_id, project_id, filename, original_filename,
      mime_type, size_bytes, storage_path
    ) values (
      'b1000000-0000-4000-8000-000000000001',
      'b4000000-0000-4000-8000-000000000004',
      'b9000000-0000-4000-8000-000000000009.pdf',
      '../unsafe.pdf',
      'application/pdf',
      10,
      'b1000000-0000-4000-8000-000000000001/b4000000-0000-4000-8000-000000000004/b9000000-0000-4000-8000-000000000009.pdf'
    )$$,
  '23514', null, '경로 문자가 포함된 원본 파일명을 거부한다'
);
select throws_ok(
  $$insert into public.project_files (
      user_id, project_id, filename, original_filename,
      mime_type, size_bytes, storage_path
    ) values (
      'b1000000-0000-4000-8000-000000000001',
      'b4000000-0000-4000-8000-000000000004',
      'ba000000-0000-4000-8000-00000000000a.pdf',
      'large.pdf',
      'application/pdf',
      15728641,
      'b1000000-0000-4000-8000-000000000001/b4000000-0000-4000-8000-000000000004/ba000000-0000-4000-8000-00000000000a.pdf'
    )$$,
  '23514', null, '15MB를 초과한 파일 메타데이터를 거부한다'
);

select * from finish();
rollback;
