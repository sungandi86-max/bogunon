# BOGUNON

업무, 일정, 업무 절차, 연간 계획과 운동 기록을 한곳에서 관리하기 위한 웹 애플리케이션입니다. Google OAuth, 사용자별 RLS, 업무·일정 CRUD, 템플릿·체크리스트·연간 업무와 Task 기반 Workflow OS를 유지하며 안전한 작성 도움을 제공합니다. 구조화된 제안은 사용자 확인 전에는 저장하지 않습니다.

v1.0에서는 미완성 프로젝트 관리 화면을 제공하지 않습니다. 기존에 프로젝트 영역으로 생성된 업무는 삭제하지 않고 일반 업무로 계속 조회하며, `/projects`와 기존 하위 북마크는 `/tasks`로 이동합니다. 여러 업무를 하나의 목표로 묶는 기능은 실제 사용 피드백 이후 다시 검토합니다.

## 요구 사항

- Node.js 24 이상
- npm 11 이상
- Docker Desktop 또는 Supabase 로컬 개발을 지원하는 Docker 호환 런타임

## 로컬 실행

```bash
npm ci
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

Supabase 로컬 서비스가 필요한 Phase에서는 다음 명령으로 시작합니다.

```bash
npx supabase start
```

원격 프로젝트에는 `supabase/migrations/20260718090000_phase_5_health_workflow_planning.sql`과 `supabase/migrations/20260718103000_atomic_phase_5_workflow_writes.sql`을 순서대로 적용해야 Phase 5 템플릿·체크리스트·링크·알림과 원자적 묶음 저장을 사용할 수 있습니다. CLI가 연결되지 않은 환경에서는 Supabase Dashboard SQL Editor에서 각 파일 전체를 순서대로 실행합니다.

Phase 6 Workflow OS는 `/workflows`에서 개인정보를 포함하지 않는 기본·사용자 템플릿, Task별 실행 인스턴스, 단계 상태·체크리스트·다음 행동을 관리하고 브리핑과 기존 Task 흐름에 연결합니다. 템플릿 묶음 저장, 인스턴스 시작, 단계 편집·전이와 후속 Task 생성은 서버 RPC의 단일 트랜잭션으로 처리합니다. Phase 5 migration 적용 후 `supabase/migrations/20260718120000_phase_6_workflow_execution.sql` 전체를 원격 프로젝트에 추가 적용합니다.

Phase 7 AI는 PC 사이드바, 브리핑, 빠른 추가, 업무, Workflow와 연간 업무에서 공통 반응형 패널로 열리며 업무 정리와 초안을 제안합니다. provider에는 사용자가 선택한 최소 문맥만 보내며 AI 기록은 기본적으로 꺼져 있습니다. OpenAI를 사용할 수 없는 개발·장애 상황에서는 표시된 mock 결과를 사용하고, 모든 결과는 같은 schema 검증과 preview → confirm 절차를 거칩니다. 확인된 변경도 기존 Repository/RPC와 RLS를 사용합니다. 자세한 계약은 [AI 아키텍처](docs/AI_ARCHITECTURE.md)와 [개인정보 보호](docs/PRIVACY.md)를 참고합니다.

선택적 AI 기록을 사용하려면 Phase 5·6 migration 뒤에 `supabase/migrations/20260718130000_phase_7_ai_data.sql`을 적용합니다. 이 migration은 기록 기본값이 꺼진 `ai_preferences`와 사용자별 RLS가 적용된 `ai_requests`, `ai_action_drafts`를 추가합니다. DB 검증 원본은 `supabase/tests/phase_7_ai_data.sql`입니다.

모바일 일정 중심 홈, 운동 스티커 기록과 실제 설정 폼은 `supabase/migrations/20260718143000_mobile_exercise_stickers_settings.sql`을 추가 적용합니다. 기존 Event 기반 운동 기록은 삭제하거나 자동 변환하지 않으며 운동 화면의 `기존 운동 일정`에서 별도로 유지합니다. 읽기 전용 적용 확인 쿼리는 `supabase/sql/verify_mobile_exercise_stickers_settings.sql`, 로컬 pgTAP 자산은 `supabase/tests/mobile_exercise_stickers_settings.sql`입니다.

학교 날짜 스티커와 개인 반복 일정을 사용하려면 이어서 `supabase/migrations/20260718170000_add_school_calendar_stickers.sql`, `supabase/migrations/20260718171000_extend_event_schedule_fields.sql`을 순서대로 적용합니다. 보건업무 빠른 프리셋은 정적 설정으로만 제공되어 별도 migration이 필요하지 않으며, 저장 후에는 일반 Task 또는 Event가 됩니다.

Smart Calendar는 월간·주간 보기, 오늘 이동, 서울 시간대 다음 일정 카운트다운, 현재 사용자 일정·업무·학교 날짜 스티커 검색을 제공합니다. 일정과 날짜가 있는 업무는 날짜 변경 메뉴로 이동할 수 있고 PC에서는 드래그가 같은 확인 패널을 엽니다. 반복 항목 이동은 한 건·이후 항목·전체 시리즈 범위를 선택하며 `move_calendar_item` RPC 한 트랜잭션으로 저장합니다. 원격 프로젝트에는 기존 migration 뒤에 `supabase/migrations/20260718190000_smart_calendar_moves.sql`을 한 번 적용하고 `supabase/sql/verify_smart_calendar_moves.sql`로 권한과 `SECURITY INVOKER` 상태를 확인합니다.

연간 플래너는 1월부터 12월까지의 보건업무 제안을 보여 주고 기존 Task·Event 생성 폼으로 복사합니다. 제안을 고르는 것만으로 저장하지 않으며 날짜를 확인한 뒤 기존 캘린더 흐름으로 저장합니다. 기본 제안은 `lib/annual-planner/health-yearly-presets.ts`의 정적 데이터이고, 내 학교에 맞춘 사용자 항목을 사용하려면 `supabase/migrations/20260718213000_upgrade_annual_planner.sql`을 한 번 적용합니다. 검증 SQL은 `supabase/sql/verify_annual_planner_custom_items.sql`입니다.

업무 화면과 모바일 새로 만들기 메뉴의 `빠른 보건업무`는 연간 플래너와 같은 `lib/work-items/health-presets.ts` registry를 사용합니다. 프리셋은 기존 Task·Event 생성 폼에 제목, 반복, 예상 시간, 체크리스트와 알림을 채울 뿐 선택만으로 저장하지 않습니다. 최근 사용한 프리셋 최대 4개는 브라우저 localStorage에만 보관합니다. 계정별 즐겨찾기·순서·숨김을 사용하려면 `supabase/migrations/20260718223000_personalize_health_presets.sql`을 한 번 적용하고 `supabase/sql/verify_health_preset_preferences.sql`로 확인합니다. 공통 프리셋 내용은 DB에 복제하지 않습니다.

## 환경 변수

`.env.example`을 참고해 로컬 환경에 다음 변수를 설정합니다. 실제 URL과 키는 저장소에 커밋하지 않습니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
AI_PROVIDER=mock
OPENAI_API_KEY=
AI_MODEL=
```

