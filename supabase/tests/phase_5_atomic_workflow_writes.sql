begin;

select plan(8);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-atomic@example.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);

select has_function_privilege('authenticated', 'public.save_work_item_bundle(text,uuid,jsonb,jsonb,jsonb,jsonb)', 'EXECUTE', '인증 사용자는 원자적 업무 저장 함수를 실행한다');
select has_function_privilege('authenticated', 'public.save_task_template_bundle(jsonb,jsonb)', 'EXECUTE', '인증 사용자는 원자적 템플릿 저장 함수를 실행한다');
select has_function_privilege('authenticated', 'public.duplicate_task_bundle(uuid,date,boolean,boolean,boolean,boolean)', 'EXECUTE', '인증 사용자는 원자적 업무 복제 함수를 실행한다');

select throws_ok(
  $$select public.save_work_item_bundle('task', null, '{"title":"원자성 실패","area":"healthWork","status":"planned","priority":"normal","category":"other"}', '[]', '[{"title":"잘못된 링크","url":"javascript:alert(1)"}]', '[]')$$,
  '23514', null, '하위 링크 실패 시 묶음 저장 전체가 실패한다'
);
select is((select count(*)::integer from public.tasks where title = '원자성 실패'), 0, '하위 저장 실패가 부모 업무를 남기지 않는다');

select lives_ok(
  $$select public.save_work_item_bundle('task', null, '{"title":"원자적 저장","area":"healthWork","status":"planned","priority":"normal","category":"medication"}', '[{"title":"재고 확인","isCompleted":false}]', '[{"title":"점검표","url":"https://example.invalid/check"}]', '[{"referenceType":"due","offsetMinutes":1440}]')$$,
  '부모 업무와 모든 하위 항목을 함께 저장한다'
);
select is((select count(*)::integer from public.task_checklist_items where title = '재고 확인'), 1, '원자적 저장에 체크리스트가 포함된다');
select is((select count(*)::integer from public.task_links where title = '점검표'), 1, '원자적 저장에 링크가 포함된다');

select * from finish();
rollback;
