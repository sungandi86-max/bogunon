begin;

alter table public.projects
  drop constraint if exists projects_icon_allowed_check;

alter table public.projects
  add constraint projects_icon_allowed_check
  check (icon in ('folder', 'calendar', 'school', 'heart', 'flag', 'star', 'travel'));

commit;
