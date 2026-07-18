select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(distinct p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname = 'calendar_stickers'
group by c.relname, c.relrowsecurity;

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'calendar_stickers'
order by policyname;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.calendar_stickers'::regclass
order by conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'calendar_stickers'
order by indexname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'calendar_stickers'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

select tgname, pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'public.calendar_stickers'::regclass
  and not tgisinternal;
