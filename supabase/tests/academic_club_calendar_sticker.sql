begin;

select plan(5);

select ok(
  position('academic.club' in pg_get_constraintdef(oid)) > 0,
  'academic club key is allowed'
)
from pg_constraint
where conrelid = 'public.calendar_stickers'::regclass
  and conname = 'calendar_stickers_sticker_key_check';

select ok(
  (select convalidated from pg_constraint where conrelid = 'public.calendar_stickers'::regclass and conname = 'calendar_stickers_sticker_key_check'),
  'sticker key check remains validated'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.calendar_stickers'::regclass),
  'calendar sticker RLS remains enabled'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_user_date_key'
      and contype = 'u'
  ),
  'same-user same-date same-key unique constraint remains enabled'
);

select is(
  (select count(*)::integer from (
    select (matches.match)[1] as sticker_key
    from pg_constraint
    cross join lateral regexp_matches(pg_get_constraintdef(oid), '''([^'']+)''(?:::text)?', 'g') as matches(match)
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_sticker_key_check'
    group by (matches.match)[1]
    having count(*) > 1
  ) duplicates),
  0,
  'sticker allowlist contains no duplicate keys'
);

select * from finish();
rollback;
