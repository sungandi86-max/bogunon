begin;

delete from public.tasks
where user_id = auth.uid()
  and title in (
    'Phase5 QA 약품 점검',
    'Phase5 QA 약품 점검 복사본',
    'Phase5 Atomic QA',
    'Phase5 Atomic QA 복사본'
  );

delete from public.events
where user_id = auth.uid()
  and title in ('보건교육', '보건교육 복사본');

delete from public.task_templates
where user_id = auth.uid()
  and name in ('약품 및 응급물품 점검 복사본', 'Phase5 Atomic QA');

commit;
