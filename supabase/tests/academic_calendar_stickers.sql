begin;
select plan(5);

select ok(
  position('academic.admission' in pg_get_constraintdef(oid)) > 0,
  'academic namespace keys are allowed'
)
from pg_constraint
where conrelid = 'public.calendar_stickers'::regclass
  and conname = 'calendar_stickers_sticker_key_check';

select ok(
  position('personal.hospital' in pg_get_constraintdef(oid)) > 0,
  'personal sticker keys remain allowed'
)
from pg_constraint
where conrelid = 'public.calendar_stickers'::regclass
  and conname = 'calendar_stickers_sticker_key_check';

select ok(
  position('opening-ceremony' in pg_get_constraintdef(oid)) > 0,
  'legacy school keys remain allowed'
)
from pg_constraint
where conrelid = 'public.calendar_stickers'::regclass
  and conname = 'calendar_stickers_sticker_key_check';

select is((select relrowsecurity from pg_class where oid = 'public.calendar_stickers'::regclass), true, 'calendar sticker RLS remains enabled');
select has_index('public', 'calendar_stickers', 'calendar_stickers_user_date_key');

select * from finish();
rollback;
