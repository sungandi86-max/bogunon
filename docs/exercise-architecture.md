# 운동 기능 V2 아키텍처

이 문서는 BOGUNON 운동 기능의 현재 호환 경계와 V2 확장 구조를 정의한다. 구현은 이 문서의 데이터 소유권, 유형 규칙, 기존 데이터 보존 원칙을 따라야 한다.

## 현재 구조

### 일정과 운동의 책임

- `events`는 앞으로 할 일을 담는 계획(Plan)이다. 일반 일정과 운동·대회 일정이 같은 캘린더에 표시된다.
- `exercise_logs`는 실제로 수행한 운동을 담는 기록(Log)이다. 결과, 리뷰와 통계의 부모가 된다.
- 별도 운동 일정 캘린더는 만들지 않는다. 운동 화면의 달력은 수행 기록을 탐색하는 화면이다.
- `exercise_logs.event_id`는 원래 계획과 수행 기록을 잇는 선택적 연결 지점이다. 이번 단계에서는 FK와 타입만 제공하며 자동 연결하지 않는다.

### `exercise_stickers`

운동 종류를 표현하는 스티커 테이블이다. 기본 스티커와 사용자 스티커를 함께 보관한다.

- 기본 스티커: `user_id`가 `null`이고 `is_default`가 `true`
- 사용자 스티커: 소유자의 `user_id`를 가지며 `is_default`가 `false`
- 기존 `id`, `icon_key`, `color_key`, 표시 순서와 sticker key를 유지한다.
- V2의 레슨과 대회는 새 sticker key가 아니라 기록 유형으로 구분한다.

### `exercise_logs`

신규 운동 기록의 중심 테이블이다. 사용자, 스티커, 운동 날짜, 운동 시간, 메모를 보관한다. V2에서는 `record_type`으로 기록의 성격을 구분한다.

- `exercise`: 일반 운동
- `lesson`: 레슨
- `competition`: 대회

`record_type`은 `NOT NULL`, 기본값 `exercise`, 허용 값 CHECK 제약을 사용한다. 같은 사용자가 같은 날짜에 같은 스티커를 기록할 때 유형별 한 건을 허용한다.

`event_id`는 선택적이며 여러 수행 기록이 하나의 계획을 참조할 수 있다. 연결된 이벤트가 삭제되면 기록은 유지하고 `event_id`만 비운다.

### `events` 운동 계획

`event_type`은 `personal`, `work`, `school`, `workout`, `tournament`를 구분한다. 운동과 대회도 일반 이벤트와 같은 날짜·시간·장소·반복 필드를 사용한다.

- `workout`: `event_details.kind = 'workout'`과 운동 종류를 저장한다.
- `tournament`: `event_details.kind = 'tournament'`과 대회명, 참가 종목, 파트너, 급수, 신청 상태를 저장한다.
- 기존 행이나 구버전 생성 경로에 `event_type`이 없으면 `area`로 표시 카테고리를 해석한다.

### 기존 `events.description` 운동 기록

구형 운동 기록은 `events.area = 'exercise'`와 `events.description`의 `bogunon:exercise:v1:` 메타데이터로 식별한다. 운동 화면의 기존 운동 일정 영역에서 읽기 전용으로 조회한다. V2 테이블로 자동 변환하거나 신규 리뷰와 연결하지 않는다.

## 현재 데이터 흐름

### 신규 운동 기록

1. 운동 화면이 사용 가능한 `exercise_stickers`와 해당 기간의 `exercise_logs`를 조회한다.
2. 사용자가 스티커, 날짜, 기록 유형과 선택 메모를 입력한다.
3. 서버 경계에서 입력을 검증하고 인증 사용자를 확인한다.
4. repository가 `exercise_logs`를 저장하고 생성된 로그 ID와 유형을 반환한다.
5. 일반 운동이면 저장을 끝낸다.
6. 레슨 또는 대회이면 해당 리뷰 Drawer를 연다. Drawer를 닫아도 운동 로그는 유지된다.
7. 리뷰는 부모 로그와 같은 유형의 리뷰 테이블에만 저장한다.

### 기존 운동 기록

구형 이벤트 운동은 기존 event repository를 통해 별도로 조회한다. 이 경로는 호환성을 위한 읽기 전용 경계이며, 신규 `exercise_logs` 조회 결과와 데이터 수준에서 합치지 않는다.

두 구조가 함께 존재하는 이유는 기존 사용자의 이벤트 기록을 손실 없이 보존하면서 신규 운동 기능을 정규화된 테이블로 확장하기 위해서다.

## 현재 한계

- V1 데이터에는 `record_type`이 없어 일반 운동, 레슨, 대회를 구분할 수 없다.
- 레슨과 대회의 상세 회고를 저장할 구조가 없다.
- 운동 스티커는 정적 SVG 파일 경로에 의존해 일정 스티커 디자인 시스템과 일관되지 않다.
- 최근 기록 UI가 반복 문구 중심이며 유형, 리뷰 요약, 결과를 충분히 보여주지 못한다.

## V2 데이터 구조

```text
exercise_logs
├── record_type = exercise     리뷰 없음
├── record_type = lesson       exercise_lesson_reviews (선택적 1:1)
└── record_type = competition  exercise_competition_reviews (선택적 1:1)
```

### `exercise_lesson_reviews`

기술 훈련 중심의 선택적 상세 리뷰다. `exercise_log_id`는 기본 키로 1:1 관계를 보장한다. 내부 discriminator `record_type`은 기본값·NOT NULL·CHECK로 항상 `lesson`이며, `(exercise_log_id, record_type)` composite FK가 부모 `(id, record_type)`를 참조하고 부모 삭제 시 함께 삭제된다.

