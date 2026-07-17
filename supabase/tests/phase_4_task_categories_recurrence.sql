begin;

select plan(12);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('51000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase4-a@example.invalid', '', now(), now(), now()),
  ('52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase4-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '51000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$insert into public.tasks (id, user_id, title, area, category, scheduled_date, recurrence_frequency, recurrence_date, recurrence_generated_through)
    values ('53000000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000001', '약품 점검', 'healthWork', 'medication', '2026-07-17', 'monthly', '2026-07-17', '2026-07-17')$$,
  '사용자 A는 카테고리와 반복 주기를 가진 업무를 생성한다'
);
select is(
  (select category from public.tasks where id = '53000000-0000-0000-0000-000000000003'),
  'medication',
  '업무 카테고리를 저장한다'
);
select throws_ok(
  $$insert into public.tasks (user_id, title, area, category) values ('51000000-0000-0000-0000-000000000001', '잘못된 카테고리', 'healthWork', 'invalid')$$,
  '23514',
  null,
  '허용되지 않은 카테고리를 거부한다'
);
select throws_ok(
  $$insert into public.tasks (user_id, title, area, recurrence_frequency) values ('51000000-0000-0000-0000-000000000001', '기준일 없는 반복', 'healthWork', 'daily')$$,
  '23514',
  null,
  '수행일 없는 반복 업무를 거부한다'
);
select throws_ok(
  $$insert into public.tasks (user_id, title, area, scheduled_date, recurrence_frequency, recurrence_date)
    values ('51000000-0000-0000-0000-000000000001', '생성 경계 없는 원본', 'healthWork', '2026-07-17', 'daily', '2026-07-17')$$,
  '23514',
  null,
  '생성 완료일 없는 반복 원본을 거부한다'
);
select throws_ok(
  $$insert into public.tasks (user_id, title, area, scheduled_date, recurrence_source_id, recurrence_date)
    values ('51000000-0000-0000-0000-000000000001', '주기 없는 반복 발생', 'healthWork', '2026-08-18', '53000000-0000-0000-0000-000000000003', '2026-08-18')$$,
  '23514',
  null,
  '반복 주기 없이 원본을 참조하는 부분 반복 상태를 거부한다'
);
select throws_ok(
  $$insert into public.tasks (user_id, title, area, recurrence_date)
    values ('51000000-0000-0000-0000-000000000001', '주기 없는 반복 날짜', 'healthWork', '2026-08-19')$$,
  '23514',
  null,
  '반복 주기 없이 발생일만 지정한 부분 반복 상태를 거부한다'
);
select throws_ok(
  $$insert into public.tasks (user_id, title, area, scheduled_date, recurrence_frequency, recurrence_source_id)
    values ('51000000-0000-0000-0000-000000000001', '발생일 없는 반복 발생', 'healthWork', '2026-08-20', 'daily', '53000000-0000-0000-0000-000000000003')$$,
  '23514',
  null,
  '발생일 없이 원본과 주기만 지정한 부분 반복 상태를 거부한다'
);
select lives_ok(
  $$insert into public.tasks (user_id, title, area, category, scheduled_date, recurrence_frequency, recurrence_source_id, recurrence_date)
    values ('51000000-0000-0000-0000-000000000001', '약품 점검', 'healthWork', 'medication', '2026-08-17', 'monthly', '53000000-0000-0000-0000-000000000003', '2026-08-17')$$,
  '사용자 A는 자기 반복 원본의 다음 업무를 생성한다'
);
select throws_ok(
  $$insert into public.tasks (user_id, title, area, category, scheduled_date, recurrence_frequency, recurrence_source_id, recurrence_date)
    values ('51000000-0000-0000-0000-000000000001', '중복 약품 점검', 'healthWork', 'medication', '2026-08-17', 'monthly', '53000000-0000-0000-0000-000000000003', '2026-08-17')$$,
  '23505',
  null,
  '같은 반복 발생일의 중복 업무를 거부한다'
);

select set_config('request.jwt.claim.sub', '52000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.tasks), 0, '사용자 B는 사용자 A 반복 업무를 조회하지 못한다');
select throws_ok(
  $$insert into public.tasks (user_id, title, area, category, scheduled_date, recurrence_frequency, recurrence_source_id, recurrence_date)
    values ('52000000-0000-0000-0000-000000000002', '다른 사용자 원본 참조', 'healthWork', 'medication', '2026-09-17', 'monthly', '53000000-0000-0000-0000-000000000003', '2026-09-17')$$,
  '23503',
  null,
  '다른 사용자의 반복 원본을 참조하지 못한다'
);

select * from finish();
rollback;
