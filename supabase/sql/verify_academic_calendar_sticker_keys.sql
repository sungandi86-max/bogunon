select
  conname,
  convalidated,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.calendar_stickers'::regclass
  and conname = 'calendar_stickers_sticker_key_check';

select
  count(*) filter (where sticker_key like 'academic.%') as academic_rows,
  count(*) as total_rows
from public.calendar_stickers;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'calendar_stickers'
  and indexname = 'calendar_stickers_user_date_key';
