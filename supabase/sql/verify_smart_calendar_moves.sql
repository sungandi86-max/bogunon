select
  p.oid::regprocedure::text as function_name,
  p.prosecdef as security_definer,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'move_calendar_item'
  and pg_get_function_identity_arguments(p.oid) = 'p_kind text, p_item_id uuid, p_new_date date, p_scope text';
