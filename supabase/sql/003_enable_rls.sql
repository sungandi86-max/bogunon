begin;

do $$
begin
  if to_regclass('public.tasks') is not null then
    alter table public.tasks enable row level security;
    revoke all on table public.tasks from anon;
    grant select, insert, update, delete on table public.tasks to authenticated;
  end if;

  if to_regclass('public.events') is not null then
    alter table public.events enable row level security;
    revoke all on table public.events from anon;
    grant select, insert, update, delete on table public.events to authenticated;
  end if;
end;
$$;

commit;
