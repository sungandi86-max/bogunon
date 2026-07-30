# CHANGELOG

BOGUNON의 주요 변경 사항을 기록합니다.

이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

## v0.9.1 - Project Creation UX

Release Date: 2026-07-30

### ✨ Added

- 프로젝트 빠른 시작 템플릿
- 프로젝트 유형 프리셋
- 대표 아이콘 선택
- 프로젝트 색상 선택
- 빈 Workspace CTA

### 🔄 Changed

- 프로젝트 생성 UX 개선
- 프로젝트 생성 후 Workspace 자동 이동
- 프로젝트 이름 → 유형 → 대표 아이콘 → 색상 순으로 입력 구조 개선
- 상세 설정(기간·설명) 접기
- Workspace 일정 생성 시 현재 프로젝트 자동 선택
- Calendar / Today / Workspace 동일 이벤트 참조 유지

### 🎨 Improved

- 아이콘 선택 UI 개선
- 모바일 생성 UX 개선
- 생성 화면 레이아웃 개선

### 🛠 Fixed

- 프로젝트명 브라우저 자동완성 제거
- 생성 흐름 개선

### ✅ Verified

- Typecheck
- Lint
- Clean Build
- `git diff --check`

Production QA:

- Desktop: 1280px, 1440px
- Mobile: 390px, 430px
- Console Error 없음
- Runtime Error 없음

## v0.9.0 - Travel MVP

Release Date: 2026-07-30

### ✨ Added

- Project Workspace
- Today
- Reservation
- Budget
- Notes
- Files
- Travel Today
- Quick Action
- Signed URL 파일 열기

### 🔄 Changed

- Today 중심 Workspace
- 여행 UX 개선

### 🛠 Fixed

- Production QA 데이터 정리
- QA 전용 계정 정책
- `run_id` 기반 QA
- orphan 일정 정리
- Travel Today 회귀 테스트

## 🚀 Next

### v0.9.2

예정:

- 제주 여행 실사용 피드백 반영
- UX 개선
- 버그 수정

### v1.0.0

First Stable Release

실제 여행과 업무에서 검증한 첫 번째 정식 릴리즈
