begin;

alter table public.tasks
  add column if not exists category text not null default 'other',
  add column if not exists recurrence_frequency text,
  add column if not exists recurrence_source_id uuid,
  add column if not exists recurrence_date date,
  add column if not exists recurrence_generated_through date;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_category_check'
  ) then
    alter table public.tasks add constraint tasks_category_check check (
      category in (
        'studentHealthScreening', 'additionalScreening', 'infectiousDisease',
        'firstAid', 'medication', 'officialDocument', 'training', 'event',
        'counseling', 'other'
      )
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_recurrence_check'
  ) then
    alter table public.tasks add constraint tasks_recurrence_check check (
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
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_user_id_id_key'
  ) then
    alter table public.tasks
      add constraint tasks_user_id_id_key unique (user_id, id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_recurrence_occurrence_key'
  ) then
    alter table public.tasks
      add constraint tasks_recurrence_occurrence_key
      unique (user_id, recurrence_source_id, recurrence_date);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_recurrence_source_fk'
  ) then
    alter table public.tasks
      add constraint tasks_recurrence_source_fk
      foreign key (user_id, recurrence_source_id)
      references public.tasks(user_id, id)
      on delete cascade;
  end if;
end;
$$;

create index if not exists tasks_user_category_status_idx
  on public.tasks (user_id, category, status);

create index if not exists tasks_user_recurrence_root_idx
  on public.tasks (user_id, recurrence_date)
  include (recurrence_frequency, recurrence_generated_through)
  where recurrence_source_id is null and recurrence_frequency is not null;

create index if not exists tasks_user_search_dates_idx
  on public.tasks (user_id, due_date, scheduled_date, priority);

commit;
