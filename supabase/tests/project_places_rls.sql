begin;
select plan(12);
select has_table('public', 'project_places');
select row_security_active('public.project_places');
select col_is_fk('public', 'project_places', 'user_id', 'auth', 'users', 'id');
select col_is_fk('public', 'project_places', 'project_id', 'public', 'projects', 'id');
select col_is_fk('public', 'project_places', 'event_id', 'public', 'events', 'id');
select col_is_fk('public', 'project_places', 'reservation_id', 'public', 'project_reservations', 'id');
select policies_are('public', 'project_places', array[
  'project_places_delete_own', 'project_places_insert_own',
  'project_places_select_own', 'project_places_update_own'
]);
select table_privs_are('public', 'project_places', 'anon', array[]::text[]);
select table_privs_are('public', 'project_places', 'authenticated', array['DELETE', 'INSERT', 'SELECT', 'UPDATE']);
select has_function('public', 'reorder_project_places', array['uuid', 'uuid[]']);
select function_privs_are('public', 'reorder_project_places', array['uuid', 'uuid[]'], 'anon', array[]::text[]);
select function_privs_are('public', 'reorder_project_places', array['uuid', 'uuid[]'], 'authenticated', array['EXECUTE']);
select * from finish();
rollback;
