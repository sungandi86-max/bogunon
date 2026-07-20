with constraint_state as (
  select convalidated, pg_get_constraintdef(oid) as definition
  from pg_constraint
  where conrelid = 'public.calendar_stickers'::regclass
    and conname = 'calendar_stickers_sticker_key_check'
), allowed_keys as (
  select (matches.match)[1] as sticker_key
  from constraint_state
  cross join lateral regexp_matches(definition, '''([^'']+)''(?:::text)?', 'g') as matches(match)
), duplicate_keys as (
  select sticker_key
  from allowed_keys
  group by sticker_key
  having count(*) > 1
)
select
  (select count(*) from constraint_state) = 1 as has_single_check,
  coalesce((select convalidated from constraint_state), false) as check_is_validated,
  exists(select 1 from allowed_keys where sticker_key = 'academic.club') as club_key_allowed,
  not exists(select 1 from duplicate_keys) as allowlist_has_no_duplicates,
  (select count(*) from allowed_keys) = 90 as allowlist_has_expected_size,
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.calendar_stickers'::regclass
      and conname = 'calendar_stickers_user_date_key'
      and contype = 'u'
  ) as duplicate_sticker_constraint_preserved,
  (select relrowsecurity from pg_class where oid = 'public.calendar_stickers'::regclass) as rls_enabled;
