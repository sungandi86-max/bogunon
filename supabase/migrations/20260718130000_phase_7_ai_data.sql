begin;

create table public.ai_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  history_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_preferences_user_id_key unique (user_id)
);

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type = btrim(request_type) and request_type <> ''),
  prompt text not null check (prompt = btrim(prompt) and prompt <> ''),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_requests_user_id_id_key unique (user_id, id),
  constraint ai_requests_result_check check (
    (status = 'pending' and error_message is null and completed_at is null)
    or (status = 'completed' and error_message is null and completed_at is not null)
    or (status = 'failed' and error_message is not null and completed_at is not null)
  )
);

create table public.ai_action_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  action_type text not null check (action_type = btrim(action_type) and action_type <> ''),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending',
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_action_drafts_request_fk
    foreign key (user_id, request_id)
    references public.ai_requests(user_id, id) on delete cascade,
  constraint ai_action_drafts_status_check check (
    (status = 'applied' and applied_at is not null)
    or (status in ('pending', 'dismissed') and applied_at is null)
  )
);

create index ai_requests_user_created_idx
  on public.ai_requests (user_id, created_at desc);
create index ai_requests_user_status_created_idx
  on public.ai_requests (user_id, status, created_at desc);
create index ai_action_drafts_user_request_idx
  on public.ai_action_drafts (user_id, request_id);
create index ai_action_drafts_user_status_created_idx
  on public.ai_action_drafts (user_id, status, created_at desc);

create trigger ai_preferences_set_updated_at
before update on public.ai_preferences
for each row execute function public.set_updated_at();

create trigger ai_requests_set_updated_at
before update on public.ai_requests
for each row execute function public.set_updated_at();

create trigger ai_action_drafts_set_updated_at
before update on public.ai_action_drafts
for each row execute function public.set_updated_at();

alter table public.ai_preferences enable row level security;
alter table public.ai_requests enable row level security;
alter table public.ai_action_drafts enable row level security;

revoke all on table public.ai_preferences from anon;
revoke all on table public.ai_requests from anon;
revoke all on table public.ai_action_drafts from anon;
grant select, insert, update, delete on table public.ai_preferences to authenticated;
grant select, insert, update, delete on table public.ai_requests to authenticated;
grant select, insert, update, delete on table public.ai_action_drafts to authenticated;

create policy ai_preferences_select_own on public.ai_preferences
for select to authenticated using ((select auth.uid()) = user_id);
create policy ai_preferences_insert_own on public.ai_preferences
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ai_preferences_update_own on public.ai_preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy ai_preferences_delete_own on public.ai_preferences
for delete to authenticated using ((select auth.uid()) = user_id);

create policy ai_requests_select_own on public.ai_requests
for select to authenticated using ((select auth.uid()) = user_id);
create policy ai_requests_insert_own on public.ai_requests
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ai_requests_update_own on public.ai_requests
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy ai_requests_delete_own on public.ai_requests
for delete to authenticated using ((select auth.uid()) = user_id);

create policy ai_action_drafts_select_own on public.ai_action_drafts
for select to authenticated using ((select auth.uid()) = user_id);
create policy ai_action_drafts_insert_own on public.ai_action_drafts
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ai_action_drafts_update_own on public.ai_action_drafts
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy ai_action_drafts_delete_own on public.ai_action_drafts
for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.save_ai_history_bundle(
  p_user_id uuid,
  p_request_type text,
  p_prompt text,
  p_payload jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_draft_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'AI history owner mismatch' using errcode = '42501';
  end if;

  insert into public.ai_preferences (user_id, history_enabled)
  values (p_user_id, true)
  on conflict (user_id) do update
  set history_enabled = true;

  insert into public.ai_requests (
    user_id,
    request_type,
    prompt,
    status,
    completed_at
  )
  values (
    p_user_id,
    p_request_type,
    p_prompt,
    'completed',
    now()
  )
  returning id into v_request_id;

  insert into public.ai_action_drafts (
    user_id,
    request_id,
    action_type,
    payload
  )
  values (
    p_user_id,
    v_request_id,
    p_request_type,
    p_payload
  )
  returning id into v_draft_id;

  return v_draft_id;
end;
$$;

revoke all on function public.save_ai_history_bundle(uuid, text, text, jsonb) from public, anon;
grant execute on function public.save_ai_history_bundle(uuid, text, text, jsonb) to authenticated;

commit;
