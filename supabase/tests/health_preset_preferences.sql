begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('public', 'health_preset_preferences', '보건업무 프리셋 사용자 설정 테이블이 있다');
select is((select relrowsecurity from pg_class where oid = 'public.health_preset_preferences'::regclass), true, 'RLS가 활성화되어 있다');
select policies_are('public', 'health_preset_preferences', array[
  'health_preset_preferences_delete_own',
  'health_preset_preferences_insert_own',
  'health_preset_preferences_select_own',
  'health_preset_preferences_update_own'
], '소유자 CRUD 정책 네 개가 있다');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('72000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'preset-a@example.invalid', '', now(), now()),
  ('72000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'preset-b@example.invalid', '', now(), now())
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '72000000-0000-0000-0000-000000000001', true);
insert into public.health_preset_preferences (user_id, preset_id, favorite, hidden, sort_order)
values ('72000000-0000-0000-0000-000000000001', 'health-log', true, false, 0);
select is((select count(*)::integer from public.health_preset_preferences), 1, '사용자 A는 자기 설정을 조회한다');
select lives_ok($$update public.health_preset_preferences set hidden = true where preset_id = 'health-log'$$, '사용자 A는 자기 설정을 수정한다');

select set_config('request.jwt.claim.sub', '72000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.health_preset_preferences), 0, '사용자 B는 사용자 A 설정을 조회하지 못한다');
select throws_ok($$insert into public.health_preset_preferences (user_id, preset_id, sort_order) values ('72000000-0000-0000-0000-000000000001', 'health-newsletter', 1)$$, '42501', null, '사용자 B는 사용자 A 설정을 만들지 못한다');
select is((with changed as (update public.health_preset_preferences set favorite = false where user_id = '72000000-0000-0000-0000-000000000001' returning 1) select count(*)::integer from changed), 0, '사용자 B는 사용자 A 설정을 수정하지 못한다');
select is((with removed as (delete from public.health_preset_preferences where user_id = '72000000-0000-0000-0000-000000000001' returning 1) select count(*)::integer from removed), 0, '사용자 B는 사용자 A 설정을 삭제하지 못한다');

reset role;
set local role anon;
select throws_ok($$select * from public.health_preset_preferences$$, '42501', null, '비로그인 사용자는 설정을 조회하지 못한다');
select throws_ok($$insert into public.health_preset_preferences (user_id, preset_id, sort_order) values ('72000000-0000-0000-0000-000000000001', 'health-log', 0)$$, '42501', null, '비로그인 사용자는 설정을 만들지 못한다');

select * from finish();
rollback;
