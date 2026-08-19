begin;

create table public.user_quick_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null constraint user_quick_links_name_check check (char_length(btrim(name)) between 1 and 80),
  url text not null constraint user_quick_links_url_check check (url ~* '^https?://'),
  icon_key text not null default 'web' constraint user_quick_links_icon_check check (icon_key in ('document', 'spreadsheet', 'drive', 'school', 'admin', 'health', 'web', 'other')),
  sort_order integer not null default 0 constraint user_quick_links_sort_order_check check (sort_order >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_quick_links_user_sort_idx on public.user_quick_links(user_id, sort_order, created_at);
create trigger user_quick_links_set_updated_at before update on public.user_quick_links for each row execute function public.set_updated_at();

alter table public.user_quick_links enable row level security;
revoke all on table public.user_quick_links from public, anon;
grant select, insert, update, delete on table public.user_quick_links to authenticated;

create policy user_quick_links_select_own on public.user_quick_links for select to authenticated using (user_id = auth.uid());
create policy user_quick_links_insert_own on public.user_quick_links for insert to authenticated with check (user_id = auth.uid());
create policy user_quick_links_update_own on public.user_quick_links for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_quick_links_delete_own on public.user_quick_links for delete to authenticated using (user_id = auth.uid());

commit;
