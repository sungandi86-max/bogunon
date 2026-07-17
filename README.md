# 보건온

보건교사의 업무, 일정, 운동과 개인 프로젝트를 한곳에서 관리하기 위한 웹 애플리케이션입니다. 현재 ROADMAP Phase 3 Tasks & Calendar MVP까지 구현되어 PC 고정 사이드바와 운영 대시보드, 모바일 단일 열 브리핑, Supabase Auth 기반 Google OAuth, 사용자별 `tasks`·`events` RLS, 업무·일정 CRUD와 실제 데이터 기반 브리핑·월간 달력이 동작합니다. 운동 기록, 프로젝트 데이터, 반복 일정은 후속 Phase 범위입니다.

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

## 환경 변수

`.env.example`을 참고해 로컬 환경에 다음 변수를 설정합니다. 실제 URL과 키는 저장소에 커밋하지 않습니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

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

반응형 UI는 1440×900, 1280×800, 768×1024, 375×812 브라우저 크기에서 사이드바·운영 열 전환, 가로 오버플로, 빠른 추가 패널 포커스를 수동 확인합니다.

## 확정 문서

구현 전 [docs/CODEX_START.md](docs/CODEX_START.md)의 순서에 따라 `docs/`의 제품·보안·화면·데이터 문서를 확인합니다.
