begin;

alter table public.events
  add column if not exists practical_schedule_origin text;

alter table public.events
  drop constraint if exists events_practical_schedule_origin_check;

alter table public.events
  add constraint events_practical_schedule_origin_check
  check (practical_schedule_origin is null or practical_schedule_origin in ('projected', 'linked_existing'));

alter table public.health_practical_schedules
  add column if not exists sticker_key text;

alter table public.events
  drop constraint if exists events_practical_schedule_id_fkey;

alter table public.events
  add constraint events_practical_schedule_id_fkey
  foreign key (practical_schedule_id)
  references public.health_practical_schedules(id)
  on delete set null;

create or replace function public.enforce_practical_schedule_event_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.practical_schedule_id is not null
     and not exists (
       select 1
       from public.health_practical_schedules schedule
       where schedule.id = new.practical_schedule_id
         and schedule.user_id = new.user_id
     ) then
    raise exception 'event and practical schedule must belong to the same user';
  end if;
  return new;
end;
$$;

drop trigger if exists events_practical_schedule_owner on public.events;

create trigger events_practical_schedule_owner
before insert or update of user_id, practical_schedule_id on public.events
for each row execute function public.enforce_practical_schedule_event_owner();

update public.events
set practical_schedule_origin = 'projected'
where practical_schedule_id is not null
  and practical_schedule_origin is null;

create index if not exists events_practical_schedule_origin_idx
  on public.events(user_id, practical_schedule_origin)
  where practical_schedule_id is not null;

commit;
