begin;

select plan(24);

select has_table('public', 'health_support_instructors');
select has_table('public', 'health_support_work_logs');
select row_security_active('public.health_support_instructors');
select row_security_active('public.health_support_work_logs');
select col_is_fk('public', 'health_support_instructors', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'health_support_work_logs', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'health_support_work_logs', 'instructor_id', 'public', 'health_support_instructors', 'id');
select policies_are('public', 'health_support_instructors', array[
  'health_support_instructors_delete_own', 'health_support_instructors_insert_own',
  'health_support_instructors_select_own', 'health_support_instructors_update_own'
]);
select policies_are('public', 'health_support_work_logs', array[
  'health_support_work_logs_delete_own', 'health_support_work_logs_insert_own',
  'health_support_work_logs_select_own', 'health_support_work_logs_update_own'
]);
select table_privs_are('public', 'health_support_instructors', 'anon', array[]::text[]);
select table_privs_are('public', 'health_support_work_logs', 'anon', array[]::text[]);
select table_privs_are('public', 'health_support_instructors', 'authenticated', array['DELETE', 'INSERT', 'SELECT', 'UPDATE']);
select table_privs_are('public', 'health_support_work_logs', 'authenticated', array['DELETE', 'INSERT', 'SELECT', 'UPDATE']);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('a1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'health-support-a@example.invalid', '', now(), now(), now()),
  ('b2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'health-support-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$insert into public.health_support_instructors (
    id, user_id, name, subject, weekly_hours, hourly_rate, monthly_insurance,
    monthly_hour_limit, weekly_hour_limit, total_budget, operation_start_date, operation_end_date
  ) values (
    'a3000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001',
    'Instructor A', 'Health support', 10, 30000, 100000, 60, 15, 1000000,
    '2026-03-01', '2026-12-31'
  )$$,
  'owner can create an instructor'
);
select lives_ok(
  $$insert into public.health_support_work_logs (
    user_id, instructor_id, work_date, start_time, end_time, note
  ) values (
    'a1000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000003',
    '2026-08-18', '09:00', '12:00', 'source record'
  )$$,
  'owner can create a source work log'
);
select throws_ok(
  $$insert into public.health_support_work_logs (
    user_id, instructor_id, work_date, start_time, end_time
  ) values (
    'a1000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000003',
    '2026-08-18', '12:00', '12:00'
  )$$,
  '23514', null, 'non-increasing work time is rejected'
);

select set_config('request.jwt.claim.sub', 'b2000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.health_support_instructors), 0, 'second user cannot select first user instructor');
select is((select count(*)::integer from public.health_support_work_logs), 0, 'second user cannot select first user work log');
select throws_ok(
  $$insert into public.health_support_work_logs (
    user_id, instructor_id, work_date, start_time, end_time
  ) values (
    'b2000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000003',
    '2026-08-18', '09:00', '12:00'
  )$$,
  '23503', null, 'second user cannot link a log to another owner instructor'
);
select throws_ok(
  $$insert into public.health_support_instructors (
    user_id, name, subject, operation_start_date, operation_end_date
  ) values (
    'a1000000-0000-4000-8000-000000000001', 'Forged owner', 'Health support', '2026-03-01', '2026-12-31'
  )$$,
  '42501', null, 'second user cannot insert an instructor for the first user'
);
select is((with updated as (
  update public.health_support_instructors set name = 'Changed' where id = 'a3000000-0000-4000-8000-000000000003' returning id
) select count(*)::integer from updated), 0, 'second user cannot update first user instructor');
select is((with deleted as (
  delete from public.health_support_instructors where id = 'a3000000-0000-4000-8000-000000000003' returning id
) select count(*)::integer from deleted), 0, 'second user cannot delete first user instructor');
select is((with updated as (
  update public.health_support_work_logs set note = 'Changed' where user_id = 'a1000000-0000-4000-8000-000000000001' returning id
) select count(*)::integer from updated), 0, 'second user cannot update first user work log');
select is((with deleted as (
  delete from public.health_support_work_logs where user_id = 'a1000000-0000-4000-8000-000000000001' returning id
) select count(*)::integer from deleted), 0, 'second user cannot delete first user work log');

select * from finish();

rollback;
