begin;
select plan(87);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'exercise-v2-a@example.invalid', '', now(), now(), now()),
  ('a2000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'exercise-v2-b@example.invalid', '', now(), now(), now());

select has_column('public', 'exercise_logs', 'record_type', 'exercise_logs has record_type');
select col_type_is('public', 'exercise_logs', 'record_type', 'text', 'record_type is text');
select col_not_null('public', 'exercise_logs', 'record_type', 'record_type is required');
select col_default_is('public', 'exercise_logs', 'record_type', 'exercise', 'record_type defaults to exercise');
select is((select count(*) from pg_constraint where conname = 'exercise_logs_record_type_check'), 1::bigint, 'exercise_logs has the named record type check');
select has_table('public', 'exercise_lesson_reviews', 'lesson review table exists');
select has_table('public', 'exercise_competition_reviews', 'competition review table exists');
select col_is_pk('public', 'exercise_lesson_reviews', 'exercise_log_id', 'lesson review is one-to-one by exercise_log_id');
select col_is_pk('public', 'exercise_competition_reviews', 'exercise_log_id', 'competition review is one-to-one by exercise_log_id');
select is(
  (select pg_get_constraintdef(oid) from pg_constraint where conname = 'exercise_logs_id_record_type_key'),
  'UNIQUE (id, record_type)',
  'exercise_logs exposes the composite review parent key'
);
select is(
  (select pg_get_constraintdef(oid) from pg_constraint where conname = 'exercise_lesson_reviews_log_type_fkey'),
  'FOREIGN KEY (exercise_log_id, record_type) REFERENCES exercise_logs(id, record_type) ON DELETE CASCADE',
  'lesson review uses a composite type-safe cascading foreign key'
);
select is(
  (select pg_get_constraintdef(oid) from pg_constraint where conname = 'exercise_competition_reviews_log_type_fkey'),
  'FOREIGN KEY (exercise_log_id, record_type) REFERENCES exercise_logs(id, record_type) ON DELETE CASCADE',
  'competition review uses a composite type-safe cascading foreign key'
);
select has_column('public', 'exercise_lesson_reviews', 'record_type', 'lesson review has internal record_type');
select has_column('public', 'exercise_competition_reviews', 'record_type', 'competition review has internal record_type');
select col_not_null('public', 'exercise_lesson_reviews', 'record_type', 'lesson review type is required');
select col_not_null('public', 'exercise_competition_reviews', 'record_type', 'competition review type is required');
select col_default_is('public', 'exercise_lesson_reviews', 'record_type', 'lesson', 'lesson review type defaults to lesson');
select col_default_is('public', 'exercise_competition_reviews', 'record_type', 'competition', 'competition review type defaults to competition');
select is((select count(*) from pg_constraint where conname = 'exercise_lesson_reviews_record_type_check'), 1::bigint, 'lesson review has the named fixed type check');
select is((select count(*) from pg_constraint where conname = 'exercise_competition_reviews_record_type_check'), 1::bigint, 'competition review has the named fixed type check');
select is((select relrowsecurity from pg_class where oid = 'public.exercise_lesson_reviews'::regclass), true, 'lesson review RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.exercise_competition_reviews'::regclass), true, 'competition review RLS enabled');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'exercise_lesson_reviews'), 4, 'lesson review has four owner policies');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'exercise_competition_reviews'), 4, 'competition review has four owner policies');
select has_trigger('public', 'exercise_lesson_reviews', 'exercise_lesson_reviews_set_updated_at', 'lesson review updates timestamp');
select has_trigger('public', 'exercise_competition_reviews', 'exercise_competition_reviews_set_updated_at', 'competition review updates timestamp');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);

