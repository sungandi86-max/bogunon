# 보건온 컴포넌트 가이드

## 1. 문서 목적

이 문서는 보건온 화면을 거대한 컴포넌트 하나로 만들거나 PC·모바일 코드를 중복 구현하지 않도록 컴포넌트 책임, 재사용 경계와 권장 폴더 구조를 정의한다.

컴포넌트를 무조건 작게 나누는 것이 목적이 아니다. 화면 의미, 상태 소유권, 재사용 가능성과 테스트 경계를 기준으로 필요한 만큼만 분리한다.

## 2. 컴포넌트 설계 원칙

### 2.1 Server·Client 구분

- 페이지 초기 인증과 데이터 조회는 가능한 Server Component에서 수행한다.
- 브라우저 상호작용이 필요한 최소 경계에만 `"use client"`를 선언한다.
- Client Component가 필요하다는 이유로 전체 페이지를 Client Component로 만들지 않는다.
- Server Component에서 `window`, `document`, localStorage와 브라우저 전용 이벤트를 사용하지 않는다.

### 2.2 데이터 조회와 표현 분리

- page 또는 feature loader가 데이터를 조회하고 화면용 모델로 정리한다.
- UI 컴포넌트는 전달받은 데이터와 이벤트를 표현한다.
- 프레젠테이션 컴포넌트 안에서 Supabase를 호출하지 않는다.

### 2.3 Repository 경계

- 화면 컴포넌트에서 Supabase 직접 호출을 금지한다.
- PC와 모바일은 동일한 Repository와 도메인 서비스를 사용한다.
- 같은 기능을 위한 PC용·모바일용 Repository를 따로 만들지 않는다.
- UI는 Supabase 테이블명, snake_case 열과 RLS 구현을 알지 못한다.

### 2.4 반응형은 CSS 우선

- 동일한 의미와 상호작용은 하나의 컴포넌트에서 CSS로 재배치한다.
- 데이터 조회를 화면 폭에 따라 두 번 수행하지 않는다.
- 정보 우선순위나 상호작용이 실제로 다른 경우에만 PC·모바일 프레젠테이션을 분리한다.
- CSS로 해결할 수 있는 간격·열·표시 순서를 JavaScript 화면 폭 분기로 구현하지 않는다.

### 2.5 적절한 책임 크기

- 하나의 컴포넌트는 한 화면 영역 또는 한 사용자 행동을 책임진다.
- page는 조합과 초기 데이터 전달을 담당하고 상세 UI를 직접 길게 구현하지 않는다.
- props가 지나치게 많아지면 관련 값을 화면 모델이나 명확한 하위 객체로 묶는다.
- 단 한 곳에서 쓰이는 짧은 마크업을 기계적으로 별도 파일로 만들지 않는다.

### 2.6 지나친 범용화 금지

- 모든 데이터를 `Item`, 모든 행을 `GenericRow`, 모든 CRUD를 `GenericCrud`로 합치지 않는다.
- 업무 행, 일정 항목과 프로젝트 행의 의미 차이를 유지한다.
- 공통 UI primitive와 도메인 컴포넌트를 구분한다.

