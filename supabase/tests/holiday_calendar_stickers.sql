begin;
select plan(22);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('c3000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'holiday-calendar-sticker-a@example.invalid', '', now(), now(), now()),
  ('c4000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'holiday-calendar-sticker-b@example.invalid', '', now(), now(), now());

select is(
  (with constraint_state as (
    select pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
  ),
  allowed_constraint_keys as (
    select (matches.match)[1] as sticker_key
    from constraint_state
    cross join lateral regexp_matches(definition, '''([^'']+)''(?:::text)?', 'g') as matches(match)
  )
  select count(*) from allowed_constraint_keys),
  89::bigint,
  'calendar sticker key allowlist contains exactly 89 keys'
);

select is(
  (select count(*) from (
    values
      ('holiday.new-year'),
      ('holiday.march-first'),
      ('holiday.constitution-day'),
      ('holiday.buddhas-birthday'),
      ('holiday.labor-day'),
      ('holiday.childrens-day'),
      ('holiday.memorial-day'),
      ('holiday.liberation-day'),
      ('holiday.national-foundation-day'),
      ('holiday.hangul-day'),
      ('holiday.christmas'),
      ('holiday.seollal'),
      ('holiday.seollal-break'),
      ('holiday.chuseok'),
      ('holiday.chuseok-break'),
      ('holiday.substitute'),
      ('holiday.temporary'),
      ('holiday.election-day')
  ) as expected(sticker_key)),
  18::bigint,
  'holiday sticker migration adds exactly 18 new namespaced keys'
);

select is(
  (with expected_existing_keys(sticker_key) as (
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
      ('personal.other'),
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
  expected_holiday_keys(sticker_key) as (
    values
      ('holiday.new-year'),
      ('holiday.march-first'),
      ('holiday.constitution-day'),
      ('holiday.buddhas-birthday'),
      ('holiday.labor-day'),
      ('holiday.childrens-day'),
      ('holiday.memorial-day'),
      ('holiday.liberation-day'),
      ('holiday.national-foundation-day'),
      ('holiday.hangul-day'),
      ('holiday.christmas'),
      ('holiday.seollal'),
      ('holiday.seollal-break'),
      ('holiday.chuseok'),
      ('holiday.chuseok-break'),
      ('holiday.substitute'),
      ('holiday.temporary'),
      ('holiday.election-day')
  ),
  expected_allowed_keys(sticker_key) as (
    select sticker_key from expected_existing_keys
    union all
    select sticker_key from expected_holiday_keys
  ),
  constraint_state as (
    select pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
  ),
  allowed_constraint_keys as (
    select (matches.match)[1] as sticker_key
    from constraint_state
    cross join lateral regexp_matches(definition, '''([^'']+)''(?:::text)?', 'g') as matches(match)
  )
  select count(*)
  from expected_allowed_keys
  where not exists (
    select 1
    from allowed_constraint_keys
    where allowed_constraint_keys.sticker_key = expected_allowed_keys.sticker_key
  )),
  0::bigint,
  'all 89 expected sticker keys are allowed by the database constraint'
);

select is(
  (with expected_existing_keys(sticker_key) as (
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
      ('personal.other'),
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
  expected_holiday_keys(sticker_key) as (
    values
      ('holiday.new-year'),
      ('holiday.march-first'),
      ('holiday.constitution-day'),
      ('holiday.buddhas-birthday'),
      ('holiday.labor-day'),
      ('holiday.childrens-day'),
      ('holiday.memorial-day'),
      ('holiday.liberation-day'),
      ('holiday.national-foundation-day'),
      ('holiday.hangul-day'),
      ('holiday.christmas'),
      ('holiday.seollal'),
      ('holiday.seollal-break'),
      ('holiday.chuseok'),
      ('holiday.chuseok-break'),
      ('holiday.substitute'),
      ('holiday.temporary'),
      ('holiday.election-day')
  ),
  expected_allowed_keys(sticker_key) as (
    select sticker_key from expected_existing_keys
    union all
    select sticker_key from expected_holiday_keys
  ),
  constraint_state as (
    select pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
  ),
  allowed_constraint_keys as (
    select (matches.match)[1] as sticker_key
    from constraint_state
    cross join lateral regexp_matches(definition, '''([^'']+)''(?:::text)?', 'g') as matches(match)
  )
  select count(*)
  from allowed_constraint_keys
  where not exists (
    select 1
    from expected_allowed_keys
    where expected_allowed_keys.sticker_key = allowed_constraint_keys.sticker_key
  )),
  0::bigint,
  'no unexpected sticker keys are allowed by the database constraint'
);

select is(
  (with constraint_state as (
    select pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
  ),
  allowed_constraint_keys as (
    select (matches.match)[1] as sticker_key
    from constraint_state
    cross join lateral regexp_matches(definition, '''([^'']+)''(?:::text)?', 'g') as matches(match)
  )
  select count(*)
  from (
    select sticker_key
    from allowed_constraint_keys
    group by sticker_key
    having count(*) > 1
  ) as duplicates),
  0::bigint,
  'database constraint allowlist has no duplicate keys'
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
      ('personal.other'),
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
  ),
  allowed_constraint_keys as (
    select (matches.match)[1] as sticker_key
    from constraint_state
    cross join lateral regexp_matches(definition, '''([^'']+)''(?:::text)?', 'g') as matches(match)
  )
  select count(*)
  from expected
  where not exists (
    select 1
    from allowed_constraint_keys
    where allowed_constraint_keys.sticker_key = expected.sticker_key
  )),
  0::bigint,
  'all 71 pre-holiday sticker keys remain allowed'
);

select is(
  (with constraint_state as (
    select pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
  ),
  allowed_constraint_keys as (
    select (matches.match)[1] as sticker_key
    from constraint_state
    cross join lateral regexp_matches(definition, '''([^'']+)''(?:::text)?', 'g') as matches(match)
  )
  select count(*)
  from allowed_constraint_keys
  where sticker_key in ('holiday', 'long-weekend')),
  2::bigint,
  'legacy holiday and long-weekend keys remain allowed without namespace changes'
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

select ok(
  coalesce((
    select bool_or(
      c.contype = 'u'
        and cols.column_names = array['user_id', 'sticker_date', 'sticker_key']::name[]
    )
    from pg_constraint c
    cross join lateral (
      select array_agg(a.attname order by keys.ordinality) as column_names
      from unnest(c.conkey) with ordinality as keys(attnum, ordinality)
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = keys.attnum
    ) as cols
    where c.conrelid = 'public.calendar_stickers'::regclass
      and c.conname = 'calendar_stickers_user_date_key'
  ), false),
  'same user/date/key unique enforcement uses exactly user_id, sticker_date, and sticker_key'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c3000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$insert into public.calendar_stickers (id, user_id, sticker_key, sticker_date, label) values ('c5000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000001', 'holiday.hangul-day', '2026-10-09', 'Hangul Day')$$,
  'authenticated user can save an allowed holiday sticker key'
);

select throws_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('c3000000-0000-0000-0000-000000000001', 'holiday.not-allowed', '2026-10-10', 'Not Allowed')$$,
  '23514',
  null,
  'non-allowlisted holiday sticker key is rejected by the check constraint'
);

select throws_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('c3000000-0000-0000-0000-000000000001', 'holiday.hangul-day', '2026-10-09', 'Hangul Day')$$,
  '23505',
  null,
  'same user/date/holiday key cannot be duplicated'
);

select lives_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('c3000000-0000-0000-0000-000000000001', 'academic.sports-day', '2026-10-09', 'Sports Day')$$,
  'same user/date can keep an academic sticker beside a holiday sticker'
);

select lives_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('c3000000-0000-0000-0000-000000000001', 'health.student-checkup', '2026-10-09', 'Student Checkup')$$,
  'same user/date can keep a health sticker beside a holiday sticker'
);

select is(
  (select count(*) from public.calendar_stickers where sticker_date = '2026-10-09'),
  3::bigint,
  'academic, health, and holiday stickers coexist on the same date'
);

select lives_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('c3000000-0000-0000-0000-000000000001', 'holiday', '2026-10-11', 'Public Holiday')$$,
  'legacy holiday key remains insertable'
);

select lives_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('c3000000-0000-0000-0000-000000000001', 'long-weekend', '2026-10-12', 'Long Weekend')$$,
  'legacy long-weekend key remains insertable'
);

select set_config('request.jwt.claim.sub', 'c4000000-0000-0000-0000-000000000002', true);

select lives_ok(
  $$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('c4000000-0000-0000-0000-000000000002', 'holiday.hangul-day', '2026-10-09', 'Hangul Day')$$,
  'another user can save the same holiday key on the same date'
);

select * from finish();
rollback;
