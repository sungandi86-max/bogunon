begin;

alter table public.exercise_logs
  add column record_type text not null default 'exercise',
  add constraint exercise_logs_record_type_check
    check (record_type in ('exercise', 'lesson', 'competition'));

alter table public.exercise_logs
  drop constraint exercise_logs_user_date_sticker_key,
  add constraint exercise_logs_user_date_sticker_record_type_key
    unique (user_id, exercise_date, sticker_id, record_type),
  add constraint exercise_logs_id_record_type_key
    unique (id, record_type);

create table public.exercise_lesson_reviews (
  exercise_log_id uuid primary key,
  record_type text not null default 'lesson',
  lesson_focus text,
  learned text,
  mistakes text,
  coach_feedback text,
  next_goal text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_lesson_reviews_record_type_check check (record_type = 'lesson'),
  constraint exercise_lesson_reviews_log_type_fkey
    foreign key (exercise_log_id, record_type)
    references public.exercise_logs(id, record_type) on delete cascade,
  constraint exercise_lesson_reviews_lesson_focus_check check (lesson_focus is null or (lesson_focus = btrim(lesson_focus) and lesson_focus <> '' and char_length(lesson_focus) <= 200)),
  constraint exercise_lesson_reviews_learned_check check (learned is null or (learned = btrim(learned) and learned <> '' and char_length(learned) <= 1000)),
  constraint exercise_lesson_reviews_mistakes_check check (mistakes is null or (mistakes = btrim(mistakes) and mistakes <> '' and char_length(mistakes) <= 1000)),
  constraint exercise_lesson_reviews_coach_feedback_check check (coach_feedback is null or (coach_feedback = btrim(coach_feedback) and coach_feedback <> '' and char_length(coach_feedback) <= 1000)),
  constraint exercise_lesson_reviews_next_goal_check check (next_goal is null or (next_goal = btrim(next_goal) and next_goal <> '' and char_length(next_goal) <= 1000)),
  constraint exercise_lesson_reviews_memo_check check (memo is null or (memo = btrim(memo) and memo <> '' and char_length(memo) <= 2000)),
  constraint exercise_lesson_reviews_content_check check (num_nonnulls(lesson_focus, learned, mistakes, coach_feedback, next_goal, memo) > 0)
);

create table public.exercise_competition_reviews (
  exercise_log_id uuid primary key,
  record_type text not null default 'competition',
  competition_name text,
  location text,
  event_category text,
  grade text,
  partner text,
  total_games integer,
  wins integer,
  losses integer,
  final_result text,
  strengths text,
  improvements text,
  next_goal text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_competition_reviews_record_type_check check (record_type = 'competition'),
  constraint exercise_competition_reviews_log_type_fkey
    foreign key (exercise_log_id, record_type)
    references public.exercise_logs(id, record_type) on delete cascade,
  constraint exercise_competition_reviews_competition_name_check check (competition_name is null or (competition_name = btrim(competition_name) and competition_name <> '' and char_length(competition_name) <= 200)),
  constraint exercise_competition_reviews_location_check check (location is null or (location = btrim(location) and location <> '' and char_length(location) <= 200)),
  constraint exercise_competition_reviews_event_category_check check (event_category is null or (event_category = btrim(event_category) and event_category <> '' and char_length(event_category) <= 200)),
  constraint exercise_competition_reviews_grade_check check (grade is null or (grade = btrim(grade) and grade <> '' and char_length(grade) <= 100)),
  constraint exercise_competition_reviews_partner_check check (partner is null or (partner = btrim(partner) and partner <> '' and char_length(partner) <= 100)),
  constraint exercise_competition_reviews_total_games_check check (total_games is null or total_games between 0 and 1000),
  constraint exercise_competition_reviews_wins_check check (wins is null or wins between 0 and 1000),
  constraint exercise_competition_reviews_losses_check check (losses is null or losses between 0 and 1000),
  constraint exercise_competition_reviews_game_counts_check check (
    (wins is null and losses is null)
    or (total_games is not null and coalesce(wins, 0) + coalesce(losses, 0) <= total_games)
  ),
  constraint exercise_competition_reviews_final_result_check check (final_result is null or (final_result = btrim(final_result) and final_result <> '' and char_length(final_result) <= 200)),
  constraint exercise_competition_reviews_strengths_check check (strengths is null or (strengths = btrim(strengths) and strengths <> '' and char_length(strengths) <= 1000)),
  constraint exercise_competition_reviews_improvements_check check (improvements is null or (improvements = btrim(improvements) and improvements <> '' and char_length(improvements) <= 1000)),
  constraint exercise_competition_reviews_next_goal_check check (next_goal is null or (next_goal = btrim(next_goal) and next_goal <> '' and char_length(next_goal) <= 1000)),
  constraint exercise_competition_reviews_memo_check check (memo is null or (memo = btrim(memo) and memo <> '' and char_length(memo) <= 2000)),
  constraint exercise_competition_reviews_content_check check (
    num_nonnulls(competition_name, location, event_category, grade, partner, total_games, wins, losses, final_result, strengths, improvements, next_goal, memo) > 0
  )
);

create trigger exercise_lesson_reviews_set_updated_at
before update on public.exercise_lesson_reviews
for each row execute function public.set_updated_at();

create trigger exercise_competition_reviews_set_updated_at
before update on public.exercise_competition_reviews
for each row execute function public.set_updated_at();

alter table public.exercise_lesson_reviews enable row level security;
alter table public.exercise_competition_reviews enable row level security;

revoke all on table public.exercise_lesson_reviews, public.exercise_competition_reviews from public, anon;
grant select, insert, update, delete on table public.exercise_lesson_reviews, public.exercise_competition_reviews to authenticated;

create policy exercise_lesson_reviews_select_own on public.exercise_lesson_reviews
for select to authenticated
using (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
));

create policy exercise_lesson_reviews_insert_own on public.exercise_lesson_reviews
for insert to authenticated
with check (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
    and exercise_logs.record_type = 'lesson'
));

create policy exercise_lesson_reviews_update_own on public.exercise_lesson_reviews
for update to authenticated
using (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
    and exercise_logs.record_type = 'lesson'
));

create policy exercise_lesson_reviews_delete_own on public.exercise_lesson_reviews
for delete to authenticated
using (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
));

create policy exercise_competition_reviews_select_own on public.exercise_competition_reviews
for select to authenticated
using (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
));

create policy exercise_competition_reviews_insert_own on public.exercise_competition_reviews
for insert to authenticated
with check (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
    and exercise_logs.record_type = 'competition'
));

create policy exercise_competition_reviews_update_own on public.exercise_competition_reviews
for update to authenticated
using (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
    and exercise_logs.record_type = 'competition'
));

create policy exercise_competition_reviews_delete_own on public.exercise_competition_reviews
for delete to authenticated
using (exists (
  select 1 from public.exercise_logs
  where exercise_logs.id = exercise_log_id
    and exercise_logs.user_id = (select auth.uid())
));

commit;
