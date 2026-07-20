# 보건온 데이터 모델

## 1. 문서 목적

이 문서는 보건온 MVP의 도메인 타입, Supabase Postgres 저장 구조, 사용자 소유권, RLS, Repository와 백업 규칙을 정의한다. Supabase Database가 원본 저장소이며 localStorage는 도메인 데이터 저장소가 아니다.

## 2. 설계 원칙

1. 모든 사용자 소유 데이터는 Supabase Auth 사용자 UUID와 연결한다.
2. 소유권은 클라이언트 필터가 아니라 RLS로 강제한다.
3. 도메인 모델은 camelCase, DB 열은 snake_case를 사용하고 Adapter에서 변환한다.
4. 일정, 할 일, 프로젝트, 빠른 메모와 운동 기록을 분리한다.
5. 날짜 전용 값은 `Date`나 UTC 자정으로 저장하지 않는다.
6. 마감 표시, 현재 교시와 진행 표시 같은 파생 값을 저장하지 않는다.
7. 사용자 입력과 DB 응답은 런타임 검증한다.
8. 학생 개인정보용 필드를 만들지 않는다.

## 3. 공통 타입

```ts
export type UUID = string;
export type UserId = UUID;
export type LocalDate = string; // YYYY-MM-DD
export type LocalTime = string; // HH:mm
export type ISODateTime = string;
export type TimeZone = "Asia/Seoul";

export interface EntityTimestamps {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface UserOwnedEntity extends EntityTimestamps {
  id: UUID;
  userId: UserId;
}

export interface Attachment {
  id: UUID;
  name: string;
  type: string;
  url: string;
}

export type Result<T, E = RepositoryError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface RepositoryError {
  code:
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "CONFLICT"
    | "NETWORK_ERROR"
    | "DATABASE_ERROR"
    | "UNKNOWN";
  message: string;
  cause?: unknown;
}
```

`Attachment`는 미래 호환용이다. MVP에서는 실제 파일 업로드를 지원하지 않으므로 첨부 배열은 생략하거나 비어 있어야 한다.

## 4. TypeScript 스타일

- 객체 계약은 `interface`를 사용한다.
- 유니언과 계산 타입은 `type`을 사용한다.
- 열거 값은 `as const` 배열과 `(typeof VALUES)[number]`를 사용한다.
- TypeScript `enum`은 사용하지 않는다.
- optional 값이 없으면 프로퍼티를 생략한다.
- 판별 유니언의 명시적 미지정 상태 외에는 불필요한 `null`을 사용하지 않는다.

## 5. 고유 ID와 사용자 ID

- 클라이언트 생성 ID는 `crypto.randomUUID()`를 사용한다.
- DB 기본값으로 `gen_random_uuid()`를 사용할 수 있다.
- 데이터 유형 접두사를 사용하지 않는다.
- `userId`는 Supabase Auth의 `auth.users.id`다.
- 사용자가 입력한 `userId`를 신뢰하지 않는다.
- 생성 시 인증 세션의 사용자 ID를 사용한다.
- `userId`는 생성 후 변경할 수 없다.
- 외래키로 연결되는 두 행은 같은 `userId`를 가져야 한다.

## 6. 날짜와 시간

| 의미 | TypeScript | Postgres | 예시 |
|---|---|---|---|
| 날짜 전용 | `LocalDate` | `date` | `2026-07-16` |
| 시간 전용 | `LocalTime` | `time` | `14:30` |
| 정확한 시각 | `ISODateTime` | `timestamptz` | `2026-07-16T14:30:00+09:00` |
| 시간대 | `TimeZone` | `text` check | `Asia/Seoul` |

- 수행일: `scheduledDate` / `scheduled_date`
- 마감일: `dueDate` / `due_date`
- 후속 확인일: `followUpDate` / `follow_up_date`
- 날짜 계산은 `Asia/Seoul` 기준이다.

## 7. 영역·상태·우선순위

```ts
export const AREAS = [
  "healthWork",
  "schoolSchedule",
  "exercise",
  "personal",
  "project",
] as const;
export type Area = (typeof AREAS)[number];

export const TASK_STATUSES = [
  "planned",
  "inProgress",
  "waitingForReply",
  "needsCheck",
  "completed",
  "onHold",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "normal", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_CATEGORIES = [
  "studentHealthScreening",
  "additionalScreening",
  "infectiousDisease",
  "firstAid",
  "medication",
  "officialDocument",
  "training",
  "event",
  "counseling",
  "other",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const RECURRENCE_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];
```