## 3. 권장 폴더 구조

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   ├── briefing/
│   │   ├── tasks/
│   │   ├── calendar/
│   │   ├── exercise/
│   │   ├── projects/
│   │   └── settings/
│   └── auth/callback/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── briefing/
│   ├── tasks/
│   ├── calendar/
│   ├── events/
│   ├── exercise/
│   ├── projects/
│   ├── templates/
│   ├── memos/
│   ├── settings/
│   ├── feedback/
│   └── ui/
├── features/
│   ├── auth/
│   ├── events/
│   ├── tasks/
│   ├── daily-focus/
│   ├── templates/
│   ├── exercise/
│   ├── projects/
│   ├── memos/
│   ├── settings/
│   └── backup/
├── domain/
│   ├── models/
│   ├── rules/
│   └── mappers/
├── repositories/
│   ├── interfaces/
│   └── supabase/
├── services/
│   ├── briefing/
│   ├── calendar/
│   ├── backup/
│   └── conflicts/
├── lib/
│   ├── supabase/
│   ├── validation/
│   ├── dates/
│   └── cache/
└── types/
```

### 3.1 `app/`

라우팅, Server Component 페이지, 레이아웃, metadata와 route handler를 둔다. page 파일은 feature loader를 호출하고 화면 섹션을 조합한다. 도메인 규칙과 대형 JSX를 넣지 않는다.

### 3.2 `components/`

화면에 보이는 컴포넌트를 둔다.

- `ui/`: Button, Input, Badge 같은 비도메인 primitive
- `feedback/`: 공통 빈 상태·오류·로딩·확인 UI
- 나머지 폴더: 제품 용어에 대응하는 프레젠테이션 컴포넌트

컴포넌트 폴더에서 Repository를 직접 import하지 않는다.

### 3.3 `features/`

사용자 행동 단위의 orchestration을 둔다.

예:

- form state와 validation 연결
- 생성·수정 action 호출
- Repository 결과의 UI 오류 변환
- 화면용 hook 또는 Client boundary

`features/tasks`는 할 일 행동을 담당하고 `components/tasks`는 할 일 표현을 담당한다.

### 3.4 `domain/`

프레임워크에 의존하지 않는 모델, 불변식과 순수 변환을 둔다. React, Supabase Client와 브라우저 API를 import하지 않는다.

### 3.5 `repositories/`

데이터 접근 인터페이스와 Supabase 구현을 둔다. UI 문구와 React 상태를 포함하지 않는다.

### 3.6 `services/`

둘 이상의 Repository 또는 여러 도메인 규칙을 조합하는 작업을 둔다.

예:

- 브리핑 집계
- 캘린더 날짜별 집계
- 참조 해제 삭제
- 템플릿 복사
- 백업 합치기

### 3.7 `lib/`

외부 기술 연결과 범용 기반을 둔다. Supabase client, 런타임 검증 도구, 날짜 함수와 사용자별 초안 캐시가 해당한다.

### 3.8 `types/`

생성된 Supabase Database Type, 외부 라이브러리 보강 타입과 전역적으로 공유해야 하는 기술 타입만 둔다. 도메인 모델을 다시 중복 선언하지 않는다.

## 4. App Shell

### 4.1 `AppShell`

책임:

- 데스크톱 사이드바와 페이지 콘텐츠 조합
- PC·모바일 기본 레이아웃
- 상세 패널·모바일 시트 포털 위치
- 공통 연결 끊김 상태 위치

비책임:

- 페이지 데이터 조회
- 업무·일정 상태 변경
- 인증 소유권 판단

### 4.2 `GlobalNavigation` (데스크톱 사이드바 역할)

- PC 고정 왼쪽 메뉴 표시
- 브리핑·업무·캘린더·운동·프로젝트 이동
- `+ 새로 만들기`, SyncStatus와 ProfileMenu를 위·아래 영역에 배치
- 현재 경로 활성 상태 표시

### 4.3 `MobileBottomNavigation`

- 모바일 브리핑·업무함·일정·운동·설정 메뉴
- 현재 경로 표시
- 하단 안전 영역 확보
- 새로 만들기 버튼을 포함하지 않음

### 4.4 `SyncStatus`

- 동기화됨·저장 중·방금 저장됨·저장 실패·연결 끊김 표현
- 작은 텍스트·아이콘 표현
- 저장 로직 자체는 소유하지 않음

```ts
type SyncState =
  | "synced"
  | "saving"
  | "justSaved"
  | "saveFailed"
  | "offline";
