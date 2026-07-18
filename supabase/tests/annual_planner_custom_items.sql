begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_table('public', 'annual_planner_custom_items', '연간 플래너 사용자 항목 테이블이 있다');
select is((select relrowsecurity from pg_class where oid = 'public.annual_planner_custom_items'::regclass), true, 'RLS가 활성화되어 있다');
select policies_are('public', 'annual_planner_custom_items', array[
  'annual_planner_custom_items_delete_own',
  'annual_planner_custom_items_insert_own',
  'annual_planner_custom_items_select_own',
  'annual_planner_custom_items_update_own'
], '소유자 CRUD 정책 네 개가 있다');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'annual-a@example.invalid', '', now(), now()),
  ('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'annual-b@example.invalid', '', now(), now())
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
insert into public.annual_planner_custom_items (user_id, month, title, item_kind, checklist_json)
values ('71000000-0000-0000-0000-000000000001', 5, 'QA 연간 업무', 'task', '["일정 확인"]');
select is((select count(*)::integer from public.annual_planner_custom_items), 1, '사용자 A는 자기 항목을 조회한다');
select lives_ok($$update public.annual_planner_custom_items set title = '수정된 연간 업무' where user_id = '71000000-0000-0000-0000-000000000001'$$, '사용자 A는 자기 항목을 수정한다');
select throws_ok($$insert into public.annual_planner_custom_items (user_id, month, title, item_kind, checklist_json) values ('71000000-0000-0000-0000-000000000001', 5, '잘못된 체크리스트', 'task', '[1]')$$, '23514', null, '문자열이 아닌 체크리스트 항목을 거부한다');

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.annual_planner_custom_items), 0, '사용자 B는 사용자 A 항목을 조회하지 못한다');
select throws_ok($$insert into public.annual_planner_custom_items (user_id, month, title, item_kind) values ('71000000-0000-0000-0000-000000000001', 6, '교차 사용자 항목', 'task')$$, '42501', null, '사용자 B는 사용자 A 항목을 만들지 못한다');
select is((with changed as (update public.annual_planner_custom_items set title = '교차 수정' where user_id = '71000000-0000-0000-0000-000000000001' returning 1) select count(*)::integer from changed), 0, '사용자 B는 사용자 A 항목을 수정하지 못한다');
select is((with removed as (delete from public.annual_planner_custom_items where user_id = '71000000-0000-0000-0000-000000000001' returning 1) select count(*)::integer from removed), 0, '사용자 B는 사용자 A 항목을 삭제하지 못한다');

reset role;
set local role anon;
select throws_ok($$select * from public.annual_planner_custom_items$$, '42501', null, '비로그인 사용자는 테이블을 조회하지 못한다');
select throws_ok($$insert into public.annual_planner_custom_items (user_id, month, title, item_kind) values ('71000000-0000-0000-0000-000000000001', 7, '비로그인 항목', 'task')$$, '42501', null, '비로그인 사용자는 항목을 만들지 못한다');

select * from finish();
rollback;
