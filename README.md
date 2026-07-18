# BOGUNON

보건교사의 업무, 일정, 운동과 개인 프로젝트를 한곳에서 관리하기 위한 웹 애플리케이션입니다. Phase 1~6의 Google OAuth, 사용자별 RLS, 업무·일정 CRUD, 템플릿·체크리스트·연간 업무와 Task 기반 Workflow OS를 유지하며 Phase 7에서 안전한 AI 업무 도우미를 추가합니다. AI는 구조화된 제안을 미리보기로만 제공하고 사용자 확인 전에는 저장하지 않으며 업무 삭제 기능을 갖지 않습니다. Phase 8은 시작하지 않았습니다.

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

## 확정 문서

구현 전 [docs/CODEX_START.md](docs/CODEX_START.md)의 순서에 따라 `docs/`의 제품·보안·화면·데이터 문서를 확인합니다. Phase 7 AI 작업은 [docs/AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md), [docs/PRIVACY.md](docs/PRIVACY.md), [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), [docs/SCREEN_SPEC.md](docs/SCREEN_SPEC.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [docs/DATABASE.md](docs/DATABASE.md)의 계약을 함께 적용합니다.
