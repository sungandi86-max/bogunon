# 보건온 개발 로드맵

## 1. 문서 목적

이 문서는 보건온 MVP를 작고 검증 가능한 개발 단계로 나눈 실행 계획이다. 각 Phase는 독립적으로 실행·검증·커밋할 수 있어야 하며, 다음 Phase에 필요한 기반만 구현한다.

## 2. 개발 원칙

1. `PROJECT.md`, `AI_RULES.md`, `PRODUCT_SPEC.md`, `DATA_MODEL.md`, `SCREEN_SPEC.md`, `DESIGN_SYSTEM.md`, `COMPONENT_GUIDE.md`를 구현 기준으로 사용한다.
2. 한 Phase에서 다음 Phase의 기능을 미리 구현하지 않는다.
3. DB 변경은 migration으로 관리한다.
4. 화면은 Repository를 통해 데이터에 접근한다.
5. 자동 검증과 수동 화면 검증을 모두 수행한다.
6. 각 Phase 종료 시 문서와 코드 상태를 일치시킨다.
7. 학생 개인정보용 필드, 예시와 로그를 만들지 않는다.
8. 검증이 실패한 상태로 다음 Phase에 진행하지 않는다.
9. 아래 명령은 `package.json`에 대응 스크립트를 정의한 뒤 사용한다. 실제 도구 버전에 따라 스크립트 내부 명령은 조정할 수 있지만 검증 목적은 변경하지 않는다.

공통 검증 명령:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## 3. 전체 Phase 요약

| Phase | 결과물 | 핵심 검증 |
|---:|---|---|
| 0 | 저장소·문서·도구 기반 | 설치, lint, test, build |
| 1 | App Shell·정적 디자인 시스템 | PC·모바일 시각 검증 |
| 2 | Google 로그인·세션 | 로그인·보호·로그아웃 |
| 3 | DB Schema·RLS | A/B/비로그인 보안 테스트 |
| 4 | Repository·도메인 계층 | 매핑·검증·충돌 단위 테스트 |
| 5 | 할 일·오늘 꼭 끝낼 일 | CRUD·상태·3개 제한 |
| 6 | 일정·브리핑 달력 | 일정 CRUD·축소 달력·주간 스트립 |
| 7 | 전체 캘린더 | 월간·주간·목록·필터 |
| 8 | 반복 업무 템플릿 | 검토 후 복사 |
| 9 | 운동 기록 | 일정별 단일 기록 |
| 10 | 프로젝트 | 진행률·대표 다음 행동 |
| 11 | 빠른 메모 | CRUD·전환 |
| 12 | 근무시간·교시 | 상태·남은 시간 계산 |
| 13 | JSON 백업·복원 | 소유자·병합·원본 보존 |
| 14 | 통합 QA·배포 | E2E·접근성·배포 검증 |

## 4. Phase 0 — 저장소와 문서 정리

### 목표

저장소 기본 구조, 품질 도구와 로컬 개발 기반을 확정한다.

### 구현 범위

- Next.js App Router, TypeScript, Tailwind CSS
- shadcn/ui와 Lucide Icons 기본 구성
- ESLint
- 단위 테스트 기반과 DOM 테스트 환경
- `docs/` 폴더에 확정 문서 배치
- `.env.example`
- Supabase CLI 기본 구성과 로컬 설정 파일
- npm scripts: `dev`, `build`, `typecheck`, `lint`, `test`
- 빈 App Router 진입 페이지

### 생성 또는 수정 파일

- `package.json`, lockfile
- `tsconfig.json`, ESLint 설정
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `components.json`
- `docs/*.md`
- `.env.example`
- `supabase/config.toml`
- 테스트 설정 파일
- `README.md`

### 제외 범위

- 실제 제품 화면
- 실제 DB 테이블과 migration
- 인증 연결
- Supabase 원격 프로젝트 변경

### 완료 조건

- 새 환경에서 의존성 설치와 개발 서버 실행이 가능하다.
- 문서 파일명이 정확하고 상호 링크가 유효하다.
- 환경변수 실제 값이 저장소에 없다.
- 기본 페이지가 오류 없이 열린다.

### 자동 검증

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

### 수동 검증

- PC와 모바일 폭에서 기본 페이지가 가로 스크롤 없이 열린다.
- `.env.example`에 변수명만 있고 비밀값이 없다.
- git 변경 목록에 `.env.local`이 없다.

