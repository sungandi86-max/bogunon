select 'table' as check_name, to_regclass('public.annual_planner_custom_items') is not null as ok;

select 'rls' as check_name, relrowsecurity as ok
from pg_class
where oid = 'public.annual_planner_custom_items'::regclass;

select 'policies' as check_name, count(*) = 4 as ok
from pg_policies
where schemaname = 'public' and tablename = 'annual_planner_custom_items';

select 'owner_index' as check_name, count(*) = 1 as ok
from pg_indexes
where schemaname = 'public'
  and tablename = 'annual_planner_custom_items'
  and indexname = 'annual_planner_custom_items_user_month_sort_idx';

select 'checklist_strings_only' as check_name,
  pg_get_constraintdef(oid) like '%jsonb_path_exists%' as ok
from pg_constraint
where conrelid = 'public.annual_planner_custom_items'::regclass
  and contype = 'c'
  and pg_get_constraintdef(oid) like '%checklist_json%';
