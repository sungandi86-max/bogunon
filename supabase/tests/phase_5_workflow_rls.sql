begin;

select plan(27);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('61000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-a@example.invalid', '', now(), now(), now()),
  ('62000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-b@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);

insert into public.tasks (id, user_id, title, area) values
  ('63000000-0000-0000-0000-000000000003', '61000000-0000-0000-0000-000000000001', '약품 점검', 'healthWork');
insert into public.events (id, user_id, title, area, start_date, end_date) values
  ('64000000-0000-0000-0000-000000000004', '61000000-0000-0000-0000-000000000001', '보건교육', 'schoolSchedule', current_date, current_date);
insert into public.task_templates (id, user_id, name, category, title) values
  ('65000000-0000-0000-0000-000000000005', '61000000-0000-0000-0000-000000000001', '월간 점검', 'medication', '약품 및 응급물품 점검');

select lives_ok($$insert into public.task_template_checklist_items (user_id, template_id, title, position) values ('61000000-0000-0000-0000-000000000001', '65000000-0000-0000-0000-000000000005', '재고 확인', 0)$$, '템플릿 체크리스트를 생성한다');
select lives_ok($$insert into public.task_checklist_items (user_id, task_id, title, position) values ('61000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000003', '유효기간 확인', 0)$$, '업무 체크리스트를 생성한다');
select lives_ok($$insert into public.task_links (user_id, task_id, title, url) values ('61000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000003', '업무 자료', 'https://example.invalid/task')$$, '업무 링크를 생성한다');
select lives_ok($$insert into public.event_links (user_id, event_id, title, url) values ('61000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000004', '교육 자료', 'https://example.invalid/event')$$, '일정 링크를 생성한다');
select lives_ok($$insert into public.task_reminders (user_id, task_id, reference_type, offset_minutes) values ('61000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000003', 'due', 1440)$$, '업무 알림을 저장한다');
select lives_ok($$insert into public.event_reminders (user_id, event_id, offset_minutes) values ('61000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000004', 0)$$, '일정 알림을 저장한다');
select throws_ok($$insert into public.task_links (user_id, task_id, title, url) values ('61000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000003', '잘못된 링크', 'javascript:alert(1)')$$, '23514', null, 'HTTP가 아닌 링크를 거부한다');

select is((select count(*)::integer from public.task_templates), 1, '사용자 A는 자기 템플릿을 조회한다');
select is((select count(*)::integer from public.task_template_checklist_items), 1, '사용자 A는 템플릿 체크리스트를 조회한다');
select is((select count(*)::integer from public.task_checklist_items), 1, '사용자 A는 업무 체크리스트를 조회한다');
select is((select count(*)::integer from public.task_links), 1, '사용자 A는 업무 링크를 조회한다');
select is((select count(*)::integer from public.event_links), 1, '사용자 A는 일정 링크를 조회한다');
select is((select count(*)::integer from public.task_reminders), 1, '사용자 A는 업무 알림을 조회한다');
select is((select count(*)::integer from public.event_reminders), 1, '사용자 A는 일정 알림을 조회한다');

select set_config('request.jwt.claim.sub', '62000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.task_templates), 0, '사용자 B는 사용자 A 템플릿을 조회하지 못한다');
select is((select count(*)::integer from public.task_template_checklist_items), 0, '사용자 B는 사용자 A 템플릿 체크리스트를 조회하지 못한다');
select is((select count(*)::integer from public.task_checklist_items), 0, '사용자 B는 사용자 A 체크리스트를 조회하지 못한다');
select is((select count(*)::integer from public.task_links), 0, '사용자 B는 사용자 A 업무 링크를 조회하지 못한다');
select is((select count(*)::integer from public.event_links), 0, '사용자 B는 사용자 A 일정 링크를 조회하지 못한다');
select is((select count(*)::integer from public.task_reminders), 0, '사용자 B는 사용자 A 업무 알림을 조회하지 못한다');
select is((select count(*)::integer from public.event_reminders), 0, '사용자 B는 사용자 A 일정 알림을 조회하지 못한다');
select throws_ok($$insert into public.task_checklist_items (user_id, task_id, title, position) values ('61000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000003', '다른 사용자 항목', 1)$$, '42501', null, '사용자 B는 사용자 A 소유 체크리스트를 만들지 못한다');
select throws_ok($$insert into public.task_templates (user_id, name, title) values ('61000000-0000-0000-0000-000000000001', '다른 사용자 템플릿', '금지')$$, '42501', null, '사용자 B는 사용자 A 소유 템플릿을 만들지 못한다');

set local role anon;
select throws_ok($$select * from public.task_templates$$, '42501', null, '비로그인 사용자는 템플릿을 조회하지 못한다');
select throws_ok($$select * from public.task_checklist_items$$, '42501', null, '비로그인 사용자는 체크리스트를 조회하지 못한다');
select throws_ok($$select * from public.task_links$$, '42501', null, '비로그인 사용자는 링크를 조회하지 못한다');
select throws_ok($$select * from public.task_reminders$$, '42501', null, '비로그인 사용자는 알림을 조회하지 못한다');

select * from finish();
rollback;
