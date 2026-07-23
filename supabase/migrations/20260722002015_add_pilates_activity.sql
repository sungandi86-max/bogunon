begin;

alter table public.exercise_stickers
  drop constraint if exists exercise_stickers_icon_key_check;

alter table public.exercise_stickers
  add constraint exercise_stickers_icon_key_check
  check (icon_key in ('badminton', 'badminton_lesson', 'walking', 'running', 'strength', 'stretching', 'cycling', 'swimming', 'pilates', 'other'));

insert into public.exercise_stickers (id, label, icon_key, color_key, display_order, is_default)
values ('10000000-0000-4000-8000-000000000010', '필라테스', 'pilates', 'pink', 85, true)
on conflict (icon_key) where user_id is null do update
set label = excluded.label,
    color_key = excluded.color_key,
    display_order = excluded.display_order,
    is_default = true;

commit;
