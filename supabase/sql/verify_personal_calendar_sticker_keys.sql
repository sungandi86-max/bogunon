select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition,
  convalidated as is_valid
from pg_constraint
where conrelid = 'public.calendar_stickers'::regclass
  and conname = 'calendar_stickers_sticker_key_check';

select
  relrowsecurity as rls_enabled
from pg_class
where oid = 'public.calendar_stickers'::regclass;

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'calendar_stickers'
order by policyname;