select lives_ok($$
  insert into public.exercise_logs (id, user_id, sticker_id, exercise_date, duration_minutes, note)
  values ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-21', 75, '기존 기록')
$$, 'record_type을 생략한 기존 형태의 입력을 유지한다');
select is((select record_type from public.exercise_logs where id = 'b1000000-0000-0000-0000-000000000001'), 'exercise', '기존 형태의 기록은 exercise 기본값을 사용한다');
select results_eq(
  $$select id, sticker_id, exercise_date, duration_minutes, note from public.exercise_logs where id = 'b1000000-0000-0000-0000-000000000001'$$,
  $$values ('b1000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, date '2026-07-21', 75, '기존 기록'::text)$$,
  '기존 ID, 스티커, 날짜, 운동 시간, 메모를 보존한다'
);
select lives_ok($$
  insert into public.exercise_logs (id, user_id, sticker_id, exercise_date, record_type)
  values
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-21', 'lesson'),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-21', 'competition')
$$, '같은 날짜와 스티커에 서로 다른 기록 유형이 공존한다');
select lives_ok($$
  insert into public.exercise_logs (id, user_id, sticker_id, exercise_date, record_type)
  values
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-22', 'lesson'),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-22', 'competition')
$$, '소유권과 제약 검증용 리뷰 없는 로그를 만든다');
select lives_ok($$
  insert into public.exercise_logs (id, user_id, sticker_id, exercise_date, record_type)
  values
    ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-23', 'lesson'),
    ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-24', 'competition')
$$, '부모 유형 변경 검증용 충돌 없는 로그를 만든다');
select throws_ok($$insert into public.exercise_logs (user_id, sticker_id, exercise_date, record_type) values ('a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-21', 'lesson')$$, '23505', null, '같은 유형은 중복할 수 없다');
select throws_ok($$insert into public.exercise_logs (user_id, sticker_id, exercise_date, record_type) values ('a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-22', 'invalid')$$, '23514', null, '허용하지 않는 기록 유형을 거부한다');
select throws_ok($$insert into public.exercise_logs (user_id, sticker_id, exercise_date, record_type) values ('a1000000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000001', date '2026-07-22', null)$$, '23502', null, 'NULL 기록 유형을 거부한다');

