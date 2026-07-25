begin;

create unique index if not exists exercise_logs_event_id_unique
  on public.exercise_logs(event_id)
  where event_id is not null;

create or replace function public.validate_exercise_log_event_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  linked_event_type text;
begin
  if not exists (
    select 1
    from public.exercise_stickers
    where id = new.sticker_id
      and (user_id is null or user_id = new.user_id)
  ) then
    raise exception 'exercise sticker owner mismatch' using errcode = '23503';
  end if;

  if new.event_id is null then
    return new;
  end if;

  select event_type
    into linked_event_type
    from public.events
    where id = new.event_id
      and user_id = new.user_id;

  if linked_event_type is null or linked_event_type not in ('workout', 'tournament') then
    raise exception 'workout event owner or type mismatch' using errcode = '23503';
  end if;

  if (linked_event_type = 'workout' and new.record_type <> 'exercise')
    or (linked_event_type = 'tournament' and new.record_type <> 'competition') then
    raise exception 'workout event record type mismatch' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists exercise_logs_validate_event_owner on public.exercise_logs;
create trigger exercise_logs_validate_event_owner
before insert or update of event_id, user_id, sticker_id, record_type on public.exercise_logs
for each row execute function public.validate_exercise_log_event_owner();

revoke all on function public.validate_exercise_log_event_owner() from public, anon;
grant execute on function public.validate_exercise_log_event_owner() to authenticated;

commit;
