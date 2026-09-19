begin;

select plan(13);

select has_table('public', 'school_health_desk_settings');
select row_security_active('public.school_health_desk_settings');
select col_is_fk('public', 'school_health_desk_settings', 'user_id', 'auth', 'users', 'id');
select policies_are('public', 'school_health_desk_settings', array[
  'school_health_desk_settings_delete_own',
  'school_health_desk_settings_insert_own',
  'school_health_desk_settings_select_own',
  'school_health_desk_settings_update_own'
]);
select table_privs_are('public', 'school_health_desk_settings', 'anon', array[]::text[]);
select table_privs_are(
  'public',
  'school_health_desk_settings',
  'authenticated',
  array['DELETE', 'INSERT', 'SELECT', 'UPDATE']
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  (
    'd1000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'school-health-desk-a@example.invalid', '',
    now(), now(), now()
  ),
  (
    'd2000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'school-health-desk-b@example.invalid', '',
    now(), now(), now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$insert into public.school_health_desk_settings (user_id, settings_version, settings)
    values (
      'd1000000-0000-4000-8000-000000000001',
      1,
      '{"workspace":{},"dock":{},"launcherLinks":{}}'::jsonb
    )$$,
  'owner can create account settings'
);
select is(
  (select count(*)::integer from public.school_health_desk_settings),
  1,
  'owner can select account settings'
);

select set_config('request.jwt.claim.sub', 'd2000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.school_health_desk_settings),
  0,
  'second user cannot select first user settings'
);
select throws_ok(
  $$insert into public.school_health_desk_settings (user_id, settings_version, settings)
    values (
      'd1000000-0000-4000-8000-000000000001',
      1,
      '{"workspace":{},"dock":{},"launcherLinks":{}}'::jsonb
    )$$,
  '42501',
  null,
  'second user cannot insert settings for the first user'
);
select is(
  (with updated as (
    update public.school_health_desk_settings
    set settings = '{"blocked":true}'::jsonb
    where user_id = 'd1000000-0000-4000-8000-000000000001'
    returning user_id
  ) select count(*)::integer from updated),
  0,
  'second user cannot update first user settings'
);
select is(
  (with deleted as (
    delete from public.school_health_desk_settings
    where user_id = 'd1000000-0000-4000-8000-000000000001'
    returning user_id
  ) select count(*)::integer from deleted),
  0,
  'second user cannot delete first user settings'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.school_health_desk_settings$$,
  '42501',
  null,
  'signed-out clients cannot access account settings'
);

select * from finish();

rollback;
