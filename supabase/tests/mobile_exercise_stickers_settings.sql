begin;
select plan(45);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('93000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mobile-settings-a@example.invalid', '', now(), now(), now()),
  ('94000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mobile-settings-b@example.invalid', '', now(), now(), now());

select has_table('public', 'exercise_stickers');
select has_table('public', 'exercise_logs');
select has_table('public', 'user_settings');
select is((select relrowsecurity from pg_class where oid = 'public.exercise_stickers'::regclass), true, 'exercise_stickers RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.exercise_logs'::regclass), true, 'exercise_logs RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.user_settings'::regclass), true, 'user_settings RLS enabled');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'exercise_stickers'), 4, 'exercise sticker policies');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'exercise_logs'), 4, 'exercise log policies');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'user_settings'), 4, 'settings policies');
select is((select count(*)::integer from public.exercise_stickers where user_id is null and is_default), 9, 'nine default stickers');
select has_index('public', 'exercise_logs', 'exercise_logs_user_date_idx');
select has_index('public', 'exercise_logs', 'exercise_logs_sticker_id_idx');
select has_index('public', 'exercise_stickers', 'exercise_stickers_default_icon_key');
select has_index('public', 'exercise_stickers', 'exercise_stickers_user_label_key');
select col_default_is('public', 'user_settings', 'default_event_minutes', '30');
select has_column('public', 'user_settings', 'neis_office_code');
select has_column('public', 'user_settings', 'neis_school_code');
select has_column('public', 'user_settings', 'neis_school_name');
select has_column('public', 'user_settings', 'neis_office_name');

set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000001', true);
select lives_ok($$insert into public.exercise_stickers (id, user_id, label, icon_key, color_key, is_default) values ('95000000-0000-0000-0000-000000000003', '93000000-0000-0000-0000-000000000001', '요가', 'stretching', 'lavender', false)$$, '사용자 A는 내 스티커를 만든다');
select lives_ok($$insert into public.exercise_logs (id, user_id, sticker_id, exercise_date) values ('96000000-0000-0000-0000-000000000004', '93000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', current_date)$$, '사용자 A는 기본 스티커 기록을 만든다');
select lives_ok($$insert into public.user_settings (id, user_id) values ('97000000-0000-0000-0000-000000000005', '93000000-0000-0000-0000-000000000001')$$, '사용자 A는 기본 설정을 만든다');
select lives_ok($$update public.user_settings set neis_office_code = 'B10', neis_school_code = '7010082', neis_school_name = '여의도고등학교', neis_office_name = '서울특별시교육청' where user_id = '93000000-0000-0000-0000-000000000001'$$, '사용자 A는 내 기본 학교를 저장한다');
select is((select count(*)::integer from public.exercise_stickers), 10, '사용자 A는 기본 스티커와 내 스티커를 조회한다');
select is((select count(*)::integer from public.exercise_logs), 1, '사용자 A는 내 운동 기록을 조회한다');
select is((select count(*)::integer from public.user_settings), 1, '사용자 A는 내 설정을 조회한다');
select throws_ok($$insert into public.exercise_logs (user_id, sticker_id, exercise_date) values ('93000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', current_date)$$, '23505', null, '같은 날짜의 같은 스티커를 중복 저장하지 않는다');
select throws_ok($$update public.exercise_stickers set user_id = '94000000-0000-0000-0000-000000000002' where id = '95000000-0000-0000-0000-000000000003'$$, '42501', null, '사용자 A는 스티커 소유자를 바꾸지 못한다');
select throws_ok($$update public.exercise_logs set user_id = '94000000-0000-0000-0000-000000000002' where id = '96000000-0000-0000-0000-000000000004'$$, '42501', null, '사용자 A는 운동 기록 소유자를 바꾸지 못한다');
select throws_ok($$update public.user_settings set user_id = '94000000-0000-0000-0000-000000000002' where id = '97000000-0000-0000-0000-000000000005'$$, '42501', null, '사용자 A는 설정 소유자를 바꾸지 못한다');

select set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.exercise_stickers), 9, '사용자 B는 기본 스티커만 조회한다');
select is((select count(*)::integer from public.exercise_logs), 0, '사용자 B는 사용자 A 운동 기록을 조회하지 못한다');
select is((select count(*)::integer from public.user_settings), 0, '사용자 B는 사용자 A 설정을 조회하지 못한다');
select throws_ok($$insert into public.exercise_stickers (user_id, label, icon_key, color_key) values ('93000000-0000-0000-0000-000000000001', '금지 스티커', 'other', 'cream')$$, '42501', null, '사용자 B는 사용자 A 소유 스티커를 만들지 못한다');
select throws_ok($$insert into public.exercise_logs (user_id, sticker_id, exercise_date) values ('94000000-0000-0000-0000-000000000002', '95000000-0000-0000-0000-000000000003', current_date)$$, '42501', null, '사용자 B는 사용자 A의 사용자 스티커로 기록하지 못한다');
select throws_ok($$insert into public.user_settings (user_id) values ('93000000-0000-0000-0000-000000000001')$$, '42501', null, '사용자 B는 사용자 A 설정을 만들지 못한다');
select is_empty($$update public.exercise_stickers set label = '다른 사용자 수정' where id = '95000000-0000-0000-0000-000000000003' returning id$$, '사용자 B는 사용자 A 스티커를 수정하지 못한다');
select is_empty($$update public.exercise_logs set note = '다른 사용자 수정' where id = '96000000-0000-0000-0000-000000000004' returning id$$, '사용자 B는 사용자 A 운동 기록을 수정하지 못한다');
select is_empty($$update public.user_settings set default_event_minutes = 60 where id = '97000000-0000-0000-0000-000000000005' returning id$$, '사용자 B는 사용자 A 설정을 수정하지 못한다');
select is_empty($$delete from public.exercise_stickers where id = '95000000-0000-0000-0000-000000000003' returning id$$, '사용자 B는 사용자 A 스티커를 삭제하지 못한다');
select is_empty($$delete from public.exercise_logs where id = '96000000-0000-0000-0000-000000000004' returning id$$, '사용자 B는 사용자 A 운동 기록을 삭제하지 못한다');
select is_empty($$delete from public.user_settings where id = '97000000-0000-0000-0000-000000000005' returning id$$, '사용자 B는 사용자 A 설정을 삭제하지 못한다');

set local role anon;
select throws_ok($$select * from public.exercise_stickers$$, '42501', null, '비로그인 사용자는 운동 스티커를 조회하지 못한다');
select throws_ok($$select * from public.exercise_logs$$, '42501', null, '비로그인 사용자는 운동 기록을 조회하지 못한다');
select throws_ok($$select * from public.user_settings$$, '42501', null, '비로그인 사용자는 설정을 조회하지 못한다');

select * from finish();
rollback;
