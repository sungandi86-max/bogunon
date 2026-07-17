# Phase 5 Database

Phase 5의 원격 DB 변경 원본은 `supabase/migrations/20260718090000_phase_5_health_workflow_planning.sql`과 후속 `supabase/migrations/20260718103000_atomic_phase_5_workflow_writes.sql`이다. 기존 migration은 수정하지 않는다. 후속 migration은 Task/Event 본문과 하위 항목, 템플릿과 체크리스트, 업무 복제를 각각 하나의 PostgreSQL 트랜잭션으로 처리한다.

## 변경 테이블

- `task_templates`: 사용자 소유 템플릿
- `task_template_checklist_items`: 템플릿 체크리스트
- `task_checklist_items`: Task 체크리스트와 순서·완료 상태
- `task_links`, `event_links`: 제목이 있는 HTTP·HTTPS 관련 링크
- `task_reminders`, `event_reminders`: 기준일과 분 단위 사전 알림 설정

기존 `tasks`에는 `description`, `estimated_minutes`, `events`에는 `description`을 추가한다. 모든 신규 사용자 데이터 테이블은 `id`, `user_id`, `created_at`, `updated_at`을 포함한다.

## 소유권과 RLS

- 인증 사용자는 `(select auth.uid()) = user_id`인 행만 조회·생성·수정·삭제한다.
- 하위 행은 `(user_id, parent_id)` 복합 외래키로 같은 사용자의 부모에만 연결된다.
- `anon`에는 테이블 권한을 부여하지 않는다.
- 서비스 역할을 사용자 요청 경로에서 사용하지 않는다.

## 적용과 검증

Supabase CLI가 실제 BogunOn 프로젝트에 연결되지 않은 경우 Dashboard의 SQL Editor에서 migration 파일 전체를 실행한다. 로컬 Docker/Postgres가 준비되면 다음으로 RLS를 검증한다.

```bash
npm run test:db
```

검증 자산은 `supabase/tests/phase_5_workflow_rls.sql`이며 사용자 A, 사용자 B와 비로그인 역할의 격리를 확인한다.
