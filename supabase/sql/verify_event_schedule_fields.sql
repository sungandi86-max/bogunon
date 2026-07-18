select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'events'
  and column_name in ('location','color_key','recurrence_frequency','recurrence_source_id','recurrence_date','recurrence_generated_through')
order by column_name;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.events'::regclass
  and conname in ('events_color_key_check','events_recurrence_frequency_check','events_recurrence_shape_check')
order by conname;

select p.proname, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'save_event_bundle_v2';
