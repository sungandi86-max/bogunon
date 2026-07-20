begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles (id, email, display_name, avatar_url)
select id, email, raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'avatar_url'
from auth.users on conflict (id) do nothing;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.is_notice_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'owner')) $$;
revoke all on function private.is_notice_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_notice_admin() to authenticated;

create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin
  insert into public.profiles (id, email, display_name, avatar_url, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url', 'user')
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create function private.protect_profile_fields()
returns trigger language plpgsql security invoker set search_path = ''
as $$ begin
  if new.id <> old.id or new.role <> old.role or new.email is distinct from old.email then raise exception 'profile protected fields cannot be changed'; end if;
  new.updated_at = now();
  return new;
end $$;
revoke all on function private.protect_profile_fields() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();
create trigger profiles_protect_fields before update on public.profiles
for each row execute function private.protect_profile_fields();

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  summary text check (summary is null or char_length(trim(summary)) <= 300),
  content text not null check (char_length(trim(content)) between 1 and 10000),
  category text not null default 'notice' check (category in ('notice', 'update', 'maintenance', 'important')),
  is_published boolean not null default false,
  is_important boolean not null default false,
  publish_start_at timestamptz,
  publish_end_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (publish_end_at is null or publish_start_at is null or publish_end_at >= publish_start_at)
);

create table public.notice_reads (
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice_id, user_id)
);

create index notices_publication_idx on public.notices (is_published, publish_start_at, publish_end_at);
create index notices_order_idx on public.notices (is_important desc, created_at desc);
create index notice_reads_user_idx on public.notice_reads (user_id);
create trigger notices_set_updated_at before update on public.notices
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.notices enable row level security;
alter table public.notice_reads enable row level security;
grant select, update (display_name, avatar_url) on public.profiles to authenticated;
grant select, insert, update, delete on public.notices to authenticated;
grant select, insert, update, delete on public.notice_reads to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy notices_select_visible on public.notices for select to authenticated
using (private.is_notice_admin() or (is_published and (publish_start_at is null or publish_start_at <= now()) and (publish_end_at is null or publish_end_at >= now())));
create policy notices_insert_admin on public.notices for insert to authenticated
with check (private.is_notice_admin() and created_by = (select auth.uid()));
create policy notices_update_admin on public.notices for update to authenticated
using (private.is_notice_admin()) with check (private.is_notice_admin());
create policy notices_delete_admin on public.notices for delete to authenticated
using (private.is_notice_admin());

create policy notice_reads_select_own on public.notice_reads for select to authenticated
using (user_id = (select auth.uid()));
create policy notice_reads_insert_own on public.notice_reads for insert to authenticated
with check (user_id = (select auth.uid()));
create policy notice_reads_update_own on public.notice_reads for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notice_reads_delete_own on public.notice_reads for delete to authenticated
using (user_id = (select auth.uid()));

commit;
