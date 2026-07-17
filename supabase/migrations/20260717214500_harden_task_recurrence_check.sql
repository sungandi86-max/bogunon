begin;

alter table public.tasks
  drop constraint if exists tasks_recurrence_check;

alter table public.tasks
  add constraint tasks_recurrence_check check (
    (
      recurrence_frequency is null
      and recurrence_source_id is null
      and recurrence_date is null
      and recurrence_generated_through is null
    )
    or (
      recurrence_frequency is not null
      and recurrence_frequency in ('daily', 'weekly', 'monthly', 'yearly')
      and scheduled_date is not null
      and recurrence_date is not null
      and recurrence_date = scheduled_date
      and (
        (
          recurrence_source_id is null
          and recurrence_generated_through is not null
          and recurrence_generated_through >= recurrence_date
        )
        or (
          recurrence_source_id is not null
          and recurrence_generated_through is null
        )
      )
    )
  ) not valid;

alter table public.tasks validate constraint tasks_recurrence_check;

commit;
