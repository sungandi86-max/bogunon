begin;

alter table public.user_settings
  add column if not exists neis_office_code text,
  add column if not exists neis_school_code text,
  add column if not exists neis_school_name text,
  add column if not exists neis_office_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_settings_neis_default_school_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
      add constraint user_settings_neis_default_school_check check (
        (
          neis_office_code is null
          and neis_school_code is null
          and neis_school_name is null
          and neis_office_name is null
        )
        or (
          neis_office_code is not null
          and neis_school_code is not null
          and neis_school_name is not null
          and neis_office_name is not null
          and neis_office_code = btrim(neis_office_code)
          and neis_office_code <> ''
          and char_length(neis_office_code) <= 20
          and neis_school_code = btrim(neis_school_code)
          and neis_school_code <> ''
          and char_length(neis_school_code) <= 30
          and neis_school_name = btrim(neis_school_name)
          and neis_school_name <> ''
          and char_length(neis_school_name) <= 100
          and neis_office_name = btrim(neis_office_name)
          and neis_office_name <> ''
          and char_length(neis_office_name) <= 100
        )
      );
  end if;
end
$$;

comment on column public.user_settings.neis_office_code is 'Default NEIS education office code for the authenticated user';
comment on column public.user_settings.neis_school_code is 'Default NEIS school code for the authenticated user';
comment on column public.user_settings.neis_school_name is 'Default NEIS school display name for the authenticated user';
comment on column public.user_settings.neis_office_name is 'Default NEIS education office display name for the authenticated user';

commit;