- `lesson_focus`
- `learned`
- `mistakes`
- `coach_feedback`
- `next_goal`
- `memo`
- `created_at`, `updated_at`

최소 하나의 의미 있는 필드가 필요하다. 공백뿐인 문자열과 필드별 최대 길이를 CHECK 제약으로 거부한다.

### `exercise_competition_reviews`

대회 결과와 회고를 보관하는 선택적 상세 리뷰다. `exercise_log_id`는 기본 키로 1:1 관계를 보장한다. 내부 discriminator `record_type`은 기본값·NOT NULL·CHECK로 항상 `competition`이며, `(exercise_log_id, record_type)` composite FK가 부모 `(id, record_type)`를 참조하고 부모 삭제 시 함께 삭제된다.

- `competition_name`, `location`, `event_category`, `grade`, `partner`
- `total_games`, `wins`, `losses`, `final_result`
- `strengths`, `improvements`, `next_goal`, `memo`
- `created_at`, `updated_at`

최소 하나의 의미 있는 필드가 필요하다. 경기 수는 음수가 될 수 없고 승리와 패배 합계는 전체 경기 수를 넘을 수 없다.

### 부모 유형 검증

서버는 인증 사용자 소유권과 부모 `record_type`을 저장 전에 검증한다. DB는 `exercise_logs`의 `(id, record_type)` UNIQUE key와 각 리뷰의 고정 내부 discriminator를 묶은 composite FK로 같은 규칙을 강제한다. PostgreSQL의 FK가 리뷰 생성과 부모 유형 변경 사이의 동시성까지 처리하므로 trigger 조회 시점에 의존하지 않는다.

- `lesson` 부모에는 레슨 리뷰만 허용
- `competition` 부모에는 대회 리뷰만 허용
- `exercise` 부모에는 리뷰 금지
- 리뷰가 연결된 부모 로그는 호환되지 않는 유형으로 변경 금지

리뷰 테이블의 RLS는 별도 `user_id`를 복제하지 않고 부모 `exercise_logs.user_id`를 통해 SELECT, INSERT, UPDATE, DELETE 소유권을 판정한다.

## 데이터 호환 원칙

- 기존 `exercise_logs` 행, ID, 외래 키, 날짜, 운동 시간, 메모를 유지한다.
- 기존 행은 컬럼 기본값에 따라 `exercise`로 해석한다.
- 기존 `exercise_stickers`, 사용자 스티커, sticker key를 유지한다.
- 같은 날짜와 스티커의 기존 중복 규칙은 유형 단위 유일성으로 확장한다.
- 기존 `events.description` 운동 기록은 읽기 전용으로 계속 지원한다.
- 구형 이벤트 운동의 자동 migration은 하지 않는다.
- 레슨·대회 리뷰는 선택 사항이며 리뷰를 작성하지 않아도 부모 로그는 유지한다.

## UI 방향

- 운동 스티커는 BOGUNON 일정 스티커와 동일한 radius, spacing, stroke 규칙을 사용한다.
- 아이콘은 Lucide와 `currentColor`를 중심으로 렌더링한다.
- 배드민턴은 Lucide와 호환되는 `currentColor` 커스텀 라인 아이콘을 사용한다.
- 기존 SVG 파일과 key는 데이터 호환을 위해 남길 수 있지만 신규 운동 UI는 파일 경로에 의존하지 않는다.
- 레슨과 대회는 새 스티커를 만들지 않고 `record_type` Badge로만 구분한다.
- 일반 운동은 빠르게 저장하고, 레슨과 대회는 저장 후 해당 리뷰 Drawer를 연다.
- 최근 기록은 일정한 행 높이에서 종목, 날짜, 유형 Badge, 대표 리뷰와 결과를 보여준다.
- 메인 캘린더는 운동과 대회를 작은 아이콘과 카테고리 색상으로만 구분한다.
- 운동 화면은 수행 기록과 리뷰에 집중하고 예정 운동 입력을 제공하지 않는다.

## 이번 구현 범위

포함:

- 운동 스티커 리디자인
- `record_type`
- 레슨 리뷰
- 대회 리뷰
- 최근 기록 UI 개선
- `/exercise` 전용 운동 달력 유형 표시
- 메인 캘린더의 운동·대회 계획과 조건부 세부 입력
- `exercise_logs.event_id` 연결 지점

제외:

- 사진 첨부
- 통계
- 일정에서 운동 기록으로의 자동 값 전달
- 운동 기록에서 원래 일정으로의 자동 양방향 이동
- 구형 이벤트 운동 자동 migration

## 확장성 및 migration 판단

공통 기록은 `exercise_logs`, 종목 표현은 `exercise_stickers`, 유형별 상세 정보는 선택적 1:1 리뷰 테이블로 분리된다. 따라서 향후 리뷰 필드를 확장해도 일반 운동 행을 오염시키지 않는다.

V2에는 다음 additive migration이 필요하다.

1. `exercise_logs.record_type`과 허용 값·기본값·유일성 제약
2. 레슨·대회 리뷰 테이블, 외래 키, Cascade, 내용 제약
3. 부모 `(id, record_type)` UNIQUE key와 리뷰별 고정 discriminator composite FK
4. 리뷰 테이블의 RLS, 권한, `updated_at` trigger

기존 행을 삭제하거나 식별자를 재작성하지 않으므로 기존 사용자는 데이터 손실 없이 업데이트할 수 있다.

post-migration pgTAP은 기본 `exercise` 기록의 ID, 스티커, 날짜, 운동 시간, 메모가 리뷰 작업 뒤에도 유지되는지를 검증한다. 실제 V1 데이터가 존재하는 상태에서 migration 전후 값을 비교하는 upgrade 검증은 로컬 Supabase reset/upgrade harness가 필요하며, 해당 환경 없이 완료됐다고 간주하지 않는다.
