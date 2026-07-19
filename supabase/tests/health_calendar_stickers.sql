begin;
select plan(14);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('b3000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'health-calendar-sticker-a@example.invalid', '', now(), now(), now()),
  ('b4000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'health-calendar-sticker-b@example.invalid', '', now(), now(), now());

select is(
  (select count(*) from (
    values
      ('health.student-checkup'),
      ('health.urine-test'),
      ('health.tuberculosis-test'),
      ('health.vision-test'),
      ('health.oral-checkup'),
      ('health.health-survey'),
      ('health.vaccination-check'),
      ('health.cpr-training'),
      ('health.first-aid-training'),
      ('health.sex-education'),
      ('health.smoking-prevention'),
      ('health.alcohol-prevention'),
      ('health.drug-misuse-prevention'),
      ('health.infection-prevention'),
      ('health.life-respect-education'),
      ('health.obesity-prevention'),
      ('health.aed-check'),
      ('health.medicine-check'),
      ('health.emergency-kit-check'),
      ('health.health-room-check'),
      ('health.medical-waste-check'),
      ('health.health-log'),
      ('health.supply-purchase'),
      ('health.health-committee'),
      ('health.statistics-report'),
      ('health.official-document'),
      ('health.family-letter'),
      ('health.teacher-cooperation')
  ) as expected(sticker_key)),
  28::bigint,
  'health sticker key allowlist contains exactly 28 expected keys'
);

select is(
  (with expected(sticker_key) as (
    values
      ('health.student-checkup'),
      ('health.urine-test'),
      ('health.tuberculosis-test'),
      ('health.vision-test'),
      ('health.oral-checkup'),
      ('health.health-survey'),
      ('health.vaccination-check'),
      ('health.cpr-training'),
      ('health.first-aid-training'),
      ('health.sex-education'),
      ('health.smoking-prevention'),
      ('health.alcohol-prevention'),
      ('health.drug-misuse-prevention'),
      ('health.infection-prevention'),
      ('health.life-respect-education'),
      ('health.obesity-prevention'),
      ('health.aed-check'),
      ('health.medicine-check'),
      ('health.emergency-kit-check'),
      ('health.health-room-check'),
      ('health.medical-waste-check'),
      ('health.health-log'),
      ('health.supply-purchase'),
      ('health.health-committee'),
      ('health.statistics-report'),
      ('health.official-document'),
      ('health.family-letter'),
      ('health.teacher-cooperation')
  ),
  constraint_state as (
    select pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
  )
  select count(*)
  from expected
  where not exists (
    select 1
    from constraint_state
    where position(sticker_key in definition) > 0
  )),
  0::bigint,
  'all 28 health sticker keys are allowed by the database constraint'
);

select is(
  (with expected(sticker_key) as (
    values
      ('holiday'),
      ('long-weekend'),
      ('flexible-curriculum'),
      ('other'),
      ('opening-ceremony'),
      ('vacation-ceremony'),
      ('exam-period'),
      ('school-event'),
      ('school-closure'),
      ('staff-training'),
      ('academic.admission'),
      ('academic.semester-end'),
      ('academic.graduation'),
      ('academic.summer-break'),
      ('academic.winter-break'),
      ('academic.diagnostic-assessment'),
      ('academic.midterm'),
      ('academic.final'),
      ('academic.performance-assessment'),
      ('academic.parent-meeting'),
      ('academic.sports-day'),
      ('academic.school-festival'),
      ('academic.field-trip'),
      ('academic.school-trip'),
      ('academic.graduation-photo'),
      ('academic.school-orientation'),
      ('academic.principal-discretionary-holiday'),
      ('academic.substitute-holiday'),
      ('academic.vacation-camp'),
      ('academic.supplementary-class'),
      ('academic.curriculum-review'),
      ('personal.hospital'),
      ('personal.hair-salon'),
      ('personal.appointment'),
      ('personal.travel'),
      ('personal.date'),
      ('personal.family'),
      ('personal.birthday'),
      ('personal.grocery'),
      ('personal.dining'),
      ('personal.culture'),
      ('personal.workout-meetup'),
      ('personal.other')
  ),
  constraint_state as (
    select pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
  )
  select count(*)
  from expected
  where not exists (
    select 1
    from constraint_state
    where position(sticker_key in definition) > 0
  )),
  0::bigint,
  'all legacy school, academic, and personal sticker keys remain allowed'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
      and contype = 'c'
  ),
  'calendar sticker key check constraint remains present'
);

select is(
  (select convalidated from pg_constraint where conrelid = 'public.calendar_stickers'::regclass and conname = 'calendar_stickers_sticker_key_check'),
  true,
  'calendar sticker key constraint is validated'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.calendar_stickers'::regclass),
  true,
  'calendar sticker RLS remains enabled'
);

select has_index(
  'public',
  'calendar_stickers',
  'calendar_stickers_user_date_key',
  'same user/date/key unique index remains present'
);

select is(
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'calendar_stickers'),
  4::bigint,
  'calendar sticker RLS policy count is unchanged'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b3000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$insert into public.calendar_stickers (id, user_id, sticker_key, sticker_date, label) values ('b5000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000001', 'health.student-checkup', '2026-07-21', '학생건강검진')$$,
  'authenticated user can save an allowed health sticker key'
);

select throws_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('b3000000-0000-0000-0000-000000000001', 'health.not-allowed', '2026-07-22', '허용되지 않은 보건 스티커')$$,
  '23514',
  null,
  'non-allowlisted health sticker key is rejected by the check constraint'
);

select throws_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('b3000000-0000-0000-0000-000000000001', 'health.student-checkup', '2026-07-21', '학생건강검진')$$,
  '23505',
  null,
  'same user/date/health key cannot be duplicated'
);

select lives_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('b3000000-0000-0000-0000-000000000001', 'academic.sports-day', '2026-07-23', '체육대회')$$,
  'existing academic sticker key remains insertable'
);

select lives_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('b3000000-0000-0000-0000-000000000001', 'personal.hospital', '2026-07-24', '병원')$$,
  'existing personal sticker key remains insertable'
);

select lives_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('b3000000-0000-0000-0000-000000000001', 'vacation-ceremony', '2026-07-25', '방학식')$$,
  'legacy school sticker key remains insertable'
);

select * from finish();
rollback;
