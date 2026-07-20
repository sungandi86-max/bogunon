begin;
select plan(18);

select has_table('public', 'profiles');
select has_column('public', 'profiles', 'role');
select has_table('public', 'notices');
select has_column('public', 'notices', 'summary');
select has_table('public', 'notice_reads');
select is((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), true, 'profiles RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.notices'::regclass), true, 'notices RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.notice_reads'::regclass), true, 'notice reads RLS enabled');
select col_default_is('public', 'profiles', 'role', '''user''::text', 'new profiles default to user');
select col_is_fk('public', 'profiles', 'id');
select col_is_fk('public', 'notices', 'created_by');
select col_is_fk('public', 'notice_reads', 'user_id');
select has_index('public', 'notice_reads', 'notice_reads_pkey');
select has_policy('public', 'profiles', 'profiles_update_own');
select has_policy('public', 'notices', 'notices_select_visible');
select has_policy('public', 'notices', 'notices_insert_admin');
select has_policy('public', 'notices', 'notices_update_admin');
select has_policy('public', 'notice_reads', 'notice_reads_delete_own');

select * from finish();
rollback;
