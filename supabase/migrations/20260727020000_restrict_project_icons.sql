begin;

update public.projects
set icon = 'folder'
where icon not in ('folder', 'calendar', 'school', 'heart', 'flag', 'star');

alter table public.projects
  add constraint projects_icon_allowed_check
  check (icon in ('folder', 'calendar', 'school', 'heart', 'flag', 'star'));

commit;
