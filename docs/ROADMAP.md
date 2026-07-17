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
| 4 | 보건교사 업무 운영 고도화 | 카테고리·반복·브리핑·검색·필터 |
| 5 | 보건업무 템플릿·연간 계획 | 템플릿·체크리스트·복제·연간 보기·RLS |
| 6 | Workflow OS | 템플릿·인스턴스·상태 전이·원자적 RPC·Task 통합 |
| 7 | 개인정보 안전 AI 업무 도우미 | provider/schema·preview/confirm·RLS |
| 8 | 템플릿 운영 확장 (시작하지 않음) | 별도 승인 후 검토 |
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

이 절은 Phase 1 완료 당시 구조를 기록한다. 현재 레이아웃 기준은 아래 Phase 2.5이며 상단 내비게이션과 2열 브리핑 요구는 더 이상 적용하지 않는다.

### 목표

보건온 고유의 화면 뼈대와 공통 UI를 정적 데이터로 구현한다.

### 구현 범위

- 디자인 토큰과 기본 타이포그래피
- PC 상단 글로벌 내비게이션 (Phase 1 당시 구조, Phase 2.5에서 사이드바로 대체)
- 모바일 하단 메뉴
- 반응형 App Shell
- 정적 로그인 화면
- 정적 브리핑 2열 구조 (Phase 1 당시 구조)
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

- Phase 1 당시에는 고정 3열 대시보드를 사용하지 않았다.
- Phase 1 당시 브리핑은 60~65% 업무 영역과 35~40% 날짜 탐색 영역이었다.
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

## 7. Phase 2.5 — UX Direction Realignment

### 목표

하루 종일 켜두는 교사용 운영 대시보드에 맞게 Phase 1의 정보 구조를 재정렬한다.

### 구현 범위

- PC 고정 왼쪽 사이드바
- 사이드바·중앙 캘린더·오른쪽 운영 열의 3열 브리핑
- 중앙 날짜·근무 상태, 주간 요약, 월간 통합 캘린더
- 오른쪽 오늘의 업무, 회신 대기, 회의·일정, 운동, 프로젝트 다음 행동
- 페이지 이동 없이 기존 생성 패널을 여는 빠른 추가 진입점
- 모바일 하단 내비게이션과 단일 열 카드 흐름
- 보건업무, 학교일정, 제출·마감, 회신 대기, 개인일정, 운동, 프로젝트의 시각 구분
- Phase 2 인증과 보호 라우트 유지

### 제외 범위

- Database Schema와 RLS
- 제품 데이터 CRUD와 Supabase 조회·저장
- 실제 반복 일정과 프로젝트 데이터 연결
- 학생 개인정보를 포함하는 화면 또는 데이터 모델

### 완료 조건

- 1280px 이상에서 고정 사이드바, 중앙 월간 캘린더, 오른쪽 운영 열이 함께 보인다.
- 오늘 날짜, 근무 상태, 주간 요약과 우선 업무를 페이지 이동 없이 확인할 수 있다.
- 빠른 추가가 기존 생성 패널을 열고 키보드 포커스를 복귀한다.
- 모바일은 하단 메뉴와 단일 열 카드이며 플로팅 추가 버튼이 없다.
- Phase 2 인증 테스트가 그대로 통과한다.
- Phase 3 파일, 스키마, RLS와 CRUD가 추가되지 않는다.

