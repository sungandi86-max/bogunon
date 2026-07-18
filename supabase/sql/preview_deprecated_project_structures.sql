select
  to_regclass('public.projects') as projects_table,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name in ('project_id', 'linked_project_id')
  ) as task_project_link_exists;

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('projects', 'tasks')
  and (table_name = 'projects' or column_name in ('project_id', 'linked_project_id'))
order by table_name, ordinal_position;

select
  id,
  user_id,
  title,
  status,
  category,
  scheduled_date,
  due_date,
  created_at
from public.tasks
where area = 'project'
order by user_id, created_at, id;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and (tablename = 'projects' or policyname ilike '%project%')
order by tablename, policyname;

select n.nspname as schema_name, p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname ilike '%project%'
order by p.proname;