`AI_PROVIDER`, `OPENAI_API_KEY`, `AI_MODEL`은 서버 전용입니다. `NEXT_PUBLIC_` 접두사를 붙이거나 브라우저 코드, 응답과 로그에 값을 노출하지 않습니다.

## Google OAuth 설정 상태

- [x] 로컬 `.env.local`에 Supabase Project URL과 Publishable Key 설정
- [x] Supabase Authentication Site URL과 Redirect URLs 설정
- [x] Google Cloud Web OAuth Client의 JavaScript origin과 Supabase callback URI 설정
- [x] Supabase Google Provider 활성화
- [x] Vercel Production 환경변수 설정 및 재배포
- [x] localhost와 Production에서 실제 Google 로그인·콜백·세션 유지·로그아웃 검증

OAuth 애플리케이션 콜백 경로는 `/auth/callback`입니다. Google OAuth Client Secret과 Supabase secret 또는 service role key는 이 저장소나 브라우저 환경변수에 저장하지 않습니다.

## 검증

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run test
npm run test:auth
npm run build
git diff --check
```

반응형 UI는 1440×900, 1280×800, 768×1024, 360×800, 390×844, 412×915 브라우저 크기에서 사이드바·운영 열 전환, 가로 오버플로, 빠른 추가 패널과 운동 스티커 sheet 포커스를 수동 확인합니다.

## PWA 설치

BOGUNON은 `https://bogunon.vercel.app`에서 설치 가능한 PWA로 제공됩니다. 설치 후 앱은 `/briefing`에서 standalone 모드로 시작하며, 로그인하지 않은 상태에서는 기존 인증 흐름에 따라 `/login`으로 이동합니다.

설치 앱의 첫 실행에서는 한 번만 짧은 환영 안내를 표시합니다. 확인 여부는 브라우저 `localStorage`에만 저장하며 사용자 업무나 개인정보는 저장하지 않습니다. 설치 상태와 플랫폼별 설치 안내는 설정 화면에서 확인할 수 있습니다.

- Android Chrome: 설정 화면의 `앱으로 설치하기`에서 `BOGUNON 설치`를 선택합니다.
- iOS Safari: 공유 메뉴를 열고 `홈 화면에 추가`를 선택합니다.
- 이미 앱으로 실행 중이면 설치 안내는 표시하지 않습니다.

Service Worker는 로고, 앱 아이콘, 스티커, 정적 폰트와 Next.js 정적 빌드 자산만 캐시합니다. 인증 응답, Supabase 요청, 사용자 업무·일정·운동 기록, 세션과 토큰, 쓰기 요청은 캐시하지 않습니다. 네트워크 연결이 없으면 읽기·편집 화면 대신 연결 안내만 제공하며 완전한 오프라인 편집과 Web Push는 지원하지 않습니다.