```

### 4.5 `ProfileMenu`

- 프로필 아바타
- 계정 식별 정보
- 설정 이동과 로그아웃 동작
- Google 계정 연동 배너를 표시하지 않음

### 4.6 `PageHeader`

- 페이지 제목
- 짧은 설명 또는 날짜
- 화면별 주요 행동
- 선택적 보조 도구막대 영역

모든 페이지 헤더를 한 가지 큰 hero 형태로 강제하지 않는다.

### 4.7 `ResponsiveDetailPanel`

- PC 우측 패널과 좁은 화면 오버레이 전환
- 열기·닫기
- `Esc` 처리
- 포커스 이동·복귀
- 미저장 변경 닫기 확인 진입점

상세 콘텐츠와 form state는 외부에서 전달받는다.

### 4.8 `MobileSheet`

- 모바일 하단 시트 표면과 포커스 관리
- safe area, backdrop, 스크롤 잠금
- 내부 폼 로직을 소유하지 않음

## 5. 인증 컴포넌트

### 5.1 `LoginScreen`

- 로그인 화면 레이아웃
- 제품 설명과 개인정보 안내
- GoogleLoginButton과 AuthErrorMessage 조합

### 5.2 `GoogleLoginButton`

- 로그인 동작 호출
- 진행 중 중복 클릭 방지
- Google 공식 브랜드 지침을 따르는 로고 표시

Google 공식 로고와 Supabase 로고를 변형, 재색칠, 합성하거나 보건온 아이콘으로 대체하지 않는다. Supabase 로고는 사용자 로그인 버튼에 불필요하게 표시하지 않는다.

### 5.3 `AuthErrorMessage`

- 로그인 취소·실패 메시지
- 재시도 행동
- 내부 OAuth 오류 코드 비노출

### 5.4 `ProtectedRouteBoundary`

- 보호 레이아웃의 인증 결과에 따른 렌더링 경계
- 인증 확인 중·미인증·인증 상태 표현
- 소유권 판단과 RLS를 대체하지 않음

### 5.5 `SessionExpiredDialog`

- 세션 만료 안내
- 다시 로그인 행동
- 작성 중 입력 유지 여부 안내

## 6. 브리핑 컴포넌트

### 6.1 `BriefingHeader`

- 날짜·요일
- 현재 근무 상태
- 퇴근까지 남은 시간
- DailySummaryText

### 6.2 `DailySummaryText`

- 이미 계산된 문장 또는 summary model 표현
- AI 생성 금지
- 컴포넌트 안에서 원본 배열을 다시 집계하지 않음

### 6.3 `DailyFocusSection`

- 최대 3개 핵심 업무
- 완료·완료 취소
- 지정 수 표시
- 전체 업무 선택 진입

### 6.4 `WaitingWorkSection`

- 회신 대기·확인 필요 탭 또는 분할 필터
- 수량과 최대 목록
- 같은 업무 중복 표시 금지

### 6.5 `TodayTimeline`

- 시간순 일정 표현
- 종일·시간·시간 없음 정렬 결과 표시
- 현재 시각 인디케이터

### 6.6 `DeadlineSection`

- 기한 경과·오늘 마감·마감 임박 목록
- 계산은 날짜 도메인 함수 또는 briefing service에서 수행

### 6.7 `TodayExerciseSection`

- 오늘 운동 일정과 목표
- 운동 상세 진입

### 6.8 `CompactMonthCalendar`

- 날짜 탐색
- 조밀한 날짜별 마커
- 선택 날짜 변경
- 전체 캘린더 이동

### 6.9 `SelectedDateSummary`

- 선택 날짜 수량과 최대 5개 간단 목록
- 항목 선택 시 상세 진입

### 6.10 PC·모바일 데이터 공유

Server loader 또는 `briefing` service가 다음 하나의 화면 모델을 만든다.

```ts
interface BriefingViewModel {
  selectedDate: LocalDate;
  summaryText: string[];
  dailyFocus: TaskListItemViewModel[];
  waiting: TaskListItemViewModel[];
  needsCheck: TaskListItemViewModel[];
  timeline: CalendarItemViewModel[];
  deadlines: TaskListItemViewModel[];
  exercise: ExerciseSummaryViewModel[];
  nextPersonalEvent: CalendarItemViewModel | null;
  compactCalendar: CalendarMonthSummary;
}
```

PC는 중앙 캘린더와 오른쪽 운영 열로 배치하고 모바일은 같은 데이터를 단일 열로 배치한다. 모바일 전용 별도 조회와 Repository를 만들지 않는다. 모바일 주간 스트립은 같은 날짜 집계 데이터에서 필요한 7일만 표현한다.

## 7. 업무 컴포넌트

### 7.1 `TaskList`

- 업무 행 반복과 목록 상태
- 정렬된 items를 받음
- 자체 조회 금지
- 빈 상태·로딩·오류 slot 허용

### 7.2 `TaskRow`

- 한 줄 또는 두 줄 요약
- 완료, 제목, 업무 카테고리, 영역, 반복, 상태, 우선순위와 날짜
- 행 선택·완료 토글 이벤트 전달
- 체크리스트 전체와 긴 메모 표시 금지

### 7.3 `TaskFilters`

- 카테고리·완료 여부·기간·우선순위 필터
- 업무·일정 제목과 메모의 입력 즉시 검색
- Phase 4에서는 화면 로컬 상태로 즉시 필터링하며 URL 검색 파라미터 동기화는 후속 개선으로 둠
- 데이터 자체 필터링 책임은 `TaskWorkspace`의 feature 함수에 둠

### 7.4 배지

- `TaskStatusBadge`: 6개 상태
- `TaskPriorityBadge`: 낮음·보통·높음
- `TaskDeadlineBadge`: 마감 임박·오늘 마감·기한 경과

각 배지는 텍스트를 포함하며 색상만으로 의미를 전달하지 않는다.

### 7.5 `TaskDetail`

- 읽기 전용 상세 정보
- 체크리스트, 연결, 메모와 링크
- 편집·삭제 진입
- 데이터 수정 form state를 소유하지 않음

### 7.6 `TaskEditor`

- 생성·수정 공용 폼
- 초기값, validation 결과와 submit handler를 props로 받음
- userId 입력 필드 금지
- 세부 입력 접기·펼치기

### 7.7 `ChecklistEditor`

- 항목 추가·수정·삭제·순서 변경
- 빈 항목 금지
- 학생 개인정보 안내 근접 표시

### 7.8 `TagInput`

- 자유 입력 태그 추가·삭제
- trim, 빈 값·중복 방지
- 별도 태그 관리 화면을 만들지 않음

### 7.9 `DailyFocusToggle`

- 선택 날짜 지정·해제
- 최대 3개 제한 오류 표현
- 완료·보류 신규 지정 차단 결과 표현

### 7.10 TaskRow와 TaskDetail 경계

- TaskRow는 스캔 가능한 요약과 빠른 상태 행동만 제공한다.
- TaskDetail은 전체 필드와 연결 관계를 제공한다.
- TaskRow에 긴 체크리스트나 편집 폼을 펼치지 않는다.
- TaskDetail이 목록 정렬·필터를 소유하지 않는다.

## 8. 캘린더 컴포넌트

### 8.1 데이터 집계 공유

`services/calendar`는 원본 일정·할 일을 날짜별 `CalendarDaySummary`와 `CalendarItemViewModel`로 변환한다.

```ts
interface CalendarDaySummary {
  date: LocalDate;
  eventCount: number;
  taskCount: number;
  deadlineCount: number;
  exerciseCount: number;
  markers: CalendarMarker[];
}
```

### 8.2 `CompactMonthCalendar`

- 브리핑용 날짜 탐색
- 조밀한 셀과 제한된 마커
- 긴 제목 표시 금지

### 8.3 `FullMonthCalendar`

- 월 단위 전체 조망
- 일정·업무·스티커를 통합 정렬하고 모바일 5주 최대 2개, 6주 최소 1개, PC 실제 셀 높이 기준 최대 4개와 정확한 초과 수 표시
- 날짜 상세 진입

축소 달력과 전체 월간 달력은 집계 로직, 날짜 계산 primitive와 접근성 hook을 공유한다. 하나의 달력 컴포넌트를 CSS로 단순 확대·축소하지 않는다.

### 8.4 `WeekCalendar`

- 시간 축·종일 영역·업무 영역
- 일정 블록과 현재 시각
- 드래그·리사이즈 기능 없음

### 8.5 `AgendaList`

- 날짜별 목록 그룹
- 일정·수행일·마감·운동 표시

### 8.6 `MobileWeekStrip`

- 7일 날짜 탐색
- 선택일·오늘·마커
- 날짜 변경 이벤트
- 브리핑 데이터 재사용

### 8.7 `CalendarToolbar`

- 이전·다음 기간
- 오늘 이동
- 월간·주간·목록 전환
- 현재 기간 제목

### 8.8 `CalendarFilters`

- 5개 영역 필터
- URL 검색 파라미터 연동
- 필터 결과 조회는 상위 feature 담당

### 8.9 `CalendarDayCell`

- 날짜, 오늘·선택 상태, marker와 초과 수
- 화면 종류별 variant는 제한적으로 허용
- 항목 조회 금지

### 8.10 `SelectedDateList`

- 선택 날짜의 전체 항목
- 정렬 결과 표현
- 상세 패널 또는 모바일 상세 진입

### 8.11 `CalendarItem`

- 일정·수행일 할 일·마감일·운동 일정의 공통 시각 표현
- 판별 가능한 `kind`에 따라 아이콘과 메타 정보 변경
- 원본 모델 전체를 받지 않고 표시 모델을 받음

## 9. 일정 컴포넌트

### 9.1 `EventEditor`

- 일정 생성·수정 공용 폼
- 종일·시간·기간 값 조정
- ExerciseEventFields 조건부 표시

### 9.2 `EventDetail`

- 제목, 영역, 날짜·시간, 연결 업무, 메모와 링크
- 편집·삭제 진입

### 9.3 `EventTimeFields`

- 종일 여부
- 시작·종료 날짜
- 시작·종료 시간
- 날짜·시간 오류 근접 표시

### 9.4 `EventTaskLinker`

- 같은 사용자 범위의 연결 가능한 할 일 선택 UI
- 한 할 일의 대표 일정 변경 확인
- Repository 호출은 상위 feature 담당

### 9.5 `ExerciseEventFields`

- 운동 종류·장소·목표
- `area === "exercise"`에서만 표시

## 10. 운동 컴포넌트

### 10.1 `ExerciseSummary`

- 오늘 운동과 목표
- 상세 진입

### 10.2 `ExerciseScheduleList`

- 예정 운동 목록
- 시간·장소·완료 상태

### 10.3 `ExerciseRecordEditor`

- 완료 여부·실제 운동일·강도·컨디션·메모
- 일정당 하나의 기록 편집

### 10.4 `ExerciseConditionInput`

- 허용된 컨디션 선택
- 텍스트 라벨과 선택 상태 제공

### 10.5 `RecentExerciseList`

- 최근 운동 기록의 날짜순 목록
- 자체 통계 생성 금지

## 11. 프로젝트 컴포넌트

### 11.1 `ProjectList`

- 프로젝트 행 목록과 목록 상태

### 11.2 `ProjectRow`

- 이름·진행률·마감일·대표 다음 행동
- 상세 진입

### 11.3 `ProjectDetail`

- 전체 정보, 연결 업무와 편집·삭제 진입

### 11.4 `ProjectEditor`

- 생성·수정 공용 폼
- 진행률·색상·링크와 대표 다음 행동 조합

### 11.5 `ProjectProgressInput`

- 0~100 정수 직접 입력
- 연결 업무 기반 자동 계산 금지

### 11.6 `ProjectNextActionEditor`

- 연결된 미완료 할 일 또는 직접 텍스트 중 한 방식
- 두 값 동시 저장 금지
- 직접 텍스트에서 할 일 자동 생성 금지

### 11.7 `ProjectTaskLinker`

- 할 일 연결·해제
- 대표 다음 행동과의 관계 안내

## 12. 반복 업무 템플릿 컴포넌트

- `TemplateList`: 템플릿 목록과 상세 진입
- `TemplateEditor`: 기본 정보 생성·수정
- `TemplateChecklistEditor`: 템플릿 체크리스트
- `TemplateCopyPreview`: 복사 전 실제 할 일 미리보기·수정
- `TemplateYearPicker`: 적용 연도와 날짜 유효성 확인

템플릿 저장과 실제 복사를 별도 행동으로 유지한다. TemplateEditor가 저장 후 자동 복사하지 않는다.

## 13. 빠른 메모 컴포넌트

- `QuickMemoList`: 생성 시각순 메모 목록
- `QuickMemoEditor`: 내용 생성·수정
- `QuickMemoConvertDialog`: 일정·할 일 전환과 원본 유지·삭제 선택

전환 Dialog는 새 일정·할 일 form feature를 재사용하고 필드 정의를 복제하지 않는다.

## 14. 설정 컴포넌트

### 14.1 `WorkScheduleEditor`

- 요일 설정 전체 조합
- 검증 오류 요약

### 14.2 `WorkdayEditor`

- 근무일 여부와 출퇴근 시간

### 14.3 `WorkPeriodEditor`

- 교시·점심·방과 후 구간
- 겹침·근무시간 범위 오류 표시

### 14.4 `PrivacyNotice`

- 학생 개인정보 금지 안내
- 도움말·첫 확인 상태

### 14.5 `BackupPanel`

- 내보내기·가져오기
- 합치기·교체 확인
- 결과 요약

### 14.6 `AccountSettings`

- 계정 식별 정보
- 로그아웃
- 큰 계정 연동 버튼 금지

## 15. 공통 피드백 컴포넌트

### 15.1 `EmptyState`

- 제목·설명·선택적 주요 행동
- 수달 캐릭터 선택 사용
- 도메인별 독립 문구 전달

### 15.2 `SectionError`

- 섹션 조회 오류
- 다시 시도
- 기존 데이터 자동 제거 금지

### 15.3 `InlineFieldError`

- 필드와 연결된 오류 메시지
- 접근성 설명 ID 지원

### 15.4 `LoadingRows`

- 목록 구조와 유사한 스켈레톤
- 대형 카드 스켈레톤 반복 금지

### 15.5 `SaveStatus`

- 저장 중·성공·실패
- SyncStatus와 역할 구분: SaveStatus는 현재 form, SyncStatus는 App Shell 전역 표현

### 15.6 `ConfirmationDialog`

- 삭제·교체·연결 해제 확인
- 기본 포커스 취소

### 15.7 `ConflictDialog`

- 최신 내용 다시 불러오기
- 현재 입력으로 교체
- 충돌 데이터를 조용히 병합하지 않음

### 15.8 `OfflineNotice`

- 연결 끊김 안내
- 저장에 연결이 필요함을 표시
- 오프라인 큐를 구현하지 않음

## 16. 새로 만들기 흐름

### 16.1 컴포넌트 구조

- `CreateItemLauncher`: 사이드바, 오른쪽 빠른 추가, 모바일 상단과 화면별 진입점
- `CreateTypePicker`: 보건업무·학교일정·운동·개인·프로젝트 업무 선택
- `CreateItemPanel`: PC 우측 패널 조합
- `CreateItemSheet`: 모바일 하단 시트 조합

### 16.2 공유 경계

```text
CreateItemLauncher
  → CreateTypePicker
  → shared create feature state
      ├── desktop: CreateItemPanel
      └── mobile: CreateItemSheet
          └── EventEditor 또는 TaskEditor
