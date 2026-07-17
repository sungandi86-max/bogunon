# 보건온

보건교사의 업무, 일정, 운동과 개인 프로젝트를 한곳에서 관리하기 위한 웹 애플리케이션입니다. 현재 저장소는 ROADMAP Phase 0의 로컬 개발 기반만 포함하며 제품 UI, 인증과 데이터베이스 스키마는 구현하지 않습니다.

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

`.env.example`을 참고해 로컬 환경에 필요한 값을 설정합니다. 실제 URL과 키는 저장소에 커밋하지 않습니다.

## 검증

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 확정 문서

구현 전 [docs/CODEX_START.md](docs/CODEX_START.md)의 순서에 따라 `docs/`의 제품·보안·화면·데이터 문서를 확인합니다.