신규 할 일의 기본 우선순위는 `normal`이다.

## 8. 일정 모델

### 학사일정 파일 가져오기 매핑

학사일정 파일 가져오기는 별도 테이블이나 원본 파일 저장소를 만들지 않고 기존 `Event`를 사용한다.

- `area`: `schoolSchedule`
- `isAllDay`: `true`
- `startDate` / `endDate`: 단일 날짜 또는 파일에서 추출한 기간
- `startTime` / `endTime`: `null`
- 파일명, 전체 경로, 원본 행 전체와 선택되지 않은 셀은 저장하지 않는다.
- 현재 스키마에는 import metadata가 없으므로 파일 단위 되돌리기는 이번 범위에서 제공하지 않는다.

```ts
export interface ExerciseEventDetails {
  exerciseType?: string;
  location?: string;
  goal?: string;
}

interface BaseCalendarEvent extends UserOwnedEntity {
  title: string;
  startDate: LocalDate;
  endDate: LocalDate;
  isAllDay: boolean;
  startTime?: LocalTime;
  endTime?: LocalTime;
  memo?: string;
  relatedUrl?: string;
  linkedTaskIds: UUID[];
}

export interface GeneralCalendarEvent extends BaseCalendarEvent {
  area: Exclude<Area, "exercise">;
  exercise?: never;
}

export interface ExerciseCalendarEvent extends BaseCalendarEvent {
  area: "exercise";
  exercise?: ExerciseEventDetails;
}

export type CalendarEvent = GeneralCalendarEvent | ExerciseCalendarEvent;
```

규칙:

- 제목, 시작일과 종료일은 필수다.
- 종료일은 시작일보다 빠를 수 없다.
- 종일 일정은 시작·종료 시간을 저장하지 않는다.
- 운동 전용 값은 `area === "exercise"`에서만 허용한다.
- `linkedTaskIds`에는 같은 사용자의 할 일만 포함한다.

## 9. 할 일·체크리스트 모델

Phase 5 실제 스키마에서는 체크리스트를 `task_checklist_items`로 저장하며 `title`, `is_completed`, `position`을 사용한다. 템플릿은 `task_templates`와 `task_template_checklist_items`, 다중 링크는 `task_links`·`event_links`, 알림 준비 데이터는 `task_reminders`·`event_reminders`로 분리한다. 모든 하위 테이블은 `user_id`를 포함하고 부모와의 복합 외래키로 동일 사용자 소유권을 강제한다. 상세 DDL과 적용 절차는 `DATABASE.md`를 따른다.

```ts
export interface ChecklistItem extends UserOwnedEntity {
  taskId: UUID;
  content: string;
  isCompleted: boolean;
  order: number;
}

export interface Task extends UserOwnedEntity {
  title: string;
  area: Area;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  tags?: string[];
  color?: string;
  attachments?: Attachment[];
  scheduledDate?: LocalDate;
  dueDate?: LocalDate;
  followUpDate?: LocalDate;
  workStage?: string;
  targetGroup?: string;
  checklist: ChecklistItem[];
  relatedUrl?: string;
  memo?: string;
  linkedEventId?: UUID;
  linkedProjectId?: UUID;
  completedAt?: ISODateTime;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceSourceId?: UUID;
  recurrenceDate?: LocalDate;
  recurrenceGeneratedThrough?: LocalDate;
}
```

규칙:

- `status === "completed"`일 때만 `completedAt`이 존재한다.
- 태그는 trim 후 빈 문자열과 중복을 허용하지 않는다.
- 태그가 없으면 `tags`를 생략한다.
- `color`는 `#RRGGBB` 형식만 허용한다.
- MVP에서 `attachments`는 생략하거나 빈 배열만 허용한다.
- ChecklistItem의 `userId`와 Task의 `userId`는 같아야 한다.
- `linkedEventId`와 `linkedProjectId`는 같은 사용자 소유 행만 참조한다.
- 카테고리는 학생건강검진·별도검사·감염병·응급처치·약품관리·공문·연수·행사·상담·기타 중 하나다.
- 반복 업무는 수행일을 기준으로 하며 같은 사용자·반복 원본·수행일 조합을 중복 생성하지 않는다.
- 반복 원본은 마지막 생성 완료일을 기록하여 사용자가 삭제한 과거 반복 인스턴스를 다시 만들지 않는다.
- 반복 원본 삭제 시 해당 원본에서 자동 생성된 업무도 함께 삭제한다.
- 반복 템플릿과 자동 반복 업무는 별도 개념이다.

