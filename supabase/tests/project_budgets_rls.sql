begin;

select plan(43);

select has_table('public', 'project_budgets');
select has_table('public', 'project_expenses');
select row_security_active('public.project_budgets');
select row_security_active('public.project_expenses');
select col_is_fk('public', 'project_budgets', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'project_budgets', 'project_id', 'public', 'projects', 'id');
select col_is_fk('public', 'project_expenses', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'project_expenses', 'project_id', 'public', 'projects', 'id');
select col_is_fk('public', 'project_expenses', 'reservation_id', 'public', 'project_reservations', 'id');
select policies_are(
  'public',
  'project_budgets',
  array[
    'project_budgets_delete_own',
    'project_budgets_insert_own',
    'project_budgets_select_own',
    'project_budgets_update_own'
  ]
);
select policies_are(
  'public',
  'project_expenses',
  array[
    'project_expenses_delete_own',
    'project_expenses_insert_own',
    'project_expenses_select_own',
    'project_expenses_update_own'
  ]
);
select table_privs_are('public', 'project_budgets', 'anon', array[]::text[]);
select table_privs_are('public', 'project_budgets', 'authenticated', array['SELECT']);
select table_privs_are('public', 'project_expenses', 'anon', array[]::text[]);
select table_privs_are('public', 'project_expenses', 'authenticated', array['SELECT']);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('b1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'budget-a@example.invalid', '', now(), now(), now()),
  ('b2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'budget-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
insert into public.projects (id, user_id, name, icon, color)
values (
  'b3000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000001',
  '제주 여행',
  'calendar',
  'mint'
);

select lives_ok(
  $$select public.save_project_budget(
    'b3000000-0000-4000-8000-000000000003',
    600000,
    'KRW',
    null
  )$$,
  '본인 프로젝트 예산을 저장한다'
);
select is((select count(*)::integer from public.project_budgets), 1, '프로젝트 예산은 한 건이다');
select lives_ok(
  $$select public.save_project_budget(
    'b3000000-0000-4000-8000-000000000003',
    650000,
    'KRW',
    '수정'
  )$$,
  '같은 프로젝트 예산을 수정한다'
);
select is((select count(*)::integer from public.project_budgets), 1, '예산 수정은 중복 행을 만들지 않는다');
select is((select budget_amount from public.project_budgets), 650000::bigint, '수정된 예산 금액을 저장한다');
select throws_ok(
  $$select public.save_project_budget(
    'b3000000-0000-4000-8000-000000000003',
    -1,
    'KRW',
    null
  )$$,
  '23514',
  null,
  '음수 예산을 차단한다'
);

select lives_ok(
  $$select public.save_project_reservation_with_expense(
    null,
    jsonb_build_object(
      'project_id', 'b3000000-0000-4000-8000-000000000003',
      'type', 'flight',
      'title', '김포 → 제주',
      'reservation_date', '2026-08-04'
    ),
    false,
    true,
    true,
    jsonb_build_object(
      'title', '항공권',
      'category', 'transportation',
      'amount', 120000,
      'expense_date', '2026-08-04',
      'payment_status', 'paid'
    )
  )$$,
  '예약과 연결 지출을 원자적으로 생성한다'
);
select is((select count(*)::integer from public.project_expenses), 1, '연결 지출을 한 건 생성한다');
select isnt((select reservation_id from public.project_expenses), null, '지출에 예약을 연결한다');
select is((select category from public.project_expenses), 'transportation', '추천 지출 카테고리를 저장한다');

select lives_ok(
  $$select public.save_project_reservation_with_expense(
    (select id from public.project_reservations limit 1),
    jsonb_build_object(
      'project_id', 'b3000000-0000-4000-8000-000000000003',
      'type', 'flight',
      'title', '김포 → 제주 변경',
      'reservation_date', '2026-08-05'
    ),
    false,
    true,
    true,
    jsonb_build_object(
      'title', '항공권 변경',
      'category', 'transportation',
      'amount', 130000,
      'expense_date', '2026-08-05',
      'payment_status', 'paid'
    )
  )$$,
  '예약 수정 시 같은 연결 지출을 갱신한다'
);
select is((select count(*)::integer from public.project_expenses), 1, '예약 수정은 지출을 중복 생성하지 않는다');
select is((select amount from public.project_expenses), 130000::bigint, '연결 지출 금액을 갱신한다');
insert into public.projects (id, user_id, name, icon, color)
values (
  'b5000000-0000-4000-8000-000000000005',
  'b1000000-0000-4000-8000-000000000001',
  '같은 사용자의 다른 프로젝트',
  'calendar',
  'coral'
);
select throws_ok(
  $$select public.save_project_reservation(
    (select id from public.project_reservations limit 1),
    jsonb_build_object(
      'project_id', 'b5000000-0000-4000-8000-000000000005',
      'type', 'flight',
      'title', '프로젝트 이동 시도',
      'reservation_date', '2026-08-05'
    ),
    false
  )$$,
  '23514',
  null,
  '연결 지출이 있는 예약을 다른 본인 프로젝트로 옮기지 못한다'
);
select throws_ok(
  $$select public.save_project_reservation_with_expense(
    (select id from public.project_reservations limit 1),
    jsonb_build_object(
      'project_id', 'b5000000-0000-4000-8000-000000000005',
      'type', 'flight',
      'title', '연결 지출 미갱신 이동 시도',
      'reservation_date', '2026-08-05'
    ),
    false,
    true,
    false,
    jsonb_build_object(
      'title', '항공권',
      'category', 'transportation',
      'amount', 130000,
      'expense_date', '2026-08-05',
      'payment_status', 'paid'
    )
  )$$,
  '23514',
  null,
  '지출 갱신을 끈 래퍼도 프로젝트 불일치를 만들지 못한다'
);
select set_config(
  'test.budget_reservation_id',
  (select id::text from public.project_reservations limit 1),
  true
);

select set_config('request.jwt.claim.sub', 'b2000000-0000-4000-8000-000000000002', true);
insert into public.projects (id, user_id, name, icon, color)
values (
  'b4000000-0000-4000-8000-000000000004',
  'b2000000-0000-4000-8000-000000000002',
  '다른 사용자 프로젝트',
  'calendar',
  'blue'
);
select is((select count(*)::integer from public.project_budgets), 0, '다른 사용자 예산을 조회하지 못한다');
select is((select count(*)::integer from public.project_expenses), 0, '다른 사용자 지출을 조회하지 못한다');
select throws_ok(
  $$select public.save_project_budget(
    'b3000000-0000-4000-8000-000000000003',
    1,
    'KRW',
    null
  )$$,
  '42501',
  null,
  '다른 사용자 프로젝트 예산을 저장하지 못한다'
);
select throws_ok(
  $$select public.save_project_expense(
    null,
    jsonb_build_object(
      'project_id', 'b3000000-0000-4000-8000-000000000003',
      'reservation_id', (
        select id from public.project_reservations
        where user_id = 'b1000000-0000-4000-8000-000000000001'
        limit 1
      ),
      'title', '위조 지출',
      'category', 'other',
      'amount', 1,
      'expense_date', '2026-08-05',
      'payment_status', 'planned'
    )
  )$$,
  '42501',
  null,
  '다른 사용자 프로젝트와 예약에 지출을 만들지 못한다'
);
select throws_ok(
  $$select public.save_project_expense(
    null,
    jsonb_build_object(
      'project_id', 'b4000000-0000-4000-8000-000000000004',
      'reservation_id', current_setting('test.budget_reservation_id'),
      'title', '예약 위조 지출',
      'category', 'other',
      'amount', 1,
      'expense_date', '2026-08-05',
      'payment_status', 'planned'
    )
  )$$,
  '42501',
  null,
  '본인 프로젝트 지출에도 다른 사용자 예약을 연결하지 못한다'
);

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.delete_project_reservation_with_expense(
    (select id from public.project_reservations limit 1),
    false,
    false
  )$$,
  '예약을 삭제하고 연결 지출은 유지한다'
);
select is((select count(*)::integer from public.project_expenses), 1, '예약 삭제 후 지출을 유지한다');
select is((select reservation_id from public.project_expenses), null, '유지한 지출의 예약 연결을 해제한다');

select lives_ok(
  $$select public.save_project_reservation_with_expense(
    null,
    jsonb_build_object(
      'project_id', 'b3000000-0000-4000-8000-000000000003',
      'type', 'hotel',
      'title', 'MJ Resort',
      'reservation_date', '2026-08-06'
    ),
    false,
    true,
    true,
    jsonb_build_object(
      'title', 'MJ Resort',
      'category', 'accommodation',
      'amount', 180000,
      'expense_date', '2026-08-06',
      'payment_status', 'planned'
    )
  )$$,
  '삭제 선택 검증용 예약과 지출을 생성한다'
);
select lives_ok(
  $$select public.delete_project_reservation_with_expense(
    (select id from public.project_reservations where title = 'MJ Resort'),
    false,
    true
  )$$,
  '예약과 연결 지출을 함께 삭제한다'
);
select is((select count(*)::integer from public.project_expenses where title = 'MJ Resort'), 0, '선택한 연결 지출을 삭제한다');

set local role postgres;
delete from public.projects where id = 'b3000000-0000-4000-8000-000000000003';
select is((select count(*)::integer from public.project_budgets), 0, '프로젝트 삭제 시 예산도 삭제한다');
select is((select count(*)::integer from public.project_expenses), 0, '프로젝트 삭제 시 지출도 삭제한다');

select * from finish();
rollback;
