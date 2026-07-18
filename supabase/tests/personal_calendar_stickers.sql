begin;
select plan(4);

select ok(exists(
  select 1 from pg_constraint
  where conrelid = 'public.calendar_stickers'::regclass
    and conname = 'calendar_stickers_sticker_key_check'
    and contype = 'c'
), 'calendar sticker key check exists');
select ok(
  pg_get_constraintdef(oid) like '%personal.hospital%'
    and pg_get_constraintdef(oid) like '%vacation-ceremony%',
  'calendar sticker key check accepts personal keys and preserves school keys'
)
from pg_constraint
where conrelid = 'public.calendar_stickers'::regclass
  and conname = 'calendar_stickers_sticker_key_check';
select is((select relrowsecurity from pg_class where oid = 'public.calendar_stickers'::regclass), true, 'calendar_stickers RLS remains enabled');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'calendar_stickers'), 4, 'existing own-user policies remain installed');

select * from finish();
rollback;