## 10. 오늘 꼭 끝낼 일 지정

```ts
export interface DailyFocusAssignment extends UserOwnedEntity {
  date: LocalDate;
  taskId: UUID;
  order: number;
  assignedAt: ISODateTime;
}
```

- `(userId, date, taskId)`는 고유하다.
- `(userId, date, order)`는 고유하다.
- 날짜별 최대 3개는 DB 제약만으로 끝내지 않고 Repository 또는 트랜잭션 서비스에서 검증한다.
- 참조 Task와 같은 `userId`여야 한다.

## 11. 반복 업무 템플릿

```ts
export interface MonthDay {
  month: number;
  day: number;
}

export interface TemplateChecklistItem extends UserOwnedEntity {
  templateId: UUID;
  content: string;
  order: number;
}

export interface RepeatTaskTemplate extends UserOwnedEntity {
  title: string;
  area: "healthWork";
  checklist: TemplateChecklistItem[];
  expectedStart?: MonthDay;
  dueDateRule?: MonthDay;
  targetGroup?: string;
  relatedUrl?: string;
  defaultMemo?: string;
  workStage?: string;
  defaultStatus: TaskStatus;
}
```

복사 시 새 Task와 ChecklistItem을 현재 사용자 소유로 생성한다. 템플릿의 자동 복사와 원본-복사본 동기화는 없다.

## 12. 운동 기록

```ts
export const EXERCISE_INTENSITIES = ["low", "medium", "high"] as const;
export type ExerciseIntensity = (typeof EXERCISE_INTENSITIES)[number];

export const EXERCISE_CONDITIONS = [
  "veryGood",
  "good",
  "neutral",
  "bad",
  "veryBad",
] as const;
export type ExerciseCondition = (typeof EXERCISE_CONDITIONS)[number];

export interface ExerciseRecord extends UserOwnedEntity {
  eventId: UUID;
  isCompleted: boolean;
  actualDate?: LocalDate;
  intensity?: ExerciseIntensity;
  condition?: ExerciseCondition;
  memo?: string;
}
```

- 운동 일정 하나에 기록 하나만 허용한다: `(userId, eventId)` 고유.
- Event와 ExerciseRecord의 `userId`가 같아야 한다.
- 운동 일정 삭제 시 운동 기록을 함께 삭제한다.

## 13. 프로젝트

```ts
export type ProjectNextAction =
  | { type: "linkedTask"; taskId: UUID }
  | { type: "text"; text: string }
  | null;

export interface Project extends UserOwnedEntity {
  name: string;
  description?: string;
  progress: number;
  color?: string;
  attachments?: Attachment[];
  dueDate?: LocalDate;
  relatedUrl?: string;
  linkedTaskIds: UUID[];
  nextAction: ProjectNextAction;
}
```

- 진행률은 0~100 정수이며 사용자가 직접 입력한다.
- 대표 다음 행동은 두 방식 중 하나만 사용한다.
- linkedTask는 같은 사용자 소유의 연결된 할 일이어야 한다.
- 직접 입력한 대표 다음 행동은 별도의 할 일을 자동 생성하지 않는다.

## 14. 빠른 메모

```ts
export interface QuickMemo extends UserOwnedEntity {
  content: string;
}
```

빠른 메모에는 영역, 상태, 날짜, 마감일과 완료 여부를 저장하지 않는다.

## 15. 사용자 설정

```ts
export const WEEKDAYS = [
  "monday", "tuesday", "wednesday", "thursday",
  "friday", "saturday", "sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface WorkPeriod extends UserOwnedEntity {
  weekday: Weekday;
  label: string;
  startTime: LocalTime;
  endTime: LocalTime;
  order: number;
}

export interface WorkdayConfig {
  isWorkday: boolean;
  workStartTime?: LocalTime;
  workEndTime?: LocalTime;
}

export interface UserSettings extends UserOwnedEntity {
  timezone: TimeZone;
  weekStartsOn: "monday";
  hasSeenPrivacyNotice: boolean;
  calendarAreaFilters: Area[];
  workdays: Record<Weekday, WorkdayConfig>;
  workPeriods: WorkPeriod[];
}
```

