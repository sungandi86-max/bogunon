begin;

select plan(23);

select has_table('public', 'record_guidelines');
select row_security_active('public.record_guidelines');
select has_index(
  'public',
  'record_guidelines',
  'record_guidelines_user_year_idx'
);
select col_is_fk('public', 'record_guidelines', 'user_id', 'auth', 'users', 'id');
select col_not_null('public', 'record_guidelines', 'school_year');
select col_not_null('public', 'record_guidelines', 'document_type');
select policies_are(
  'public',
  'record_guidelines',
  array[
    'record_guidelines_delete_own',
    'record_guidelines_insert_own',
    'record_guidelines_select_own',
    'record_guidelines_update_own'
  ]
);
select table_privs_are(
  'public',
  'record_guidelines',
  'anon',
  array[]::text[]
);
select table_privs_are(
  'public',
  'record_guidelines',
  'authenticated',
  array['DELETE', 'INSERT', 'SELECT', 'UPDATE']
);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
values
  (
    '91000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'guideline-a@example.invalid',
    '',
    now(),
    now(),
    now()
  ),
  (
    '92000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'guideline-b@example.invalid',
    '',
    now(),
    now(),
    now()
  );

insert into public.record_guidelines (
  id,
  user_id,
  school_year,
  document_type,
  original_filename,
  mime_type,
  extracted_text,
  file_size
)
values (
  '93000000-0000-0000-0000-000000000003',
  '91000000-0000-0000-0000-000000000001',
  2026,
  'guide',
  'guide.txt',
  'text/plain',
  '공식 기준',
  16
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-0000-0000-000000000001',
  true
);
select is(
  (select count(*)::integer from public.record_guidelines),
  1,
  '사용자 A는 본인 기준자료를 조회한다'
);
select lives_ok(
  $$update public.record_guidelines set original_filename = 'updated.txt'
    where id = '93000000-0000-0000-0000-000000000003'$$,
  '사용자 A는 본인 기준자료를 수정한다'
);
select throws_ok(
  $$update public.record_guidelines
    set user_id = '92000000-0000-0000-0000-000000000002'
    where id = '93000000-0000-0000-0000-000000000003'$$,
  '42501',
  null,
  '사용자 A는 기준자료 소유자를 바꾸지 못한다'
);
select throws_ok(
  $$insert into public.record_guidelines (
      user_id, school_year, document_type, original_filename,
      mime_type, extracted_text, file_size
    ) values (
      '91000000-0000-0000-0000-000000000001',
      2026,
      'guide',
      'duplicate.txt',
      'text/plain',
      '중복 기준',
      16
    )$$,
  '23505',
  null,
  '사용자별 학년도와 자료 유형은 중복되지 않는다'
);
select throws_ok(
  $$insert into public.record_guidelines (
      user_id, school_year, document_type, original_filename,
      mime_type, extracted_text, file_size
    ) values (
      '91000000-0000-0000-0000-000000000001',
      2027,
      'guide',
      'student-data.txt',
      'text/plain',
      '학생 이름: 홍길동',
      24
    )$$,
  '23514',
  null,
  '학생 식별정보는 직접 데이터 API 쓰기에서도 차단된다'
);
select throws_ok(
  $$insert into public.record_guidelines (
      user_id, school_year, document_type, original_filename,
      mime_type, extracted_text, file_size
    ) values (
      '91000000-0000-0000-0000-000000000001',
      2028,
      'guide',
      'oversized-after-label.txt',
      'text/plain',
      repeat('가', 100000),
      300000
    )$$,
  '23514',
  null,
  'AI 전달용 라벨을 포함한 학년도 기준자료 길이를 제한한다'
);
select lives_ok(
  $$insert into public.record_guidelines (
      user_id, school_year, document_type, original_filename,
      mime_type, extracted_text, file_size
    ) values (
      '91000000-0000-0000-0000-000000000001',
      2029,
      'supplement',
      'exact-boundary.txt',
      'text/plain',
      repeat('가', 100000 - char_length('[공식 보완자료]') - 1),
      300000
    )$$,
  '라벨을 포함해 정확히 100,000자인 자료는 등록할 수 있다'
);
select throws_ok(
  $$update public.record_guidelines
    set document_type = 'guide'
    where user_id = '91000000-0000-0000-0000-000000000001'
      and school_year = 2029
      and document_type = 'supplement'$$,
  '23514',
  null,
  '자료 유형만 변경해도 라벨을 포함한 길이를 다시 검증한다'
);

select set_config(
  'request.jwt.claim.sub',
  '92000000-0000-0000-0000-000000000002',
  true
);
select is(
  (select count(*)::integer from public.record_guidelines),
  0,
  '사용자 B는 사용자 A 기준자료를 조회하지 못한다'
);
select is_empty(
  $$update public.record_guidelines set original_filename = 'other.txt'
    where id = '93000000-0000-0000-0000-000000000003' returning id$$,
  '사용자 B는 사용자 A 기준자료를 수정하지 못한다'
);
select is_empty(
  $$delete from public.record_guidelines
    where id = '93000000-0000-0000-0000-000000000003' returning id$$,
  '사용자 B는 사용자 A 기준자료를 삭제하지 못한다'
);
select throws_ok(
  $$insert into public.record_guidelines (
      user_id, school_year, document_type, original_filename,
      mime_type, extracted_text, file_size
    ) values (
      '91000000-0000-0000-0000-000000000001',
      2027,
      'guide',
      'forged.txt',
      'text/plain',
      '위조 기준',
      16
    )$$,
  '42501',
  null,
  '사용자 B는 사용자 A 소유 기준자료를 등록하지 못한다'
);

set local role anon;
select throws_ok(
  $$select * from public.record_guidelines$$,
  '42501',
  null,
  '비로그인 사용자는 기준자료를 조회하지 못한다'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-0000-0000-000000000001',
  true
);
select lives_ok(
  $$delete from public.record_guidelines
    where id = '93000000-0000-0000-0000-000000000003'$$,
  '사용자 A는 본인 기준자료를 삭제한다'
);

select * from finish();

rollback;
