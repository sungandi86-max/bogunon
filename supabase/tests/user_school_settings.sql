begin;

select plan(10);

select has_column('public', 'user_settings', 'neis_school_level');
select has_column('public', 'user_settings', 'neis_region');
select has_column('public', 'user_settings', 'neis_address');
select has_column('public', 'user_settings', 'school_latitude');
select has_column('public', 'user_settings', 'school_longitude');
select has_column('public', 'user_settings', 'meal_enabled');
select has_column('public', 'user_settings', 'weather_enabled');
select row_security_active('public.user_settings');
select policies_are(
  'public',
  'user_settings',
  array[
    'user_settings_delete_own',
    'user_settings_insert_own',
    'user_settings_select_own',
    'user_settings_update_own'
  ]
);
select col_default_is('public', 'user_settings', 'meal_enabled', 'true');

select * from finish();

rollback;