설정은 사용자별 한 행만 허용한다. `user_id`에 unique 제약을 둔다.

## 16. AppData와 백업

```ts
export const CURRENT_SCHEMA_VERSION = 2 as const;
export const CURRENT_BACKUP_FORMAT_VERSION = 2 as const;

export interface AppData {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  events: CalendarEvent[];
  tasks: Task[];
  dailyFocusAssignments: DailyFocusAssignment[];
  repeatTaskTemplates: RepeatTaskTemplate[];
  exerciseRecords: ExerciseRecord[];
  projects: Project[];
  quickMemos: QuickMemo[];
  settings: UserSettings;
}

export interface BackupFile {
  backupFormatVersion: typeof CURRENT_BACKUP_FORMAT_VERSION;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  exportedAt: ISODateTime;
  timezone: TimeZone;
  ownerUserId: UserId;
  data: AppData;
}
```

클라우드 저장과 `userId` 도입은 스키마 의미가 변경되므로 이전 초안의 버전 1과 구분해 버전 2로 정의한다. 아직 배포 전이면 첫 migration에서 버전 2 구조를 직접 생성할 수 있다.

백업에는 현재 사용자 데이터만 포함한다. 복원 시 로그인 사용자와 `ownerUserId`가 다르면 차단한다. 세션, OAuth 토큰과 Google 프로필은 포함하지 않는다.

## 17. Supabase 테이블

권장 테이블:

- `events`
- `tasks`
- `checklist_items`
- `daily_focus_assignments`
- `repeat_task_templates`
- `template_checklist_items`
- `exercise_records`
- `projects`
- `quick_memos`
- `user_settings`
- `work_periods`

모든 테이블은 다음 공통 열을 가진다.

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

자식 테이블도 `user_id`를 가져야 하며 부모와 같은 소유자인지 복합 외래키 또는 트리거 없이 검증 가능한 제약·Repository 트랜잭션으로 보장한다. RLS는 자식 테이블에도 개별 적용한다.

필수 인덱스:

```sql
create index on public.events (user_id, start_date);
create index on public.tasks (user_id, scheduled_date);
create index on public.tasks (user_id, due_date);
create index on public.tasks (user_id, follow_up_date);
create index on public.tasks (user_id, status);
create index on public.projects (user_id);
create index on public.exercise_records (user_id, event_id);
```

## 18. RLS 정책

모든 사용자 데이터 테이블에 다음 정책 집합을 적용한다. `{table}`은 실제 테이블명으로 치환한다.

```sql
alter table public.{table} enable row level security;

create policy "{table}_select_own"
on public.{table} for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "{table}_insert_own"
on public.{table} for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "{table}_update_own"
on public.{table} for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "{table}_delete_own"
on public.{table} for delete
to authenticated
using ((select auth.uid()) = user_id);
```

- `TO authenticated`만 사용하는 정책은 금지한다.
- UPDATE에 `WITH CHECK`를 생략하지 않는다.
- `auth.role()`을 사용하지 않는다.
- service role로 일반 사용자 CRUD를 수행하지 않는다.

## 19. DB 제약

필수 제약 예시:

```sql
check (priority in ('low', 'normal', 'high')),
check (progress between 0 and 100),
check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
unique (user_id, event_id),
unique (user_id, date, task_id),
unique (user_id, date, sort_order),
unique (user_id)
```

영역과 상태도 허용 문자열 check를 둔다. 자유 입력 문자열은 trim 후 빈 값을 저장하지 않는다.

## 20. Repository 인터페이스