### 커밋 예시

```text
chore: initialize bogeonon development foundation
```

## 5. Phase 1 — App Shell과 정적 디자인 시스템

### 목표

보건온 고유의 화면 뼈대와 공통 UI를 정적 데이터로 구현한다.

### 구현 범위

- 디자인 토큰과 기본 타이포그래피
- PC 상단 글로벌 내비게이션
- 모바일 하단 메뉴
- 반응형 App Shell
- 정적 로그인 화면
- 정적 브리핑 2열 구조
- 우측 상세 패널
- 새로 만들기 패널·모바일 시트
- 버튼, 입력, 배지, 업무 행, 구분선 목록
- 축소 달력·전체 달력·타임라인 자리의 정적 UI
- 로딩·빈 상태·오류 상태 컴포넌트

### 생성 또는 수정 파일

- `app/(public)/login/page.tsx`
- `app/(app)/layout.tsx`
- `app/(app)/briefing/page.tsx`
- `components/layout/*`
- `components/ui/*`
- `components/feedback/*`
- `components/calendar/*`의 정적 프레젠테이션
- `styles/` 또는 CSS 변수 정의

### 제외 범위

- Supabase 조회·저장
- 실제 CRUD
- Google OAuth
- 도메인 Repository
- 실제 날짜 집계

### 완료 조건

- PC에 고정 3열 대시보드가 없다.
- 브리핑은 60~65% 업무 영역과 35~40% 날짜 탐색 영역이다.
- 모바일은 브리핑·업무함·일정·운동·설정 하단 메뉴를 사용한다.
- 대형 원형 플로팅 추가 버튼이 없다.
- 우측 상세 패널은 기본 닫힘이고 선택 시 열린다.
- 민트 중심 화면이나 큰 흰색 카드 반복이 없다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

컴포넌트 테스트:

- 내비게이션 활성 상태
- 패널 열기·닫기와 `Esc`
- 모바일 시트 포커스 복귀
- 빈 상태와 오류 상태 렌더링

### 수동 검증

- 375×812, 768×1024, 1280×800, 1440×900에서 확인한다.
- 브리핑 핵심 업무가 축소 달력보다 먼저 읽힌다.
- 모바일 초기 화면에 주간 스트립과 핵심 업무가 보인다.
- 키보드 포커스가 식별 가능하다.
- 디자인 차별성 체크리스트를 통과한다.

### 커밋 예시

```text
feat: build app shell and static design system
```

## 6. Phase 2 — Supabase 기반과 Google 로그인

### 진행 상태

- 상태: 완료
- 완료일: 2026-07-17
- 구현 기준 커밋: `0bd371c` (`feat: implement Google authentication`)
- 실제 Google OAuth 로그인, 콜백, 새로고침 후 세션 유지와 로그아웃을 localhost와 Production에서 검증했다.
- Phase 3 Database Schema와 RLS는 시작하지 않았다.

### 인증 환경설정 체크리스트

- [x] 로컬 Supabase Project URL과 Publishable Key 설정
- [x] Supabase Authentication Site URL과 Redirect URLs 설정
- [x] Google Cloud Web OAuth Client의 Authorized JavaScript origins 설정
- [x] Google Cloud Web OAuth Client의 Authorized redirect URIs 설정
- [x] Supabase Google Provider 활성화
- [x] Vercel Production 환경변수 설정 및 재배포
- [x] localhost와 Production의 `/auth/callback` 로그인 흐름 검증

### 목표

Supabase 프로젝트 연결, Google OAuth, 쿠키 기반 세션과 보호 화면을 구현한다.

### 구현 범위

- browser/server Supabase client 분리
- OAuth callback
- 공식 세션 갱신·보호 흐름
- Google 로그인과 로그아웃
- 로그인 후 브리핑 이동
- 새로고침 후 세션 유지
- 세션 만료 처리
- 기본 사용자 설정 생성 진입점
- 인증 환경변수
- 인증 테스트

### 생성 또는 수정 파일

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- 공식 보호 흐름에 필요한 proxy 또는 middleware 파일
- `app/auth/callback/route.ts`
- 로그인·로그아웃 action 또는 route
- 인증 상태 컴포넌트
- `.env.example`
- 인증 테스트

### 제외 범위

