begin;

select plan(23);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-a@example.invalid', '', now(), now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-b@example.invalid', '', now(), now(), now());

insert into public.tasks (id, user_id, title, area, status, priority)
values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'A 업무', 'healthWork', 'planned', 'normal');
insert into public.events (id, user_id, title, area, start_date, end_date)
values ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'A 일정', 'schoolSchedule', current_date, current_date);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.tasks), 1, '사용자 A는 자기 업무를 조회한다');
select is((select count(*)::integer from public.events), 1, '사용자 A는 자기 일정을 조회한다');
select lives_ok($$update public.tasks set title = 'A 업무 수정' where id = '30000000-0000-0000-0000-000000000003'$$, '사용자 A는 자기 업무를 수정한다');
select lives_ok($$update public.events set title = 'A 일정 수정' where id = '40000000-0000-0000-0000-000000000004'$$, '사용자 A는 자기 일정을 수정한다');
select throws_ok($$update public.tasks set user_id = '20000000-0000-0000-0000-000000000002' where id = '30000000-0000-0000-0000-000000000003'$$, '42501', null, '사용자 A는 업무 소유자를 바꾸지 못한다');

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.tasks), 0, '사용자 B는 사용자 A 업무를 조회하지 못한다');
select is((select count(*)::integer from public.events), 0, '사용자 B는 사용자 A 일정을 조회하지 못한다');
select is_empty($$update public.tasks set title = 'B 업무 수정' where id = '30000000-0000-0000-0000-000000000003' returning id$$, '사용자 B는 사용자 A 업무를 수정하지 못한다');
select is_empty($$update public.events set title = 'B 일정 수정' where id = '40000000-0000-0000-0000-000000000004' returning id$$, '사용자 B는 사용자 A 일정을 수정하지 못한다');
select is_empty($$delete from public.tasks where id = '30000000-0000-0000-0000-000000000003' returning id$$, '사용자 B는 사용자 A 업무를 삭제하지 못한다');
select is_empty($$delete from public.events where id = '40000000-0000-0000-0000-000000000004' returning id$$, '사용자 B는 사용자 A 일정을 삭제하지 못한다');
select throws_ok($$insert into public.tasks (user_id, title, area) values ('10000000-0000-0000-0000-000000000001', '잘못된 소유 업무', 'healthWork')$$, '42501', null, '사용자 B는 사용자 A 소유 업무를 생성하지 못한다');
select throws_ok($$insert into public.events (user_id, title, area, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', '잘못된 소유 일정', 'personal', current_date, current_date)$$, '42501', null, '사용자 B는 사용자 A 소유 일정을 생성하지 못한다');

set local role anon;
select throws_ok($$select * from public.tasks$$, '42501', null, '비로그인 사용자는 업무를 조회하지 못한다');
select throws_ok($$select * from public.events$$, '42501', null, '비로그인 사용자는 일정을 조회하지 못한다');
select throws_ok($$insert into public.tasks (user_id, title, area) values ('10000000-0000-0000-0000-000000000001', '익명 업무', 'healthWork')$$, '42501', null, '비로그인 사용자는 업무를 생성하지 못한다');
select throws_ok($$insert into public.events (user_id, title, area, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', '익명 일정', 'personal', current_date, current_date)$$, '42501', null, '비로그인 사용자는 일정을 생성하지 못한다');
select throws_ok($$update public.tasks set title = '익명 수정'$$, '42501', null, '비로그인 사용자는 업무를 수정하지 못한다');
select throws_ok($$update public.events set title = '익명 수정'$$, '42501', null, '비로그인 사용자는 일정을 수정하지 못한다');
select throws_ok($$delete from public.tasks$$, '42501', null, '비로그인 사용자는 업무를 삭제하지 못한다');
select throws_ok($$delete from public.events$$, '42501', null, '비로그인 사용자는 일정을 삭제하지 못한다');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok($$delete from public.tasks where id = '30000000-0000-0000-0000-000000000003'$$, '사용자 A는 자기 업무를 삭제한다');
select lives_ok($$delete from public.events where id = '40000000-0000-0000-0000-000000000004'$$, '사용자 A는 자기 일정을 삭제한다');

select * from finish();
rollback;
