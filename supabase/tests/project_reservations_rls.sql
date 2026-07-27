begin;

select plan(25);

select has_table('public', 'project_reservations');
select row_security_active('public.project_reservations');
select col_is_fk('public', 'project_reservations', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'project_reservations', 'project_id', 'public', 'projects', 'id');
select col_is_fk('public', 'project_reservations', 'linked_event_id', 'public', 'events', 'id');
select policies_are(
  'public',
  'project_reservations',
  array[
    'project_reservations_delete_own',
    'project_reservations_insert_own',
    'project_reservations_select_own',
    'project_reservations_update_own'
  ]
);
select table_privs_are('public', 'project_reservations', 'anon', array[]::text[]);
select table_privs_are(
  'public',
  'project_reservations',
  'authenticated',
  array['SELECT']
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('a1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reservation-a@example.invalid', '', now(), now(), now()),
  ('a2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reservation-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
insert into public.projects (id, user_id, name, icon, color)
values (
  'a3000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000001',
  '제주 여행',
  'calendar',
  'mint'
);

select lives_ok(
  $$select public.save_project_reservation(
    null,
    jsonb_build_object(
      'project_id', 'a3000000-0000-4000-8000-000000000003',
      'type', 'flight',
      'title', '김포 → 제주',
      'reservation_date', '2026-08-04',
      'start_time', '09:00',
      'end_time', '10:10',
      'company', '제주항공',
      'confirmation_number', 'ABC123',
      'location', '김포공항'
    ),
    true
  )$$,
  '본인 프로젝트에 예약과 일정을 생성한다'
);
select is((select count(*)::integer from public.project_reservations), 1, '본인 예약을 조회한다');
select is((select count(*)::integer from public.events where project_id = 'a3000000-0000-4000-8000-000000000003'), 1, '연결 일정을 한 개 생성한다');
select is((select title from public.events where project_id = 'a3000000-0000-4000-8000-000000000003'), '김포 → 제주', '예약 제목을 일정에 반영한다');
select isnt(
  (select coalesce(memo, '') || coalesce(description, '') from public.events where project_id = 'a3000000-0000-4000-8000-000000000003'),
  'ABC123',
  '예약번호를 일정 본문에 복제하지 않는다'
);

select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.project_reservations), 0, '다른 사용자 예약을 조회하지 못한다');
select throws_ok(
  $$select public.save_project_reservation(
    null,
    jsonb_build_object(
      'project_id', 'a3000000-0000-4000-8000-000000000003',
      'type', 'hotel',
      'title', '위조 예약',
      'reservation_date', '2026-08-05'
    ),
    false
  )$$,
  '42501',
  null,
  '다른 사용자 프로젝트에 예약을 만들지 못한다'
);
select throws_ok(
  $$select public.delete_project_reservation(
    (select id from public.project_reservations where user_id = 'a1000000-0000-4000-8000-000000000001'),
    true
  )$$,
  'P0002',
  null,
  '다른 사용자 예약을 삭제하지 못한다'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.save_project_reservation(
    (select id from public.project_reservations limit 1),
    jsonb_build_object(
      'project_id', 'a3000000-0000-4000-8000-000000000003',
      'type', 'flight',
      'title', '김포 → 제주 변경',
      'reservation_date', '2026-08-05',
      'start_time', '10:00',
      'end_time', '11:10',
      'location', '김포공항'
    ),
    true
  )$$,
  '예약과 연결 일정을 함께 수정한다'
);
select is((select title from public.events where project_id = 'a3000000-0000-4000-8000-000000000003'), '김포 → 제주 변경', '연결 일정 제목을 갱신한다');
select is((select start_date::text from public.events where project_id = 'a3000000-0000-4000-8000-000000000003'), '2026-08-05', '연결 일정 날짜를 갱신한다');

select lives_ok(
  $$select public.delete_project_reservation(
    (select id from public.project_reservations limit 1),
    false
  )$$,
  '연결 일정은 남기고 예약만 삭제한다'
);
select is((select count(*)::integer from public.project_reservations), 0, '예약만 삭제된다');
select is((select count(*)::integer from public.events where project_id = 'a3000000-0000-4000-8000-000000000003'), 1, '사용자가 남긴 연결 일정은 유지된다');

select public.save_project_reservation(
  null,
  jsonb_build_object(
    'project_id', 'a3000000-0000-4000-8000-000000000003',
    'type', 'hotel',
    'title', 'MJ Resort',
    'reservation_date', '2026-08-05'
  ),
  true
);
select lives_ok(
  $$select public.delete_project_reservation(
    (select id from public.project_reservations limit 1),
    true
  )$$,
  '예약과 연결 일정을 함께 삭제한다'
);
select is((select count(*)::integer from public.events where title = 'MJ Resort'), 0, '선택한 연결 일정도 삭제된다');

select public.save_project_reservation(
  null,
  jsonb_build_object(
    'project_id', 'a3000000-0000-4000-8000-000000000003',
    'type', 'custom',
    'title', '프로젝트 삭제 테스트',
    'reservation_date', '2026-08-06'
  ),
  false
);
set local role postgres;
delete from public.projects where id = 'a3000000-0000-4000-8000-000000000003';
select is((select count(*)::integer from public.project_reservations), 0, '프로젝트 삭제 시 예약도 삭제한다');

select * from finish();
rollback;