```ts
export interface OwnedRepository<T extends UserOwnedEntity> {
  list(): Promise<Result<T[]>>;
  getById(id: UUID): Promise<Result<T | null>>;
  save(entity: T, expectedUpdatedAt?: ISODateTime): Promise<Result<T>>;
  delete(id: UUID): Promise<Result<void>>;
}

export interface EventRepository extends OwnedRepository<CalendarEvent> {}
export interface TaskRepository extends OwnedRepository<Task> {}
export interface ProjectRepository extends OwnedRepository<Project> {}
export interface QuickMemoRepository extends OwnedRepository<QuickMemo> {}
export interface RepeatTaskTemplateRepository
  extends OwnedRepository<RepeatTaskTemplate> {}

export interface ExerciseRecordRepository
  extends OwnedRepository<ExerciseRecord> {
  getByEventId(eventId: UUID): Promise<Result<ExerciseRecord | null>>;
}

export interface DailyFocusRepository
  extends OwnedRepository<DailyFocusAssignment> {
  listByDate(date: LocalDate): Promise<Result<DailyFocusAssignment[]>>;
  assign(input: {
    date: LocalDate;
    taskId: UUID;
    order: number;
  }): Promise<Result<DailyFocusAssignment>>;
}

export interface SettingsRepository {
  get(): Promise<Result<UserSettings | null>>;
  save(settings: UserSettings, expectedUpdatedAt?: ISODateTime):
    Promise<Result<UserSettings>>;
}
```

Repository는 현재 인증 사용자를 내부 인증 컨텍스트에서 얻는다. 목록 메서드에 임의 `userId`를 받지 않는다.

## 21. Supabase Adapter와 캐시

```ts
export interface AuthContext {
  requireUserId(): Promise<Result<UserId>>;
}

export interface DraftCache {
  readDraft<T>(userId: UserId, key: string): Result<T | null>;
  writeDraft<T>(userId: UserId, key: string, value: T): Result<void>;
  removeDraft(userId: UserId, key: string): Result<void>;
  clearUserDrafts(userId: UserId): Result<void>;
}
```

localStorage Adapter는 `DraftCache`와 UI 캐시만 구현한다. 도메인 Repository의 localStorage 구현은 만들지 않는다.

## 22. 참조와 삭제

- Event 삭제: Task는 유지하고 `linkedEventId` 해제. 운동 Event이면 ExerciseRecord 삭제.
- Task 삭제: Event·Project 배열에서 ID 제거, DailyFocusAssignment 삭제, 대표 다음 행동이면 `null`.
- Project 삭제: Task 유지, `linkedProjectId` 해제.
- Template 삭제: 기존 복사 Task 유지.
- 모든 참조 정리는 같은 사용자 범위에서 수행한다.
- 다른 사용자 행은 참조·해제·삭제할 수 없다.
- 다중 행 변경은 Postgres transaction 또는 안전한 DB 함수로 원자화한다. DB 함수가 필요하면 권한과 RLS 우회를 별도 검토하며 일반적인 `SECURITY DEFINER` 사용을 금지한다.

## 23. 파생 값

저장하지 않는 값:

- 마감 임박, 오늘 마감, 기한 경과
- 오늘 꼭 끝낼 일 boolean
- 현재 교시와 퇴근까지 남은 시간
- 프로젝트 진행 표시
- 체크리스트 완료율
- 연결된 미완료 할 일 수
- 동기화 완료 추정값

## 24. 런타임 검증

- UUID, 날짜, 시간과 ISO 시각의 실제 유효성
- 필수 문자열 trim 후 1자 이상
- URL은 절대 `http:` 또는 `https:`
- Hex Color는 `/^#[0-9A-Fa-f]{6}$/`
- 태그 trim, 빈 문자열·중복 금지
- 진행률 0~100 정수
- attachments 생략 또는 빈 배열
- 허용 영역·상태·우선순위만 사용
- 응답 행의 `userId`가 현재 인증 사용자와 일치
- 백업 소유자와 현재 로그인 사용자 일치
- 양방향 참조와 자식 행 소유자 일치

## 25. 스키마와 migration

- 현재 스키마 버전: 2
- 현재 백업 형식 버전: 2
- migration은 Supabase CLI로 생성하고 저장소에 커밋한다.
- 마이그레이션 적용 전후 RLS와 인덱스를 검증한다.
- 높은 버전 데이터를 임의 해석하지 않는다.
- 실패한 마이그레이션에서 사용자 데이터를 자동 삭제하지 않는다.

## 26. 백업 합치기

