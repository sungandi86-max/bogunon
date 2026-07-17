# Phase 5·6 Database

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

## Phase 6 Workflow OS 데이터 계약

Phase 6는 `supabase/migrations/20260718120000_phase_6_workflow_execution.sql`로 추가하며 위 Phase 5 migration과 테이블을 수정하거나 대체하지 않는다. Phase 5 `task_templates`는 단일 Task 재사용용이고, Phase 6 Workflow 템플릿과 인스턴스는 Task 내부의 다단계 절차 실행용으로 분리한다.

### 템플릿과 인스턴스 테이블

- `workflow_templates`: 사용자 소유 템플릿의 이름, 설명, 카테고리, 기본 우선순위와 권장 시기
- `workflow_template_steps`: 템플릿 단계의 순서, 설명, 예상 시간, 기본 메모, 담당자 표시와 완료 조건
- `workflow_template_step_checklist_items`, `workflow_template_step_links`: 단계 기본 체크리스트와 HTTP·HTTPS 링크
- `task_workflow_instances`: Task에 연결된 사용자 소유 실행 단위, 템플릿 출처 스냅샷, 상태, 현재 단계와 상태별 시각
- `task_workflow_steps`: 실행 시 복사한 단계 스냅샷, 순서, 상태, 메모, 내부 참고사항, 담당자 표시와 완료 조건
- `task_workflow_step_checklist_items`, `workflow_step_links`: 인스턴스 단계의 체크리스트 완료 상태와 링크
- `workflow_timeline_events`: 인스턴스·단계의 시작, 편집과 상태 전이 이력
- `workflow_followup_rules`: 템플릿 또는 인스턴스의 단계·Workflow 완료 후속 Task 규칙과 생성 Task 참조

기본 `결핵검진`, `학생건강검진` 템플릿은 애플리케이션의 불변 정의로 제공하고, DB에는 사용자가 복제하거나 만든 템플릿만 저장한다. 인스턴스는 시작 시 템플릿 내용을 복사하므로 템플릿 변경·삭제가 기존 실행 기록을 바꾸지 않는다.

### 관계와 상태 제약

- 각 `task_workflow_instances.task_id`는 같은 사용자의 Task만 참조한다. 인스턴스 삭제 시 원본 Task는 유지하고, 원본 Task 삭제 시 연결 인스턴스와 하위 행은 함께 삭제한다.
- `task_workflow_instances.status`는 `active`, `paused`, `completed`, `cancelled`만 허용한다.
- `task_workflow_steps.status`는 `pending`, `in_progress`, `completed`, `skipped`, `blocked`만 허용한다.
- 허용 Workflow 전이는 `active → paused|completed|cancelled`, `paused → active|cancelled`이며 종료 상태에서는 전이하지 않는다.
- 허용 단계 전이는 `pending → in_progress|skipped|blocked`, `in_progress → completed|skipped|blocked|pending`, `completed|skipped → in_progress`, `blocked → in_progress|skipped|pending`이다.
- 단계 순서와 사용자 소유권은 사용자 ID를 포함한 고유·복합 제약으로 보호하고, `current_step_id`, 템플릿, 단계, 후속 Task 참조는 같은 `user_id`에 속해야 한다.

### 원자적 RPC

- `save_workflow_template_bundle`: 템플릿과 단계·체크리스트·링크·후속 규칙을 한 트랜잭션으로 생성 또는 교체한다.
- `create_workflow_instance_bundle`: Task와 템플릿 접근권한을 검증하고 인스턴스, 단계·체크리스트·링크·후속 규칙 스냅샷과 최초 타임라인을 한 트랜잭션으로 만든다.
- `update_workflow_step_bundle`: 단계 메타데이터, 체크리스트와 링크를 한 트랜잭션으로 저장한다.
- `transition_workflow_step`: 인스턴스와 단계를 잠그고 현재 상태, 허용 전이와 체크리스트 조건을 확인한 뒤 상태·시각·현재 단계와 타임라인을 갱신한다.
- `transition_workflow_instance`: 인스턴스를 잠그고 허용 전이를 검사한 뒤 상태별 시각과 타임라인을 갱신한다.
- `complete_workflow_instance`: 모든 단계가 `completed` 또는 `skipped`인지 확인하고 Workflow와 원본 Task 완료, 후속 Task·체크리스트 생성, 생성 Task 참조와 타임라인 기록을 한 트랜잭션으로 처리한다.
- RPC 어느 쓰기라도 실패하면 전체 호출을 롤백한다. 클라이언트는 하위 행을 여러 요청으로 직접 조합해 저장하지 않는다.
- RPC는 호출자의 `auth.uid()`를 소유자로 사용하고 클라이언트가 임의의 `user_id`를 지정하지 못하게 한다. `security definer`를 사용한다면 고정 `search_path`, 최소 권한과 명시적 소유권 검사를 적용한다.

### RLS와 개인정보 보호

- 모든 Workflow 테이블은 `(select auth.uid()) = user_id` 정책을 적용하고 `anon` 권한을 부여하지 않는다.
- 하위 행과 Task 참조는 사용자 ID를 포함한 복합 외래키로 다른 사용자의 부모·Task에 연결하지 못하게 한다.
- 사용자는 자기 템플릿·인스턴스만 CRUD하고 RPC도 같은 소유권을 다시 검증한다.
- 메모·내부 참고사항에는 학생 이름, 학번, 반·번호, 연락처, 질병명, 검진 결과와 상담 기록을 저장하지 않는다. 로그와 오류 응답에도 입력 본문을 남기지 않는다.

### Phase 6 DB QA

- 사용자 A/B와 비로그인 역할에 대해 템플릿, 인스턴스, 단계, 체크리스트, 링크, 타임라인, 후속 규칙과 연결 Task 격리를 검증한다.
- 허용·금지 상태 전이, 종료 상태, 미완료 체크리스트, 미해결 단계가 있는 Workflow 완료 거부를 검증한다.
- 템플릿·인스턴스·단계 묶음 저장 중간 실패와 후속 Task 생성 실패가 전체 RPC를 롤백하는지 확인한다.
- 동시 전이에서 금지된 상태 조합이나 중복 후속 Task가 남지 않고 하나의 일관된 상태만 커밋되는지 확인한다.
- Phase 5 원자적 Task·Event·템플릿 쓰기와 `phase_5_workflow_rls.sql` 회귀 검증을 함께 실행한다.
