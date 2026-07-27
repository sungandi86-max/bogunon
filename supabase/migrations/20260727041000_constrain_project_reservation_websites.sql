begin;

alter table public.project_reservations
  add constraint project_reservations_website_http_check check (
    website is null or website ~* '^https?://'
  );

commit;