### 자동 검증

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run test
npm run test:auth
npm run build
git diff --check
```

### 수동 검증

- 1440×900과 1280×800에서 3열 운영 흐름과 상세 패널 오버레이를 확인한다.
- 375×812에서 단일 열 카드, 상단 빠른 추가와 하단 내비게이션을 확인한다.

### 커밋 메시지

```text
feat: realign dashboard UX with daily operations
```

## 8. Phase 3 — Tasks & Calendar MVP

### 목표

Phase 2.5 운영 대시보드의 더미 업무·일정을 Supabase 원본 데이터로 교체한다.

### 구현 범위

- `tasks`, `events` 테이블과 필요한 제약·인덱스
- 로그인 사용자의 자기 행만 허용하는 SELECT·INSERT·UPDATE·DELETE RLS
- 업무 생성·수정·완료·완료 취소·삭제
- 일정 생성·수정·삭제
- 실제 데이터 기반 오늘 마감 업무·오늘 일정·회신 대기·오늘 우선 업무
- 월간 달력의 `events` 표시
- PC 업무·일정 빠른 추가와 모바일 새로 만들기 버튼
- PC와 모바일에서 동일한 생성 폼 사용

### 생성 또는 수정 파일

- `supabase/migrations/*_phase_3_tasks_events_mvp.sql`
- `types/database.ts`
- `supabase/tests/` 또는 DB 보안 테스트 파일
- 업무·일정 data access와 Server Action
- 업무·캘린더·브리핑 화면

### 제외 범위

- Google Calendar Sync
- AI 자동 분류
- 반복 일정과 반복 업무 템플릿
- 운동 기록 DB
- 프로젝트 관리 DB
- 체크리스트와 날짜별 별도 핵심 업무 테이블
- Realtime, Storage, 관리자·공유 정책

### 완료 조건

- `tasks`, `events`에 RLS가 활성화된다.
- 사용자 A는 자기 행 CRUD가 가능하다.
- 사용자 A는 사용자 B 행 SELECT·INSERT·UPDATE·DELETE가 불가능하다.
- 비로그인 요청은 사용자 데이터에 접근하지 못한다.
- UPDATE로 `user_id`를 바꿀 수 없다.
- check 제약이 잘못된 날짜·상태·완료 시각을 거부한다.
- 생성 Type이 현재 migration과 일치한다.
- DB advisor의 보안 오류가 없다.
- 업무·일정 CRUD가 새로고침 후에도 유지된다.
- 브리핑과 월간 달력이 실제 저장 데이터를 표시한다.

### 자동 검증

```bash
npx supabase db reset
npx supabase test db
npm run typecheck
npx supabase db lint
npm run test
npm run build
```

사용 중인 CLI에서 지원하는 advisor 명령을 `--help`로 확인한 뒤 보안·성능 advisor를 실행한다.

### 수동 검증

- Supabase Studio에서 테이블·제약·인덱스·정책을 확인한다.
- 사용자 A/B 토큰과 비로그인 요청을 각각 실행한다.
- 클라이언트 필터를 제거해도 RLS가 데이터 격리를 유지하는지 확인한다.

### 커밋 예시

```text
feat: implement tasks and calendar mvp
```

Phase 4 이후의 repository 확장, 체크리스트, 별도 `daily_focus_assignments`, 운동 기록, 프로젝트, 반복 업무는 Phase 3 완료에 포함하지 않는다. 아래 후속 Phase의 업무·일정 항목 중 Phase 3에서 이미 제공한 기본 CRUD·브리핑·월간 표시는 재구현하지 않고 고급 기능만 확장한다.

## 9. Phase 4 — 보건교사 업무 운영 고도화

### 목표

일반 일정관리 기능을 넘어 보건교사가 매일 사용하는 업무를 분류하고 반복·검색·브리핑으로 빠르게 운영할 수 있게 한다.

### 구현 범위

- Task 전용 10개 업무 카테고리와 카테고리 색상
- 매일·매주·매월·매년 반복 주기
- 로그인 후 브리핑·업무 진입 시 누락 반복 업무 자동 생성
- 반복 발생일 중복 방지와 월·연 무효 날짜 건너뛰기
- 실제 데이터 기반 오늘 해야 할 일·오늘 일정·우선 업무·회신 대기 상세 목록
- 업무·일정 제목과 메모의 입력 즉시 검색
- 카테고리·완료 여부·기간·우선순위 필터
- 기존 Task/Event CRUD와 RLS 유지
- Desktop 3열 Dashboard와 Mobile Bottom Navigation 유지

### 생성 또는 수정 파일

- Phase 4 migration과 DB 보안 테스트
- Task/Event 타입과 데이터 접근
- 업무 생성·수정 폼
- 업무 검색·필터 컴포넌트
- 브리핑 운영 열
- 카테고리·반복·검색 단위 테스트
- 관련 제품·화면·데이터·디자인 문서

### 제외 범위

- Supabase Realtime 구독
- Quick Memo 테이블과 CRUD
- 반복 업무 템플릿 복사
- Google Calendar Sync
- AI 자동 분류
- 운동·프로젝트 DB
- 알림·예약 작업·오프라인 큐

### 완료 조건

- 모든 Task가 10개 카테고리 중 하나를 저장하고 색상 라벨로 표시한다.
- 매일·매주·매월·매년 반복 업무가 기준일까지 중복 없이 생성된다.
- 오늘 브리핑이 숫자와 함께 실제 업무·일정 제목과 시간을 표시한다.
- 검색이 Task·Event 제목과 각 메모 필드를 입력 즉시 찾는다.
- 네 필터를 조합해도 결과가 일관된다.
- 기존 CRUD, RLS, Desktop 3열과 Mobile Bottom Navigation이 유지된다.
- Pretendard와 공통 타이포·간격·반경·색상·그림자·포커스 토큰을 모든 Phase 4 화면에 적용한다.
- Desktop·Tablet·Mobile에서 카드 밀도, 캘린더 셀, 사이드바와 하단 내비게이션이 같은 디자인 언어를 유지한다.

### 자동 검증

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run test
npm run test:db
npm run build
```

### 수동 검증

- Desktop·Tablet·Mobile에서 검색·필터·반복 폼과 브리핑을 확인한다.
- 반복 업무 생성 후 새로고침과 재진입에서 중복이 없는지 확인한다.
- 학생 개인정보용 필드와 예시가 없는지 확인한다.

### 커밋 예시

```text
feat: add recurring tasks and category system
```

## 10. Phase 5 — 보건업무 템플릿과 연간 계획

### 목표

Phase 4의 업무·일정 흐름 위에 보건교사의 반복적인 연간 운영을 재사용할 수 있는 기능을 추가한다.

### 구현 범위

- 개인정보를 포함하지 않는 12개 기본 보건업무 템플릿
- 기본 템플릿을 내 템플릿으로 복제하고 Task·Event 폼에 적용
- Task 체크리스트 생성·수정·완료·복원·삭제·순서 변경과 완료율
- 1월~12월 연간 업무 보기와 이전·현재·다음 연도 이동
- Task·Event 날짜 변경 복제와 완료 상태 초기화
- 완료 업무 검색·연도·기간·상태 필터와 템플릿 저장
- 한국어 규칙 기반 빠른 입력, 파싱 결과 미리보기와 수정 후 저장
- Task·Event 메모, 다중 관련 링크와 URL 검증
- 마감 당일·1일·3일·1주·사용자 지정 알림 저장 구조
- 모든 Phase 5 사용자 데이터에 RLS와 동일 사용자 복합 외래키

### 생성 또는 수정 파일

- `app/(app)/templates`, `app/(app)/annual`
- `components/templates/*`, `components/tasks/*`, 공용 생성·편집 폼
- `lib/work-items/workflow.ts`, Phase 5 repository
- `supabase/migrations/20260718090000_phase_5_health_workflow_planning.sql`
- `supabase/tests/phase_5_workflow_rls.sql`

### 제외 범위

- 실제 브라우저 푸시·이메일 발송
- AI API 기반 자연어 처리
- 운동 기록 DB와 프로젝트 관리 DB
- Google Calendar 동기화와 후속 전체 캘린더 확장 범위

### 완료 조건

- 기본 템플릿은 직접 수정되지 않고 복제 후 사용자 소유로 저장된다.
- 체크리스트 완료율과 미완료 상태 확인이 실제 데이터에서 계산된다.
- Task와 Event 복제는 선택한 필드만 재사용하고 완료 상태를 초기화한다.
- 연간 화면은 월별 업무·일정·반복·완료 상태와 카테고리를 표시한다.
- 빠른 입력은 자동 저장하지 않고 미리보기와 수정 단계를 거친다.
- 링크는 HTTP·HTTPS만 허용하고 알림 설정은 데이터만 저장한다.
- 사용자 A는 사용자 B의 템플릿·체크리스트·링크·알림을 CRUD할 수 없다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### 수동 검증

- Desktop·Tablet·Mobile에서 템플릿 적용, 체크리스트, 복제와 연간 보기를 확인한다.
- 빠른 입력으로 반복 업무를 미리 본 뒤 저장하고 새로고침 후 유지되는지 확인한다.
- 링크와 알림 설정이 저장되고 로그아웃 후 보호 경로가 차단되는지 확인한다.

### 커밋 예시

```text
feat: add health workflow templates and annual planning
```

## 11. Phase 6 — Workflow OS

### 목표

Phase 5의 단일 업무 템플릿·체크리스트·복제·연간 운영을 유지하면서, Task에 여러 단계의 보건업무 절차를 연결하고 상태·다음 행동·후속 Task까지 안전하게 운영하는 Workflow OS를 구현한다.

### 구현 범위

- 개인정보를 포함하지 않는 불변 `결핵검진`, `학생건강검진` Workflow 템플릿
- 기본 템플릿 복제와 사용자 소유 Workflow 템플릿·단계·체크리스트·링크·후속 규칙 편집
- 미완료 Task에 템플릿을 적용해 만드는 독립 실행 인스턴스와 단계 스냅샷
- Workflow `active`, `paused`, `completed`, `cancelled` 상태와 명시적 허용 전이
- 단계 `pending`, `in_progress`, `completed`, `skipped`, `blocked` 상태와 명시적 허용 전이
- 완료 단계 수, 남은 단계 수, 진행률과 `in_progress → blocked → pending` 순서의 다음 행동 계산
- 템플릿 저장, 인스턴스 시작, 단계 저장·전이와 후속 Task 생성을 담당하는 원자적 서버 RPC
- `/workflows` Desktop 본문+오른쪽 패널과 Tablet·Mobile 단일 열 화면
- 브리핑 대시보드의 진행 중·보류 요약과 가장 가까운 다음 행동
- Phase 5 Task 목록·상세·검색·필터와 Workflow 출처·연결 통합
- 사용자별 RLS, 동일 사용자 복합 관계, 비식별 템플릿·예시·로그 정책

### 생성 또는 수정 파일

- `/workflows` route와 Workflow 템플릿·인스턴스·단계 컴포넌트
- Workflow domain, repository와 서버 action
- `supabase/migrations/20260718120000_phase_6_workflow_execution.sql`
- Workflow RLS·RPC 검증 자산
- 브리핑 요약과 Task 연결 컴포넌트
- 상태 전이·진행률·원자성·반응형 통합 테스트

### 제외 범위

- Phase 5 Task·Event 템플릿, 체크리스트, 복제와 연간 업무의 재구현 또는 삭제
- 자동 예약 실행, 외부 캘린더·메신저 동기화와 실제 푸시·이메일 발송
- 학생별 명단·건강정보·검진 결과 저장
- AI 생성·요약, Phase 7 전체 캘린더와 이후 Phase 기능

### 완료 조건

- 기본 템플릿은 직접 수정되지 않고 사용자 템플릿으로 복제한 뒤 편집된다.
- 템플릿 저장과 인스턴스 시작 시 모든 하위 행이 한 번에 저장되고 실패 시 일부 행이 남지 않는다.
- Workflow와 단계는 문서화된 전이만 허용하며 완료·취소 Workflow는 종료 상태로 유지된다.
- 미완료 체크리스트는 확인 없는 단계 완료를 차단하고, 미해결 단계는 Workflow 완료를 차단한다.
- 진행률·다음 행동·현재 단계와 타임라인이 실제 저장 상태에서 계산된다.
- 후속 Task 생성이 완료 RPC와 같은 트랜잭션으로 커밋되며 실패 시 전이 전체가 롤백된다.
- Workflow 완료는 원본 Task를 함께 완료하고, Task만 완료할 때는 Workflow 단계 상태를 암묵적으로 바꾸지 않는다.
- `/workflows`의 Desktop·Tablet·Mobile에서 템플릿 관리, Task 적용, 단계 편집·전이, 완료·취소와 이력 필터가 가능하다.
- 브리핑과 Task 흐름에서 같은 Workflow 상태·다음 행동·출처 링크를 확인한다.
- 사용자 A는 사용자 B의 템플릿·인스턴스·단계·체크리스트·링크·타임라인·후속 Task를 조회하거나 변경할 수 없다.
- Phase 5 템플릿·체크리스트·복제·연간 업무·빠른 입력·링크·알림 저장이 회귀 없이 유지된다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test -- workflows
npm run test:db
npm run build
git diff --check
```

### 수동 검증

- 1280px 이상에서 검색·필터·인스턴스 목록과 오른쪽 템플릿·시작 패널, 브리핑·Task 연결을 확인한다.
- 768px와 375px에서 가로 오버플로 없이 다음 행동과 허용 전이를 조작한다.
- 템플릿·인스턴스·단계 묶음 저장과 완료 후속 Task 생성 실패가 부분 데이터를 남기지 않는지 확인한다.
- 보류·재개, 완료 단계 되돌리기, 건너뛰기, 완료·취소와 종료 상태를 확인한다.
- 키보드·200% 확대·상태 비색상 표현과 개인정보 비포함 문구를 확인한다.
- Phase 5 `/templates`, `/annual`, Task 복제·체크리스트와 빠른 입력을 회귀 확인한다.

### 커밋 예시

```text
feat: add workflow operating system
```

## 12. Phase 7 — 개인정보 안전 AI 업무 도우미

### 목표

기존 Task·Event·Workflow·템플릿·연간 업무를 최소 문맥으로 활용하는 provider 중립 AI 보조 계층을 추가한다. Phase 1~6 기능과 RLS를 유지하며 Phase 8 범위는 시작하지 않는다.

### 구현 범위

- 서버 전용 provider abstraction과 OpenAI·결정적 mock 구현
- 서버 전용 `AI_PROVIDER`, `OPENAI_API_KEY`, `AI_MODEL` 구성
- 한국어 업무 정리, Task·Event 초안, 체크리스트·다음 행동 제안과 선택 항목 요약
- PC 사이드바, 브리핑, 빠른 추가, 업무, Workflow와 연간 업무에서 여는 공통 반응형 AI 패널
- 런타임 검증된 구조화 응답과 preview → edit → confirm → 기존 Repository/RPC 반영 흐름
- delete operation이 없는 no-delete 계약
- 학생 개인정보·건강정보 입력 금지, 최소 문맥 전송과 원문 비로그
- 인증 사용자당 분당 10회 제한, 12초 전체 timeout과 자동 재시도 없음
- `ai_preferences`, `ai_requests`, `ai_action_drafts`의 사용자별 RLS와 기록 기본 off

### 생성 또는 수정 파일

- AI provider·schema·rate limit·timeout·preview/confirm 테스트
- `docs/AI_ARCHITECTURE.md`, `docs/PRIVACY.md`와 Phase 7 관련 문서

### 제외 범위

- 드래그 편집
- Google Calendar
- Supabase Realtime
- 무한 스크롤 자동 로딩
- AI 자동 실행·자동 저장, AI 삭제·취소·Workflow 전이
- 전체 DB·전체 캘린더의 암묵적 provider 전송
- 기본 활성화된 대화 기록, 문맥 snapshot 저장과 사용자 간 기록 공유
- 학생 개인 건강기록, 파일·이미지 분석과 음성 입력

### 완료 조건

- provider 응답은 공통 schema와 no-delete 필터를 통과하고 mock 여부를 명확히 표시한다.
- 사용자가 미리보기와 변경 필드를 확인하기 전에는 DB 쓰기가 발생하지 않는다.
- 확인 이후의 쓰기도 기존 인증·도메인 검증·RLS를 통과하며 취소·timeout·제한·오류에서 부분 저장이 없다.
- provider에는 선택한 최소 문맥만 전송하고 입력·응답 원문을 로그나 기본 기록에 남기지 않는다.
- Desktop·Tablet·Mobile에서 AI 진입, loading, preview, confirm과 오류 흐름을 사용할 수 있다.

### 자동 검증

```bash
npm run typecheck
npm run lint
npm run test -- calendar
npm run test -- ai
npm run build
```

### 수동 검증

- AI 각 진입점에서 mock·provider 응답, 구조화 미리보기 수정·취소·확인과 no-delete를 확인한다.
- 1440×900, 1280×800, 768×1024, 375×812에서 AI 화면과 확인 행동의 반응형·키보드 흐름을 확인한다.
- history off에서 새 대화 행이나 localStorage 원본이 없고 사용자 A/B·비로그인 RLS가 유지되는지 확인한다.

### 커밋 예시

```text
feat: add safe AI workflow assistance
```

## 13. Phase 8 — 템플릿 운영 확장 (기존 계획, Phase 5 이후 재정의)

**상태: 시작하지 않음.**

기존 반복 업무 템플릿 MVP 범위는 최신 확정안에 따라 Phase 5에 통합됐다. Phase 8에서는 Phase 5 기능을 재구현하지 않으며, 향후 별도 승인 시 템플릿 수정·삭제, 윤년 검증과 운영 정책만 확장한다.

### 목표

Phase 5 템플릿 기반 위에 고급 운영 기능을 추가한다.

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

## 14. Phase 9 — 운동 기록

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

## 15. Phase 10 — 프로젝트

### 목표

프로젝트 CRUD, 진행률, 연결 할 일과 대표 다음 행동을 구현한다.

### 구현 범위

- 프로젝트 목록·상세·생성·수정·삭제
- 0~100 직접 입력 진행률
- 할 일 연결·해제
- 연결된 할 일 또는 직접 텍스트 대표 다음 행동
- PC 사이드바 메뉴 접근
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

## 16. Phase 11 — 빠른 메모와 전환

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

## 17. Phase 12 — 근무시간과 교시

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

## 18. Phase 13 — JSON 백업·복원

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

## 19. Phase 14 — 통합 QA와 배포

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
