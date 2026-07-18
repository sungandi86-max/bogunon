select 'table' as check_name, to_regclass('public.health_preset_preferences') is not null as ok;

select 'rls' as check_name, relrowsecurity as ok
from pg_class
where oid = 'public.health_preset_preferences'::regclass;

select 'policies' as check_name, count(*) = 4 as ok
from pg_policies
where schemaname = 'public' and tablename = 'health_preset_preferences';

select 'unique_preferences' as check_name, count(*) = 2 as ok
from pg_constraint
where conrelid = 'public.health_preset_preferences'::regclass and contype = 'u';

select 'updated_at_trigger' as check_name, count(*) = 1 as ok
from pg_trigger
where tgrelid = 'public.health_preset_preferences'::regclass
  and tgname = 'health_preset_preferences_set_updated_at'
  and not tgisinternal;
