begin;

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('bug', 'question', 'feature', 'other')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null check (char_length(btrim(description)) between 1 and 10000),
  attempted_action text check (attempted_action is null or char_length(attempted_action) <= 5000),
  observed_result text check (observed_result is null or char_length(observed_result) <= 5000),
  reproducible text check (reproducible is null or reproducible in ('yes', 'no', 'unknown')),
  page_path text not null check (char_length(page_path) between 1 and 200 and left(page_path, 1) = '/' and position('?' in page_path) = 0 and position('#' in page_path) = 0),
  app_version text check (app_version is null or char_length(app_version) <= 32),
  user_agent text check (user_agent is null or char_length(user_agent) <= 512),
  viewport_width integer check (viewport_width is null or viewport_width between 1 and 10000),
  viewport_height integer check (viewport_height is null or viewport_height between 1 and 10000),
  status text not null default 'received' check (status in ('received', 'reviewing', 'resolved', 'closed')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_reports_user_created_idx on public.user_reports(user_id, created_at desc);
create index user_reports_status_created_idx on public.user_reports(status, created_at desc);
create trigger user_reports_set_updated_at before update on public.user_reports for each row execute function public.set_updated_at();

alter table public.user_reports enable row level security;
revoke all on table public.user_reports from public, anon;
grant select, insert on public.user_reports to authenticated;
grant update (status, admin_note) on public.user_reports to authenticated;

create policy user_reports_select_own_or_admin on public.user_reports for select to authenticated
using (user_id = (select auth.uid()) or private.is_notice_admin());
create policy user_reports_insert_own on public.user_reports for insert to authenticated
with check (user_id = (select auth.uid()));
create policy user_reports_update_admin on public.user_reports for update to authenticated
using (private.is_notice_admin()) with check (private.is_notice_admin());

commit;
