select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(distinct p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in ('exercise_stickers', 'exercise_logs', 'user_settings')
group by c.relname, c.relrowsecurity
order by c.relname;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('exercise_stickers', 'exercise_logs', 'user_settings')
order by tablename, policyname;

select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in (
  'public.exercise_stickers'::regclass,
  'public.exercise_logs'::regclass,
  'public.user_settings'::regclass
)
order by table_name::text, conname;

select icon_key, label, color_key, display_order
from public.exercise_stickers
where user_id is null and is_default
order by display_order;