```

- form schema, 초기값, validation, submit action은 공유한다.
- PC 패널과 모바일 시트는 컨테이너·배치만 다르다.
- EventEditor와 TaskEditor를 PC·모바일용으로 복제하지 않는다.
- 화면 크기 전환 중 작성 값이 사라지지 않게 form state는 컨테이너보다 상위 feature boundary가 소유한다.

## 17. Server·Client 경계

### 17.1 Server Component 후보

- 보호 레이아웃
- 초기 인증 확인
- 페이지 초기 데이터 loader
- 읽기 전용 초기 화면 조합
- SEO·metadata
- 서버에서 안전하게 실행하는 Repository 호출

### 17.2 Client Component 후보

- 달력 날짜 선택과 보기 전환
- 생성·수정 폼
- 필터와 정렬 상호작용
- 상세 패널과 하단 시트
- 체크리스트·상태 변경
- optimistic UI
- 충돌 대화상자
- 온라인 상태 감지
- localStorage 폼 초안

### 17.3 경계 예시

```tsx
// Server Component
export default async function BriefingPage() {
  const model = await loadBriefingPage();
  return <BriefingScreen initialModel={model} />;
}

// Client boundary
"use client";
export function BriefingScreen({ initialModel }: BriefingScreenProps) {
  // 날짜 선택, 패널 열기 등 상호작용만 담당
}
```

Server Component 안에서 브라우저 전용 API를 사용하지 않는다. Client Component가 Repository 구현체를 직접 생성하지 않는다.

## 18. 상태 관리 원칙

### 18.1 서버 원본 데이터

- 일정·할 일·프로젝트 등 도메인 데이터
- 서버 데이터 도구 또는 Server Component 재조회로 관리
- 전역 React store에 전체 복제하지 않음

### 18.2 URL 검색 파라미터

- 캘린더 보기 유형
- 선택 날짜
- 업무 영역·상태·우선순위 필터
- 목록 정렬

공유하거나 새로고침 후 유지할 가치가 있는 탐색 상태에 사용한다.

### 18.3 컴포넌트 로컬 상태

- 팝오버 열림
- 임시 hover·선택
- 세부 입력 접힘
- 현재 탭

### 18.4 폼 상태

- Editor 또는 feature form boundary가 소유한다.
- 서버 원본과 입력 중 값을 분리한다.
- 저장 성공 전 원본으로 간주하지 않는다.

### 18.5 사용자별 임시 초안

- 저장 전 폼 초안만 localStorage 사용
- 사용자별 key namespace
- 저장 성공·로그아웃 시 제거
- 도메인 원본 캐시 금지

### 18.6 전역 상태가 필요한 경우

- 상세 패널의 현재 콘텐츠
- 새로 만들기 flow
- 전역 동기화 표현

먼저 AppShell context와 기본 React 상태로 해결한다. 서버 데이터 도구와 React로 충분한데 대형 상태관리 라이브러리를 임의 추가하지 않는다.

## 19. 폼 공통 규칙

### 19.1 생성·수정 재사용

- 같은 Editor를 mode와 initialValues로 재사용한다.
- 생성·수정별로 필드 JSX를 복제하지 않는다.
- submit action만 명확히 분리할 수 있다.

### 19.2 상태 분리

- 초기값
- 클라이언트 validation 오류
- 서버 validation 오류
- 저장 중
- 충돌
- 저장 성공

위 상태를 하나의 문자열 오류나 boolean으로 합치지 않는다.

### 19.3 제출

- 저장 중 중복 제출 금지
- 저장 실패 시 입력 유지
- 성공 후 초안 제거
- 패널·시트 닫기는 성공 후 수행

### 19.4 개인정보 안내

- 보건업무 메모·체크리스트 가까이에 배치
- 빠른 메모·템플릿·백업에도 표시
- 학생 개인정보 입력을 유도하는 placeholder 금지

### 19.5 날짜

- 날짜 전용 값은 `YYYY-MM-DD` 문자열로 유지
- 브라우저 Date나 UTC 자정으로 폼 상태를 변환하지 않음
- 시간대 변환은 정확한 시각에만 적용

### 19.6 소유권 필드

- userId 입력, hidden input과 select 금지
- 화면에서 userId를 편집·전달하지 않음
- 소유권은 서버와 RLS가 판단

### 19.7 모바일 키보드

- 하단 시트에서 포커스 필드가 키보드 뒤에 가리지 않게 스크롤
- 날짜·시간·숫자 필드에 맞는 input mode 사용
- 저장 버튼과 오류 메시지 접근 유지

## 20. 컴포넌트 금지 패턴

- `Dashboard.tsx` 하나에 브리핑·캘린더·업무·운동 전부 구현
- PC·모바일 페이지를 완전히 별도 코드로 복제
- 화면 컴포넌트에서 Supabase 직접 호출
- props 수가 과도한 범용 카드
- 모든 기능을 하나의 `GenericCrud`
- 모든 모델을 하나의 `Item`
- UI 컴포넌트에서 RLS 또는 userId 권한 판단
- localStorage를 도메인 원본으로 읽기
- 날짜 셀 안에서 Repository 호출
- 하나의 MonthCalendar를 CSS 확대만으로 축소·전체 달력에 모두 사용
- 참고 서비스 이름을 파일·컴포넌트·variant 이름에 사용
- shadcn/ui primitive를 제품 용어 없이 그대로 페이지에 대량 조합

## 21. 컴포넌트별 테스트 기준

### 21.1 공통

- 빈 상태
- 로딩
- 조회 오류
- 키보드 탐색
- 접근 가능한 이름
- 모바일·PC 레이아웃

### 21.2 업무

- 6개 상태 배지 라벨
- 3개 우선순위 배지
- 마감 배지 규칙
- 완료·완료 취소
- 최대 3개 핵심 업무
- 저장 실패 후 입력 유지
- 개인정보 안내

### 21.3 달력

- 월요일 시작
- 오늘·선택 날짜 구분
- 날짜 선택 callback
- 최대 항목과 `+N`
- 수행일·마감일 중복 규칙
- 키보드 날짜 이동
- 축소·전체 달력의 서로 다른 표현

### 21.4 상세 패널

- 열릴 때 포커스 이동
- `Esc` 닫기
- 닫은 뒤 포커스 복귀
- 미저장 변경 확인
- 좁은 화면 오버레이

### 21.5 하단 시트

- 포커스 트랩
- safe area
- 배경 스크롤 잠금
- 키보드 표시 중 필드 접근
- 닫은 뒤 launcher 포커스 복귀

### 21.6 폼

- 초기값과 사용자 입력 분리
- 클라이언트·서버 오류 분리
- 중복 제출 차단
- 충돌 대화상자
- 실패 시 입력 유지
- 성공 시 초안 제거

## 22. 인수 조건

- [ ] page 컴포넌트가 라우팅·조회·조합 이상의 거대한 JSX를 갖지 않는다.
- [ ] PC·모바일 데이터 로직과 Repository가 중복되지 않는다.
- [ ] UI 컴포넌트가 Supabase 구현을 알지 못한다.
- [ ] 축소 달력과 전체 달력의 역할과 컴포넌트가 구분된다.
- [ ] 두 달력은 날짜 집계와 접근성 로직을 공유한다.
- [ ] 우측 패널과 모바일 시트가 같은 Editor·form logic을 공유한다.
- [ ] 사용자 소유권 판단은 서버와 RLS에 있다.
- [ ] userId 입력 필드가 없다.
- [ ] Server Component에서 브라우저 API를 사용하지 않는다.
- [ ] 도메인 데이터 전체를 전역 store나 localStorage에 복제하지 않는다.
- [ ] 컴포넌트명이 보건온 제품 용어와 일치한다.
- [ ] 빈 상태·오류·포커스·모바일·PC 테스트가 존재한다.
- [ ] 학생 개인정보 금지 안내가 지정된 입력 흐름에 표시된다.
- [ ] 참고 서비스의 컴포넌트 구조와 이름을 모방하지 않는다.
# 모바일 일정·운동·설정 컴포넌트 보완 (2026-07-18)

- `MobileDailySchedule`: 다음 일정, 오늘 업무 최대 3건과 시간순 오늘 일정을 표시한다.
- `ExerciseSticker`: 로컬 SVG 자산과 xs/sm/md/lg 크기, 선택·비활성·제거 가능 상태를 일관되게 표현한다.
- `ExerciseStickerPicker`: 날짜와 스티커를 서버 action에 전달해 즉시 저장하고 중복 탭을 안내한다.
- `ExerciseStickerCalendar`: 날짜별 두 스티커와 `+N`, 월 이동, 선택 날짜 기록을 표시한다.
- `SettingsForm`: 신규 사용자 기본값과 기존 행을 같은 폼으로 편집하고 소유자 기반 upsert를 사용한다.
