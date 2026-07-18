begin;
select plan(31);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('a3000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'calendar-sticker-a@example.invalid', '', now(), now(), now()),
  ('a4000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'calendar-sticker-b@example.invalid', '', now(), now(), now());

select has_table('public', 'calendar_stickers');
select has_column('public', 'calendar_stickers', 'id');
select has_column('public', 'calendar_stickers', 'user_id');
select has_column('public', 'calendar_stickers', 'sticker_key');
select has_column('public', 'calendar_stickers', 'sticker_date');
select has_column('public', 'calendar_stickers', 'end_date');
select has_column('public', 'calendar_stickers', 'label');
select has_column('public', 'calendar_stickers', 'note');
select has_column('public', 'calendar_stickers', 'created_at');
select has_column('public', 'calendar_stickers', 'updated_at');
select is((select relrowsecurity from pg_class where oid = 'public.calendar_stickers'::regclass), true, 'calendar_stickers RLS enabled');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'calendar_stickers'), 4, 'four own-user policies');
select has_index('public', 'calendar_stickers', 'calendar_stickers_user_date_key');
select has_index('public', 'calendar_stickers', 'calendar_stickers_user_start_date_idx');
select has_index('public', 'calendar_stickers', 'calendar_stickers_user_end_date_idx');
select has_trigger('public', 'calendar_stickers', 'calendar_stickers_set_updated_at');
select ok(exists (
  select 1 from pg_constraint
  where conrelid = 'public.calendar_stickers'::regclass
    and conname = 'calendar_stickers_date_range_check'
), 'date range check exists');
select ok(exists (
  select 1 from pg_constraint
  where conrelid = 'public.calendar_stickers'::regclass
    and conname = 'calendar_stickers_user_date_key'
), 'user/date/key unique constraint exists');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a3000000-0000-0000-0000-000000000001', true);
select lives_ok($$insert into public.calendar_stickers (id, user_id, sticker_key, sticker_date, end_date, label) values ('a5000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000001', 'vacation-ceremony', '2026-07-10', '2026-07-20', '방학식')$$, 'user A creates an owned range sticker');
select is((select count(*)::integer from public.calendar_stickers), 1, 'user A sees the owned sticker');
select is((select count(*)::integer from public.calendar_stickers where sticker_date <= '2026-07-12' and coalesce(end_date, sticker_date) >= '2026-07-12'), 1, 'inclusive overlap includes a spanning sticker');
select throws_ok($$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('a3000000-0000-0000-0000-000000000001', 'vacation-ceremony', '2026-07-10', '방학식')$$, '23505', null, 'same user/date/key cannot be duplicated');
select throws_ok($$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, end_date, label) values ('a3000000-0000-0000-0000-000000000001', 'exam-period', '2026-07-20', '2026-07-19', '시험기간')$$, '23514', null, 'end date cannot precede start date');
select throws_ok($$update public.calendar_stickers set user_id = 'a4000000-0000-0000-0000-000000000002' where id = 'a5000000-0000-0000-0000-000000000003'$$, '42501', null, 'user A cannot transfer ownership');
select lives_ok($$update public.calendar_stickers set note = '여름방학' where id = 'a5000000-0000-0000-0000-000000000003'$$, 'user A updates an owned sticker');

select set_config('request.jwt.claim.sub', 'a4000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.calendar_stickers), 0, 'user B cannot see user A rows');
select throws_ok($$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('a3000000-0000-0000-0000-000000000001', 'exam-period', '2026-07-21', '시험기간')$$, '42501', null, 'user B cannot insert for user A');
select is_empty($$update public.calendar_stickers set note = '다른 사용자 수정' where id = 'a5000000-0000-0000-0000-000000000003' returning id$$, 'user B cannot update user A rows');
select is_empty($$delete from public.calendar_stickers where id = 'a5000000-0000-0000-0000-000000000003' returning id$$, 'user B cannot delete user A rows');
select lives_ok($$insert into public.calendar_stickers (user_id, sticker_key, sticker_date, label) values ('a4000000-0000-0000-0000-000000000002', 'exam-period', '2026-07-21', '시험기간')$$, 'user B creates an owned sticker');

set local role anon;
select throws_ok($$select * from public.calendar_stickers$$, '42501', null, 'anonymous role has no table access');

select * from finish();
rollback;