select lives_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, lesson_focus, learned, created_at, updated_at) values ('b1000000-0000-0000-0000-000000000002', '드라이브', '라켓 면 유지', now() - interval '1 minute', now() - interval '1 minute')$$, '레슨 기록에 레슨 리뷰를 만든다');
select lives_ok($$insert into public.exercise_competition_reviews (exercise_log_id, competition_name, event_category, total_games, wins, losses, final_result, created_at, updated_at) values ('b1000000-0000-0000-0000-000000000003', '여름 대회', '여자복식 40C', 4, 3, 1, '준우승', now() - interval '1 minute', now() - interval '1 minute')$$, '대회 기록에 대회 리뷰를 만든다');
select lives_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000006', '유형 변경 방어')$$, '부모 유형 변경 검증용 레슨 리뷰를 만든다');
select lives_ok($$insert into public.exercise_competition_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000007', '유형 변경 방어')$$, '부모 유형 변경 검증용 대회 리뷰를 만든다');
reset role;
select throws_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000001', '잘함')$$, '23503', null, '일반 운동에는 레슨 리뷰를 만들 수 없다');
select throws_ok($$insert into public.exercise_competition_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000002', '잘함')$$, '23503', null, '레슨에는 대회 리뷰를 만들 수 없다');
select throws_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000003', '잘함')$$, '23503', null, '대회에는 레슨 리뷰를 만들 수 없다');
select throws_ok($$update public.exercise_lesson_reviews set exercise_log_id = 'b1000000-0000-0000-0000-000000000003' where exercise_log_id = 'b1000000-0000-0000-0000-000000000002'$$, '23503', null, '레슨 리뷰의 부모를 대회 로그로 바꿀 수 없다');
select throws_ok($$update public.exercise_competition_reviews set exercise_log_id = 'b1000000-0000-0000-0000-000000000002' where exercise_log_id = 'b1000000-0000-0000-0000-000000000003'$$, '23503', null, '대회 리뷰의 부모를 레슨 로그로 바꿀 수 없다');
select throws_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, record_type, memo) values ('b1000000-0000-0000-0000-000000000004', 'competition', '잘못된 discriminator')$$, '23514', null, '레슨 리뷰의 내부 유형은 lesson으로 고정된다');
select throws_ok($$insert into public.exercise_competition_reviews (exercise_log_id, record_type, memo) values ('b1000000-0000-0000-0000-000000000005', 'lesson', '잘못된 discriminator')$$, '23514', null, '대회 리뷰의 내부 유형은 competition으로 고정된다');
select throws_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('ffffffff-ffff-ffff-ffff-ffffffffffff', '없음')$$, '23503', null, '존재하지 않는 부모 로그를 거부한다');
select throws_ok($$insert into public.exercise_competition_reviews (exercise_log_id, memo) values ('ffffffff-ffff-ffff-ffff-ffffffffffff', '없음')$$, '23503', null, '존재하지 않는 부모 로그의 대회 리뷰를 거부한다');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select throws_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000002', '중복')$$, '23505', null, '레슨 리뷰는 로그당 하나만 허용한다');
select throws_ok($$insert into public.exercise_competition_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000003', '중복')$$, '23505', null, '대회 리뷰는 로그당 하나만 허용한다');
select throws_ok($$update public.exercise_logs set record_type = 'competition' where id = 'b1000000-0000-0000-0000-000000000006'$$, '23503', null, '레슨 리뷰가 있으면 부모 유형을 바꿀 수 없다');
select throws_ok($$update public.exercise_logs set record_type = 'exercise' where id = 'b1000000-0000-0000-0000-000000000007'$$, '23503', null, '대회 리뷰가 있으면 부모 유형을 바꿀 수 없다');
select throws_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000004', '  ')$$, '23514', null, '공백뿐인 리뷰를 거부한다');
select throws_ok($$insert into public.exercise_competition_reviews (exercise_log_id) values ('b1000000-0000-0000-0000-000000000005')$$, '23514', null, '내용이 없는 대회 리뷰를 거부한다');
select throws_ok($$update public.exercise_competition_reviews set wins = 4, losses = 2, total_games = 5 where exercise_log_id = 'b1000000-0000-0000-0000-000000000003'$$, '23514', null, '승패 합계가 전체 경기보다 큰 값을 거부한다');
select throws_ok($$update public.exercise_competition_reviews set total_games = -1 where exercise_log_id = 'b1000000-0000-0000-0000-000000000003'$$, '23514', null, '음수 경기 수를 거부한다');
select lives_ok($$update public.exercise_lesson_reviews set coach_feedback = '스윙을 짧게' where exercise_log_id = 'b1000000-0000-0000-0000-000000000002'$$, '본인 레슨 리뷰를 수정한다');
select lives_ok($$update public.exercise_competition_reviews set strengths = '수비' where exercise_log_id = 'b1000000-0000-0000-0000-000000000003'$$, '본인 대회 리뷰를 수정한다');
select is((select updated_at > created_at from public.exercise_lesson_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000002'), true, '레슨 리뷰 수정 시 updated_at이 갱신된다');
select is((select updated_at > created_at from public.exercise_competition_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000003'), true, '대회 리뷰 수정 시 updated_at이 갱신된다');
select is((select count(*)::integer from public.exercise_lesson_reviews), 2, '본인 레슨 리뷰를 조회한다');
select is((select count(*)::integer from public.exercise_competition_reviews), 2, '본인 대회 리뷰를 조회한다');

select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.exercise_lesson_reviews), 0, '다른 사용자의 레슨 리뷰를 조회하지 못한다');
select is((select count(*)::integer from public.exercise_competition_reviews), 0, '다른 사용자의 대회 리뷰를 조회하지 못한다');
select throws_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000004', '침입')$$, '42501', null, '다른 사용자의 로그에 레슨 리뷰를 만들지 못한다');
select throws_ok($$insert into public.exercise_competition_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000005', '침입')$$, '42501', null, '다른 사용자의 로그에 대회 리뷰를 만들지 못한다');
select is_empty($$update public.exercise_lesson_reviews set memo = '침입' where exercise_log_id = 'b1000000-0000-0000-0000-000000000002' returning exercise_log_id$$, '다른 사용자의 레슨 리뷰를 수정하지 못한다');
select is_empty($$update public.exercise_competition_reviews set memo = '침입' where exercise_log_id = 'b1000000-0000-0000-0000-000000000003' returning exercise_log_id$$, '다른 사용자의 대회 리뷰를 수정하지 못한다');
select is_empty($$delete from public.exercise_lesson_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000002' returning exercise_log_id$$, '다른 사용자의 레슨 리뷰를 삭제하지 못한다');
select is_empty($$delete from public.exercise_competition_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000003' returning exercise_log_id$$, '다른 사용자의 대회 리뷰를 삭제하지 못한다');

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select lives_ok($$delete from public.exercise_lesson_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000002'$$, '본인 레슨 리뷰를 삭제한다');
select lives_ok($$delete from public.exercise_competition_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000003'$$, '본인 대회 리뷰를 삭제한다');
select lives_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000002', 'cascade')$$, 'Cascade 검증용 레슨 리뷰를 만든다');
select lives_ok($$delete from public.exercise_logs where id = 'b1000000-0000-0000-0000-000000000002'$$, '부모 레슨 로그를 삭제한다');
select is((select count(*)::integer from public.exercise_lesson_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000002'), 0, '부모 삭제 시 레슨 리뷰도 삭제된다');
select lives_ok($$insert into public.exercise_competition_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000003', 'cascade')$$, 'Cascade 검증용 대회 리뷰를 만든다');
select lives_ok($$delete from public.exercise_logs where id = 'b1000000-0000-0000-0000-000000000003'$$, '부모 대회 로그를 삭제한다');
select is((select count(*)::integer from public.exercise_competition_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000003'), 0, '부모 삭제 시 대회 리뷰도 삭제된다');
select results_eq(
  $$select id, sticker_id, duration_minutes, note, record_type from public.exercise_logs where id = 'b1000000-0000-0000-0000-000000000001'$$,
  $$values ('b1000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 75, '기존 기록'::text, 'exercise'::text)$$,
  '관련 없는 리뷰 작업 이후에도 기존 운동 기록의 ID, 스티커, 시간, 메모, 유형을 유지한다'
);

set local role anon;
select throws_ok($$select * from public.exercise_lesson_reviews$$, '42501', null, '비로그인 사용자는 레슨 리뷰를 조회하지 못한다');
select throws_ok($$select * from public.exercise_competition_reviews$$, '42501', null, '비로그인 사용자는 대회 리뷰를 조회하지 못한다');
select throws_ok($$insert into public.exercise_lesson_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000004', 'anon')$$, '42501', null, '비로그인 사용자는 레슨 리뷰를 만들지 못한다');
select throws_ok($$insert into public.exercise_competition_reviews (exercise_log_id, memo) values ('b1000000-0000-0000-0000-000000000005', 'anon')$$, '42501', null, '비로그인 사용자는 대회 리뷰를 만들지 못한다');
select throws_ok($$update public.exercise_lesson_reviews set memo = 'anon' where exercise_log_id = 'b1000000-0000-0000-0000-000000000004'$$, '42501', null, '비로그인 사용자는 레슨 리뷰를 수정하지 못한다');
select throws_ok($$update public.exercise_competition_reviews set memo = 'anon' where exercise_log_id = 'b1000000-0000-0000-0000-000000000005'$$, '42501', null, '비로그인 사용자는 대회 리뷰를 수정하지 못한다');
select throws_ok($$delete from public.exercise_lesson_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000004'$$, '42501', null, '비로그인 사용자는 레슨 리뷰를 삭제하지 못한다');
select throws_ok($$delete from public.exercise_competition_reviews where exercise_log_id = 'b1000000-0000-0000-0000-000000000005'$$, '42501', null, '비로그인 사용자는 대회 리뷰를 삭제하지 못한다');

select * from finish();
rollback;
