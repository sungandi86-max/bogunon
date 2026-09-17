begin;

create table public.practical_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text,
  url text not null check (url ~* '^(https?://|/[^/])'),
  icon_key text not null default 'web' check (icon_key in ('online_health','spreadsheet','drive','school_system','website','other')),
  scope text not null default 'personal' check (scope in ('public','personal')),
  owner_id uuid references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practical_tools_scope_owner_check check ((scope = 'public' and owner_id is null) or (scope = 'personal' and owner_id is not null))
);

create index practical_tools_scope_owner_idx on public.practical_tools(scope, owner_id, is_active, name);
create trigger practical_tools_set_updated_at before update on public.practical_tools for each row execute function public.set_updated_at();

create table public.practical_schedule_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid not null references public.health_practical_schedules(id) on delete cascade,
  tool_id uuid not null references public.practical_tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (schedule_id, tool_id)
);

create index practical_schedule_tools_schedule_idx on public.practical_schedule_tools(user_id, schedule_id);
create index practical_schedule_tools_tool_idx on public.practical_schedule_tools(user_id, tool_id);

alter table public.practical_tools enable row level security;
alter table public.practical_schedule_tools enable row level security;
revoke all on table public.practical_tools, public.practical_schedule_tools from public, anon;
grant select, insert, update, delete on table public.practical_tools, public.practical_schedule_tools to authenticated;

create policy practical_tools_select on public.practical_tools for select to authenticated
using (scope = 'public' or owner_id = (select auth.uid()));
create policy practical_tools_insert_own on public.practical_tools for insert to authenticated
with check (scope = 'personal' and owner_id = (select auth.uid()));
create policy practical_tools_update_own on public.practical_tools for update to authenticated
using (scope = 'personal' and owner_id = (select auth.uid()))
with check (scope = 'personal' and owner_id = (select auth.uid()));
create policy practical_tools_delete_own on public.practical_tools for delete to authenticated
using (scope = 'personal' and owner_id = (select auth.uid()));

create policy practical_schedule_tools_select on public.practical_schedule_tools for select to authenticated
using ((select auth.uid()) = user_id);
create policy practical_schedule_tools_insert on public.practical_schedule_tools for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.health_practical_schedules s where s.id = schedule_id and s.user_id = (select auth.uid()))
  and exists (select 1 from public.practical_tools t where t.id = tool_id and (t.scope = 'public' or t.owner_id = (select auth.uid())))
);
create policy practical_schedule_tools_delete on public.practical_schedule_tools for delete to authenticated
using ((select auth.uid()) = user_id);

insert into public.practical_tools (name, description, url, icon_key, scope, owner_id)
values
  ('AED 점검', 'AED 장비 점검 기록', '/aed', 'website', 'public', null),
  ('생기부 도우미', '생활기록부 초안 작성', '/ai-writer', 'website', 'public', null),
  ('자주 쓰는 링크', '업무 시작 링크 모음', '/settings/quick-links', 'website', 'public', null);

commit;
