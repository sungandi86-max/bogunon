begin;

alter table public.user_settings
  add column if not exists health_support_attendance_confirmer_name text
  check (health_support_attendance_confirmer_name is null or (health_support_attendance_confirmer_name = btrim(health_support_attendance_confirmer_name) and char_length(health_support_attendance_confirmer_name) between 1 and 100));

commit;