- 제품 데이터 테이블
- 업무·일정 CRUD
- service role 기반 사용자 요청
- 다른 로그인 제공자

### 완료 조건

- 비로그인 사용자는 보호 화면에 접근할 수 없다.
- 로그인 후 브리핑으로 이동한다.
- 새로고침 후 세션이 유지된다.
- 로그아웃 후 데이터 화면이 제거된다.
- OAuth 취소·오류·세션 만료가 한국어로 표시된다.
- secret/service role key가 브라우저 번들에 없다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:auth
```

### 수동 검증

- 실제 Google 계정으로 로그인·새로고침·로그아웃한다.
- 로그아웃 후 브라우저 뒤로 가기로 보호 화면이 보이지 않는지 확인한다.
- 개발자 도구에서 secret/service role 값이 없는지 확인한다.

### 커밋 예시

```text
feat: implement Google authentication
```

## 7. Phase 3 — Database Schema와 RLS

### 목표

사용자 소유 데이터를 저장할 테이블, 제약, 인덱스와 RLS를 migration으로 구현한다.

### 구현 범위

테이블:

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

DB 작업:

- `user_id`
- 외래키
- check·unique 제약
- 소유권·날짜·상태 인덱스
- RLS 활성화
- SELECT·INSERT·UPDATE·DELETE 정책
- 사용자 A/B/비로그인 테스트
- Supabase Database Type 생성

### 생성 또는 수정 파일

- `supabase/migrations/*_create_bogeonon_schema.sql`
- `types/database.ts`
- `supabase/tests/` 또는 DB 보안 테스트 파일
- 스키마 생성 스크립트

### 제외 범위

- 화면 CRUD 연결
- Realtime
- Storage와 첨부 업로드
- 관리자·공유 정책

### 완료 조건

- 모든 사용자 소유 테이블에 RLS가 활성화된다.
- 사용자 A는 자기 행 CRUD가 가능하다.
- 사용자 A는 사용자 B 행 SELECT·INSERT·UPDATE·DELETE가 불가능하다.
- 비로그인 요청은 사용자 데이터에 접근하지 못한다.
- UPDATE로 `user_id`를 바꿀 수 없다.
- 외래키·check·unique 제약이 잘못된 데이터를 거부한다.
- 생성 Type이 현재 migration과 일치한다.
- DB advisor의 보안 오류가 없다.

### 자동 검증

```bash
supabase start
supabase db reset
npm run db:types
npm run test:rls
npm run typecheck
supabase db lint
```

사용 중인 CLI에서 지원하는 advisor 명령을 `--help`로 확인한 뒤 보안·성능 advisor를 실행한다.

### 수동 검증

- Supabase Studio에서 테이블·제약·인덱스·정책을 확인한다.
- 사용자 A/B 토큰과 비로그인 요청을 각각 실행한다.
- 클라이언트 필터를 제거해도 RLS가 데이터 격리를 유지하는지 확인한다.

### 커밋 예시

```text
feat: add database schema and row level security
```

## 8. Phase 4 — Repository와 도메인 계층

### 목표

화면과 Supabase를 분리하고 검증 가능한 도메인 접근 계층을 구현한다.

### 구현 범위

- 도메인 타입
- Runtime Validation
- EventRepository
- TaskRepository
- DailyFocusRepository
- TemplateRepository
- ExerciseRepository
- ProjectRepository
- QuickMemoRepository
- SettingsRepository
- AuthContext
- DraftCache
- camelCase ↔ snake_case Adapter
- Result와 오류 매핑
- 날짜 계산 유틸리티
- `updatedAt` 기반 충돌 처리 기반

### 생성 또는 수정 파일

- `domain/types/*`
- `domain/validation/*`
- `domain/date/*`
- `repositories/interfaces/*`
- `repositories/supabase/*`
- `repositories/mappers/*`
- `lib/auth-context.ts`
- `lib/draft-cache.ts`
- 단위 테스트

### 제외 범위

- 전체 화면 CRUD 연결
- 범용 CRUD 프레임워크
- localStorage 도메인 Repository
- 오프라인 쓰기 큐

### 완료 조건

- UI 코드가 테이블 snake_case를 직접 다루지 않는다.
- 모든 Repository가 Result 스타일을 사용한다.
- 인증되지 않은 호출이 명확한 오류로 반환된다.
- 매퍼 왕복 변환이 데이터 손실 없이 동작한다.
- 날짜·마감·후속 확인 계산이 `Asia/Seoul` 기준이다.
- 충돌 시 자동 덮어쓰지 않는 결과를 반환한다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test -- domain repositories
npm run build
```

### 수동 검증

- Repository 오류가 사용자 입력 원문을 포함하지 않는지 확인한다.
- localStorage에 도메인 데이터 전체가 저장되지 않는지 확인한다.
- Supabase 행과 도메인 객체의 날짜·열거 값이 일치하는지 확인한다.

### 커밋 예시

```text
feat: implement domain repositories and validation
```

## 9. Phase 5 — 할 일과 오늘 꼭 끝낼 일

### 목표

할 일 전체 흐름과 날짜별 핵심 업무 지정 기능을 완성한다.

### 구현 범위

- 업무 목록·상세·생성·수정·삭제
- 체크리스트
- 상태·우선순위·태그
- 수행일·마감일·후속 확인일
- 완료·완료 취소
- 회신 대기·확인 필요
- 마감 임박·오늘 마감·기한 경과 계산
- 오늘 꼭 끝낼 일 지정·해제·3개 제한
- 모바일 업무함
- 폼 초안 캐시

### 생성 또는 수정 파일

- 업무 route와 화면
- `components/tasks/*`
- 할 일 form schema와 hooks
- 브리핑 핵심 업무 섹션
- Repository 연결과 테스트

### 제외 범위

- 일정 CRUD
- 반복 템플릿 복사
- 프로젝트 자동 진행률
- 알림

### 완료 조건

- 할 일 CRUD가 서버에 반영된다.
- 6개 상태와 3개 우선순위만 허용된다.
- 완료 시각 불변식이 유지된다.
- 마감 표시가 날짜 규칙대로 계산된다.
- 날짜별 오늘 꼭 끝낼 일은 최대 3개다.
- 완료 항목은 당일 유지되고 다음 날 자동 이월되지 않는다.
- 회신 대기와 확인 필요 목록이 중복 없이 표시된다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test -- tasks daily-focus deadlines
npm run test:integration -- tasks
npm run build
```

### 수동 검증

- PC 업무 목록과 모바일 업무함에서 같은 항목을 확인한다.
- 4번째 핵심 업무 지정을 차단하는지 확인한다.
- 완료·보류 항목의 마감 표시 제외를 확인한다.
- 새로고침 후 서버 데이터가 유지되는지 확인한다.

### 커밋 예시

```text
feat: implement tasks and daily focus
```

## 10. Phase 6 — 일정과 브리핑 달력

### 목표

일정 CRUD와 브리핑의 날짜 탐색·오늘 일정 흐름을 구현한다.

### 구현 범위

- 일정 생성·수정·삭제
- 종일·기간·시간 일정
- 운동 일정 기본 필드
- 일정과 할 일 연결
- 브리핑 2열 구조 데이터 연결
- 축소 월간 달력
- 모바일 7일 주간 스트립
- 오늘 시간순 일정
- 선택 날짜 간단 목록
- 다음 개인 일정
- 규칙 기반 오늘 요약 문장

### 생성 또는 수정 파일

- 일정 화면·패널
- `components/events/*`
- `components/briefing/*`
- `components/calendar/compact-month-calendar.tsx`
- `components/calendar/week-strip.tsx`
- `components/calendar/day-summary-list.tsx`
- 일정·브리핑 테스트

### 제외 범위

- 전체 월간·주간 캘린더 화면
- 운동 기록
- 드래그 편집
- AI 요약

### 완료 조건

- 모든 일정 유형의 CRUD가 동작한다.
- 일정 삭제 시 할 일은 유지되고 연결만 해제된다.
- 축소 달력은 날짜 탐색과 집계만 담당한다.
- 모바일 주간 스트립 선택이 브리핑 내용을 갱신한다.
- 오늘 요약은 정해진 규칙으로 최대 두 문장을 만든다.
- 다음 개인 일정이 규칙대로 선택된다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test -- events briefing compact-calendar
npm run test:integration -- events
npm run build
```

### 수동 검증

- 375px에서 7일 스트립이 읽히고 가로 스크롤 오류가 없는지 확인한다.
- 1280px에서 브리핑 2열 비율과 상세 패널을 확인한다.
- 오늘·선택 날짜 표시가 서로 구분되는지 확인한다.
- 축소 달력이 대형 월간 달력처럼 화면 중심을 차지하지 않는지 확인한다.

### 커밋 예시

```text
feat: add events and briefing calendar
```

## 11. Phase 7 — 전체 캘린더

### 목표

월간·주간·일정 목록으로 전체 일정을 조망하는 화면을 완성한다.

### 구현 범위

- 월간 보기
- 주간 보기
- 일정 목록 보기
- 영역 필터
- 선택 날짜 상세 목록
- 일정·수행일·마감일·운동 일정 표시
- 같은 날짜의 수행일·마감일 중복 규칙
- 월요일 시작
- 오늘 이동
- 이전·다음 기간
- 모바일 월간 달력

### 생성 또는 수정 파일

- 캘린더 route
- `components/calendar/month-view/*`
- `components/calendar/week-view/*`
- `components/calendar/agenda-view/*`
- 캘린더 집계·필터 테스트

### 제외 범위

- 드래그 편집
- Google Calendar
- Supabase Realtime
- 무한 스크롤 자동 로딩

### 완료 조건

- 세 보기에서 같은 데이터 의미를 유지한다.
- 영역 필터가 모든 보기에 일관되게 적용된다.
- 같은 날짜의 수행일·마감일은 한 항목에 두 의미로 표시된다.
- 모바일 월간 셀 높이가 항목 수에 따라 늘어나지 않는다.
- 날짜 선택 후 상세 진입이 가능하다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test -- calendar
npm run build
```

### 수동 검증

- 월 경계·연도 경계·기간 일정을 확인한다.
- PC 월간·주간·목록과 모바일 월간을 확인한다.
- 긴 제목과 많은 항목에서 셀 높이와 `+N` 표시를 확인한다.

### 커밋 예시

```text
feat: implement full calendar views
```

## 12. Phase 8 — 반복 업무 템플릿

### 목표

보건업무 템플릿 CRUD와 검토 후 복사 흐름을 구현한다.

### 구현 범위

- 템플릿 목록·상세·생성·수정·삭제
- 템플릿 체크리스트
- 적용 연도 선택
- 실제 수행일·마감일 검토
- 새 할 일과 체크리스트 복사
- 윤년 날짜 검증

### 생성 또는 수정 파일

- 템플릿 route와 컴포넌트
- 복사 검토 패널
- TemplateRepository 연결
- 복사 도메인 서비스와 테스트

### 제외 범위

- 자동 생성
- 예약 작업
- 복사본 역동기화

### 완료 조건

- 템플릿 저장만으로 할 일이 생성되지 않는다.
- 복사 전 사용자가 연도와 날짜를 검토한다.
- 복사본은 새 ID를 갖고 원본 변경의 영향을 받지 않는다.
- 템플릿 삭제 후 기존 복사 업무가 유지된다.

### 자동 검증

```bash
npm run test -- templates
npm run typecheck
npm run lint
npm run build
```

### 수동 검증

- 동일 템플릿을 두 번 복사한다.
- 2월 29일을 윤년·비윤년에서 확인한다.
- 복사 후 원본을 수정·삭제해 복사본 유지 여부를 확인한다.

### 커밋 예시

```text
feat: implement repeat task templates
```

## 13. Phase 9 — 운동 기록

### 목표

운동 일정 상세와 운동 후 기록 흐름을 완성한다.

### 구현 범위

- 운동 일정 상세
- 운동 목표
- 완료 여부
- 실제 운동일
- 강도
- 컨디션
- 운동 메모
- 최근 운동 기록

### 생성 또는 수정 파일

- 운동 route와 컴포넌트
- 운동 기록 form
- ExerciseRepository 연결
- 운동 기록 테스트

### 제외 범위

- 영상 분석
- 경기 통계
- AI 코칭
- 웨어러블 연동

### 완료 조건

- 운동 일정 하나에 기록 하나만 저장된다.
- 강도와 컨디션은 허용 값만 저장된다.
- 운동 일정 삭제 시 기록도 삭제된다.
- 운동 완료가 할 일이나 프로젝트를 변경하지 않는다.

### 자동 검증

```bash
npm run test -- exercise
npm run typecheck
npm run lint
npm run build
```

### 수동 검증

- PC와 모바일에서 기록 생성·수정·조회한다.
- 같은 일정에 두 번째 기록이 생성되지 않는지 확인한다.

### 커밋 예시

```text
feat: add exercise records
```

## 14. Phase 10 — 프로젝트

### 목표

프로젝트 CRUD, 진행률, 연결 할 일과 대표 다음 행동을 구현한다.

### 구현 범위

- 프로젝트 목록·상세·생성·수정·삭제
- 0~100 직접 입력 진행률
- 할 일 연결·해제
- 연결된 할 일 또는 직접 텍스트 대표 다음 행동
- PC 글로벌 메뉴 접근
- 모바일 설정·업무함 접근

### 생성 또는 수정 파일

- 프로젝트 route와 컴포넌트
- 프로젝트 form
- ProjectRepository 연결
- 대표 다음 행동 테스트

### 제외 범위

- 진행률 자동 계산
- 직접 텍스트의 자동 할 일 생성
- 간트 차트

### 완료 조건

- 진행률은 정수 0~100만 허용한다.
- 대표 다음 행동은 한 방식만 저장된다.
- 완료된 연결 할 일은 완료 표시와 함께 유지된다.
- 프로젝트 삭제 시 할 일은 유지되고 연결만 해제된다.

### 자동 검증

```bash
npm run test -- projects
npm run typecheck
npm run lint
npm run build
```

### 수동 검증

- PC·모바일 접근 흐름을 확인한다.
- 연결 할 일 완료·삭제 시 대표 다음 행동 표시를 확인한다.

### 커밋 예시

```text
feat: implement project management
```

## 15. Phase 11 — 빠른 메모와 전환

### 목표

빠른 메모 CRUD와 일정·할 일 전환을 구현한다.

### 구현 범위

- 빠른 메모 생성·수정·삭제
- 일정으로 전환
- 할 일로 전환
- 전환 성공 후 원본 유지·삭제 선택
- 개인정보 안내

### 생성 또는 수정 파일

- 빠른 메모 화면·컴포넌트
- 전환 서비스
- QuickMemoRepository 연결
- 전환 테스트

### 제외 범위

- 자동 분류
- 자동 요약
- 음성 입력

### 완료 조건

- 빈 메모는 저장되지 않는다.
- 전환 실패 시 원본 메모가 유지된다.
- 전환 성공 후 사용자 선택 없이 원본을 삭제하지 않는다.
- 메모에 상태·마감일을 직접 저장하지 않는다.

### 자동 검증

```bash
npm run test -- quick-memos
npm run typecheck
npm run lint
npm run build
```

### 수동 검증

- 일정·할 일 전환에서 유지와 삭제를 각각 확인한다.
- 입력 중 취소 시 원본 메모를 확인한다.

### 커밋 예시

```text
feat: add quick memo conversion flows
```

## 16. Phase 12 — 근무시간과 교시

### 목표

사용자 설정에 따라 현재 근무 상태와 퇴근까지 남은 시간을 계산한다.

### 구현 범위

- 요일별 근무일
- 출퇴근 시간
- 교시·점심·방과 후 구간
- 겹침·범위 검증
- 현재 근무 상태
- 퇴근까지 남은 시간
- 브리핑 연결

### 생성 또는 수정 파일

- 설정 화면의 근무시간 섹션
- SettingsRepository 연결
- 근무 상태 계산 유틸리티
- 시간 검증 테스트

### 제외 범위

- 공휴일 자동 연동
- 학교 시간표 가져오기
- 근무 알림

### 완료 조건

- 겹치는 구간과 잘못된 출퇴근 시간을 거부한다.
- 비근무일·출근 전·교시·근무 중·퇴근 후를 구분한다.
- `Asia/Seoul` 기준으로 남은 시간을 계산한다.
- 상태와 남은 시간을 DB에 중복 저장하지 않는다.

### 자동 검증

```bash
npm run test -- work-schedule
npm run typecheck
npm run lint
npm run build
```

### 수동 검증

- 경계 시각 전후를 개발용 시각 주입으로 확인한다.
- 모바일·PC 브리핑의 표시 일치를 확인한다.

### 커밋 예시

```text
feat: implement work schedule status
```

## 17. Phase 13 — JSON 백업·복원

### 목표

현재 사용자 데이터의 안전한 내보내기, 합치기와 교체를 구현한다.

### 구현 범위

- JSON 내보내기
- 백업·스키마 버전
- 소유자 검증
- 런타임 구조 검증
- 동일 ID 최신 수정 시각 합치기
- 전체 교체
- 유효하지 않은 참조 정리
- 결과 수량 표시
- 실패 시 서버 원본 유지

### 생성 또는 수정 파일

- 백업 설정 화면
- `services/backup/*`
- 백업 검증 schema
- 병합·교체 서비스
- 백업 fixture와 테스트

### 제외 범위

- 자동 예약 백업
- 다른 사용자 간 데이터 이동
- 삭제 동기화
- 파일 첨부

### 완료 조건

- 현재 사용자 데이터만 내보낸다.
- 소유자가 다른 백업은 거부한다.
- ID가 다르면 유사한 내용도 별도 데이터로 유지한다.
- 수정 시각이 같으면 기존 서버 데이터를 유지한다.
- 실패 시 기존 서버 데이터가 변하지 않는다.
- 세션과 인증 토큰을 백업하지 않는다.

### 자동 검증

```bash
npm run test -- backup
npm run test:integration -- backup
npm run typecheck
npm run lint
npm run build
```

### 수동 검증

- 유효·손상·다른 소유자·높은 버전 파일을 각각 확인한다.
- 합치기와 교체 전후 항목 수를 확인한다.
- 적용 중 실패를 모의해 원본 보존을 확인한다.

### 커밋 예시

```text
feat: add JSON backup and restore
```

## 18. Phase 14 — 통합 QA와 배포

### 목표

전체 사용자 흐름과 보안·접근성·반응형 품질을 검증하고 배포한다.

### 구현 범위

- TypeScript, lint, unit, integration, RLS, E2E
- 접근성 검사
- PC·모바일 주요 해상도
- 로그인·로그아웃·세션 만료
- 같은 계정 기기 간 데이터 반영
- 수정 충돌
- 오류·빈 상태·연결 끊김
- 개인정보 필드·로그 점검
- Vercel 배포
- Supabase OAuth redirect URL
- 환경변수
- 문서 일치 확인
- 보안·성능 advisor 확인

### 생성 또는 수정 파일

- E2E 테스트
- QA 체크리스트
- Vercel 설정
- 배포 환경 문서
- 필요한 버그 수정 파일
- README 실행·배포 안내

### 제외 범위

- 새 기능
- Realtime
- Google Calendar
- 알림·PWA·AI

### 완료 조건

- 모든 자동 검증이 통과한다.
- 사용자 A/B/비로그인 RLS 테스트가 통과한다.
- 배포 URL에서 Google 로그인과 callback이 동작한다.
- 같은 계정으로 PC·모바일 데이터가 일치한다.
- 주요 화면이 정의된 해상도와 키보드로 사용 가능하다.
- 학생 개인정보용 필드와 예시가 없다.
- 문서와 구현이 일치한다.

### 자동 검증

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run test:integration
npm run test:rls
npm run test:e2e
npm run build
```

### 수동 검증

- 실제 PC와 모바일 브라우저에서 전체 핵심 흐름을 수행한다.
- 배포 환경 로그인·리디렉션·로그아웃을 확인한다.
- 네트워크 차단, 저장 실패와 충돌을 확인한다.
- SCREEN_SPEC와 DESIGN_SYSTEM의 차별성 체크리스트를 통과한다.

### 커밋 예시

```text
chore: complete MVP QA and deployment
```

## 19. MVP 완료 정의

다음이 모두 충족되어야 한다.

- 같은 Google 계정으로 PC·모바일 데이터를 사용한다.
- 다른 사용자의 데이터에 접근할 수 없다.
- 일정·할 일·운동·프로젝트가 정상 동작한다.
- 브리핑·축소 달력·전체 캘린더가 정상 동작한다.
- RLS 검증이 통과한다.
- 학생 개인정보용 필드와 예시가 없다.
- JSON 백업·복원이 동작한다.
- 반응형·접근성·빈 상태·오류 상태가 검증됐다.
- Vercel 배포 환경에서 핵심 흐름이 동작한다.
- 확정 문서와 코드가 일치한다.

## 20. MVP 이후 후보

다음은 후보일 뿐 위 Phase에 포함하지 않는다.

- Supabase Realtime
- Google Calendar
- 알림
- 이메일 OTP
- PWA
- AI 기능
- 사용자 간 공유
- Reminder
