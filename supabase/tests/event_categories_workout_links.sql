begin;
select plan(14);

select has_column('public', 'events', 'event_type', 'events has event_type');
select has_column('public', 'events', 'event_details', 'events has structured details');
select has_column('public', 'exercise_logs', 'event_id', 'workout records can reference an event');
select has_index('public', 'events', 'events_user_type_start_idx', 'event category lookup is indexed');
select has_index('public', 'exercise_logs', 'exercise_logs_event_id_idx', 'workout event links are indexed');
select has_index('public', 'exercise_logs', 'exercise_logs_event_id_unique', 'one workout record is allowed per event');
select is(
  (
    select indisunique
    from pg_index
    where indexrelid = 'public.exercise_logs_event_id_unique'::regclass
  ),
  true,
  'the event link index enforces uniqueness'
);
select has_trigger('public', 'exercise_logs', 'exercise_logs_validate_event_owner', 'workout links enforce event ownership');
select like(
  pg_get_functiondef('public.validate_exercise_log_event_owner()'::regprocedure),
  '%workout event record type mismatch%',
  'the ownership trigger also validates event and record types'
);
select has_function('public', 'save_event_bundle_v3', array['uuid','jsonb','jsonb','jsonb'], 'event category RPC exists');
select is(
  (select prosecdef from pg_proc where oid = 'public.save_event_bundle_v3(uuid,jsonb,jsonb,jsonb)'::regprocedure),
  false,
  'event category RPC uses invoker rights'
);
select is(
  (select count(*) from pg_constraint where conname = 'events_event_type_check'),
  1::bigint,
  'event types are constrained'
);
select is(
  (select count(*) from pg_constraint where conname = 'events_event_details_check'),
  1::bigint,
  'event detail shapes are constrained'
);
select is(
  (select confdeltype from pg_constraint where conname = 'exercise_logs_event_id_fkey'),
  'n'::"char",
  'deleting a plan clears the workout link'
);

select * from finish();
rollback;
