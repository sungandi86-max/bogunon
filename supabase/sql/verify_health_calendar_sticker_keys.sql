with expected_health_keys(sticker_key) as (
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
expected_legacy_keys(sticker_key) as (
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
  select
    convalidated,
    pg_get_constraintdef(oid) as definition
  from pg_constraint
  where conrelid = 'public.calendar_stickers'::regclass
    and conname = 'calendar_stickers_sticker_key_check'
),
missing_health_keys as (
  select sticker_key
  from expected_health_keys
  where not exists (
    select 1
    from constraint_state
    where position(sticker_key in definition) > 0
  )
),
missing_legacy_keys as (
  select sticker_key
  from expected_legacy_keys
  where not exists (
    select 1
    from constraint_state
    where position(sticker_key in definition) > 0
  )
),
user_date_key_constraint as (
  select
    c.contype = 'u'
      and array_agg(a.attname order by keys.ordinality) = array['user_id', 'sticker_date', 'sticker_key']::name[] as exact_unique_constraint
  from pg_constraint c
  join unnest(c.conkey) with ordinality as keys(attnum, ordinality) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = keys.attnum
  where c.conrelid = 'public.calendar_stickers'::regclass
    and c.conname = 'calendar_stickers_user_date_key'
  group by c.oid, c.contype
),
user_date_key_index as (
  select
    i.indisunique
      and regexp_replace(pg_get_indexdef(index_class.oid), '\s+', ' ', 'g') like '%(user_id, sticker_date, sticker_key)%' as exact_unique_index
  from pg_class index_class
  join pg_index i on i.indexrelid = index_class.oid
  where index_class.relname = 'calendar_stickers_user_date_key'
    and i.indrelid = 'public.calendar_stickers'::regclass
)
select
  (select count(*) from expected_health_keys) as expected_health_key_count,
  (select count(*) from expected_legacy_keys) as expected_legacy_key_count,
  (select count(*) from missing_health_keys) = 0 as all_health_keys_allowed,
  (select array_agg(sticker_key order by sticker_key) from missing_health_keys) as missing_health_keys,
  (select count(*) from missing_legacy_keys) = 0 as all_legacy_keys_remain_allowed,
  (select array_agg(sticker_key order by sticker_key) from missing_legacy_keys) as missing_legacy_keys,
  (select bool_and(convalidated) from constraint_state) as sticker_key_constraint_validated,
  coalesce((select relrowsecurity from pg_class where oid = 'public.calendar_stickers'::regclass), false) as calendar_sticker_rls_enabled,
  coalesce((select bool_or(exact_unique_constraint) from user_date_key_constraint), false)
    or coalesce((select bool_or(exact_unique_index) from user_date_key_index), false) as user_date_key_exact_unique_enforcement_present,
  coalesce((select bool_or(exact_unique_constraint) from user_date_key_constraint), false) as user_date_key_exact_unique_constraint_present,
  coalesce((select bool_or(exact_unique_index) from user_date_key_index), false) as user_date_key_exact_unique_index_present;

select
  count(*) filter (where sticker_key like 'health.%') as health_rows,
  count(*) filter (where sticker_key like 'academic.%') as academic_rows,
  count(*) filter (where sticker_key like 'personal.%') as personal_rows,
  count(*) as total_rows
from public.calendar_stickers;