## 학사일정 스티커팩 v1

날짜 스티커 선택 패널은 `학교`, `학사일정`, `보건업무`, `개인` 팩을 제공하며 학사일정 팩은 학기·시험·행사·운영 카테고리와 이름·키워드 검색을 지원합니다. 27개 학사일정 스티커는 `public/stickers/academic/`의 자체 제작 SVG를 사용하고 기존 `calendar_stickers` 저장·삭제·중복 방지 흐름을 그대로 공유합니다.

신규 key를 허용하려면 기존 migration 뒤에 `supabase/migrations/20260719100000_add_academic_calendar_sticker_keys.sql`을 적용하고 `supabase/sql/verify_academic_calendar_sticker_keys.sql`로 CHECK 제약, 데이터 수와 기존 unique index를 확인합니다. 새 테이블이나 RLS 변경은 없습니다.

## 보건업무 스티커팩 v1

보건업무 팩은 기존 날짜 스티커 구조를 확장한 `health` pack입니다. 새 저장 테이블을 만들지 않고 `calendar_stickers`의 `(user_id, sticker_date, sticker_key)` unique 제약과 기존 upsert·개별 삭제·월간/주간 표시 흐름을 그대로 사용합니다.

카테고리는 `건강검사(screening)` 7개, `보건교육(education)` 9개, `운영·점검(operation)` 7개, `행정·협업(administration)` 5개 순서입니다.

- 건강검사: 학생건강검진, 소변검사, 결핵검사, 시력검사, 구강검사, 건강조사, 예방접종 확인
- 보건교육: 심폐소생술 교육, 응급처치 교육, 성교육, 흡연예방교육, 음주예방교육, 약물오남용 예방교육, 감염병 예방교육, 생명존중교육, 비만예방교육
- 운영·점검: AED 점검, 의약품 점검, 응급키트 점검, 보건실 환경점검, 의료폐기물 점검, 보건일지 정리, 보건실 물품구매
- 행정·협업: 보건위원회, 통계 보고, 공문 제출, 가정통신문 발송, 담임 협조 요청

모든 key는 `health.<slug>` namespace를 사용합니다. 예: `health.student-checkup`, `health.cpr-training`, `health.aed-check`, `health.teacher-cooperation`. 자산은 `public/stickers/health/`의 28개 로컬 SVG이며 외부 URL, emoji, 학생 개인정보, 질병명, 검사 결과, 피·주사·상처 같은 불쾌감을 줄 수 있는 표현을 사용하지 않습니다.

검색은 label, keywords, category, pack을 대상으로 합니다. 필수 검색어는 `검사`, `교육`, `점검`, `CPR`, `담임`이며 `CPR`은 `심폐소생술 교육`, `담임`은 `담임 협조 요청`을 찾습니다.

신규 `health.*` key를 허용하려면 기존 academic migration 뒤에 `supabase/migrations/20260719110000_add_health_calendar_sticker_keys.sql`을 적용합니다. Production SQL Editor에서는 plain 검증 SQL인 `supabase/sql/verify_health_calendar_sticker_keys.sql`을 실행하고, 로컬 pgTAP 환경에서는 `supabase/tests/health_calendar_stickers.sql`로 보완 검증합니다. 이 migration은 `calendar_stickers_sticker_key_check` 허용 목록만 확장하며 새 테이블, RLS 변경, unique 제약 변경은 없습니다.

스티커 확장 순서는 다음과 같습니다.

1. `public/stickers/<pack>/`에 96×96 로컬 SVG를 추가하고 `title`을 지정합니다.
2. `lib/calendar-stickers/catalog.ts`에 key, label, pack, category, assetPath, keywords, sortOrder를 등록합니다.
3. category와 실제 현장 검색어 중심 keywords를 입력합니다.
4. registry key 중복, assetPath 존재와 registry/asset 1:1 대응을 검사합니다.
5. 검색 테스트와 접근성 테스트를 추가합니다.
6. 모바일 375px, 태블릿 768px, 데스크톱 1280px에서 팩 탭·필터·선택 초기화와 가로 overflow를 확인합니다.
7. DB CHECK 제약이 새 key를 막을 때만 최소 migration과 읽기 전용 검증 SQL을 추가합니다.

다음 스티커팩(예: 공휴일팩)을 추가할 때도 같은 순서를 사용하되, 해당 pack만 독립적으로 추가하고 보건업무·학사일정 registry나 기존 사용자 데이터를 변경하지 않습니다.

## 확정 문서

구현 전 [docs/CODEX_START.md](docs/CODEX_START.md)의 순서에 따라 `docs/`의 제품·보안·화면·데이터 문서를 확인합니다. Phase 7 AI 작업은 [docs/AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md), [docs/PRIVACY.md](docs/PRIVACY.md), [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), [docs/SCREEN_SPEC.md](docs/SCREEN_SPEC.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [docs/DATABASE.md](docs/DATABASE.md)의 계약을 함께 적용합니다.