1. 백업 구조와 소유자 검증
2. 현재 로그인 사용자 확인
3. 데이터 유형·ID별 비교
4. 동일 ID는 더 최근 `updatedAt` 유지
5. 같으면 서버 기존 행 유지
6. 다른 ID는 별도 행 유지
7. 모든 복원 행의 `userId`를 현재 사용자로 확인
8. 유효하지 않은 같은 사용자 참조 정리
9. 전체 검증 후 서버 적용
10. 실패 시 기존 서버 데이터 유지

삭제 데이터 동기화는 하지 않는다.

## 27. 초기 데이터

첫 로그인 시 도메인 예시 데이터를 자동 생성하지 않는다. 사용자 설정 행만 없을 때 생성한다.

```ts
export function createInitialSettings(
  id: UUID,
  userId: UserId,
  now: ISODateTime,
): UserSettings {
  return {
    id,
    userId,
    timezone: "Asia/Seoul",
    weekStartsOn: "monday",
    hasSeenPrivacyNotice: false,
    calendarAreaFilters: [...AREAS],
    workdays: {
      monday: { isWorkday: true },
      tuesday: { isWorkday: true },
      wednesday: { isWorkday: true },
      thursday: { isWorkday: true },
      friday: { isWorkday: true },
      saturday: { isWorkday: false },
      sunday: { isWorkday: false },
    },
    workPeriods: [],
    createdAt: now,
    updatedAt: now,
  };
}
```

## 28. 비식별 예시

허용 예시:

- 결핵검진 안내문 발송
- 교직원 제출 현황 확인
- 2학년 관련 담임 확인
- 배드민턴 레슨
- 전자책 원고 검토

학생 이름, 학번, 질병명, 상담 내용과 투약 내용을 예시에 사용하지 않는다.

## 29. 금지 구조

- 학생 이름·학번·연락처·질병·상담·투약·처치 필드
- `Task.isDailyFocus`
- 저장된 마감 표시
- localStorage AppData 원본
- OAuth access token 도메인 테이블
- 클라이언트 제공 이메일 기반 소유권
- RLS 없는 공개 사용자 테이블
- service role을 사용하는 브라우저 Repository
- Reminder 타입과 컬렉션

Reminder는 `ROADMAP.md` Phase 5 이후 검토 항목일 뿐 현재 모델에 추가하지 않는다.

## 30. 인수 조건

- [ ] 모든 사용자 소유 최상위·자식 모델에 `userId`가 있다.
- [ ] 모든 사용자 소유 테이블에 RLS가 활성화된다.
- [ ] SELECT·INSERT·UPDATE·DELETE가 현재 사용자 행으로 제한된다.
- [ ] UPDATE가 `userId` 변경을 허용하지 않는다.
- [ ] `user_id` 소유권 인덱스가 있다.
- [ ] Repository가 임의 사용자 ID 조회를 제공하지 않는다.
- [ ] Supabase Database가 원본이고 localStorage Repository가 없다.
- [ ] localStorage는 초안과 UI 캐시만 저장한다.
- [ ] 수행일·마감일·후속 확인일 명칭이 유지된다.
- [ ] 태그·우선순위·색상·Attachment 검증이 유지된다.
- [ ] 백업이 현재 사용자 데이터만 포함한다.
- [ ] 스키마·백업 버전이 2다.
- [ ] PC·모바일이 같은 계정 데이터에 접근한다.
- [ ] 다른 사용자 데이터 참조가 불가능하다.
- [ ] 학생 개인정보용 데이터 구조가 없다.
# 운동 스티커와 사용자 설정 보완 모델 (2026-07-18)

- `exercise_stickers`는 전 사용자 읽기 가능한 기본 행(`user_id is null`, `is_default = true`)과 사용자 소유 행을 함께 보관한다. 사용자 행은 본인만 생성·수정·삭제한다.
- `exercise_logs`는 사용자, 스티커, 날짜를 필수로 저장하고 시간·메모는 nullable이다. `(user_id, exercise_date, sticker_id)`는 유일하다.
- `user_settings`는 사용자당 한 행이며 월요일 시작, 기본 일정 30분, 일정·마감 알림 on, 운동·작성 도움 on, 기본 밀도를 기본값으로 가진다.
- 기존 `events.area = 'exercise'`와 `bogunon:exercise:v1:` metadata는 호환 읽기 전용 레거시 경로로 유지한다.
