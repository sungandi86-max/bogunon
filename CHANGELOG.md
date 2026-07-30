# CHANGELOG

BOGUNON의 주요 변경 사항을 기록합니다.

이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

## v0.9.3 - Action First Workspace

Release Date: 2026-07-30

### ✨ Added

- 프로젝트 유형별 일정 추천과 첫 일정 추가 동선
- 프로젝트 유형별 체크리스트 추천과 `모두 추가`
- 예약 유형별 빠른 시작 버튼
- 프로젝트 개요의 최근 활동 요약
- 여행·학교·출판·운동 프로젝트 헤더 핵심 정보

### 🔄 Changed

- 빈 Workspace를 안내 문구 중심에서 다음 행동 중심으로 개선
- 개요 화면을 다음 일정, 예약, 체크리스트, 예산, 최근 활동 순으로 재구성
- 예약 유형에 따라 날짜·시간 라벨과 예시 문구를 맞춤 표시
- Workspace에서 새 항목을 만들 때 현재 프로젝트를 상단에 고정 표시

### 🎨 Improved

- 추천 항목의 키보드 포커스와 모바일 터치 영역
- 390px·430px Workspace Empty State 밀도
- 예약 생성 흐름의 프로젝트 맥락과 입력 가독성

### ✅ Verified

- Workspace·일정·체크리스트·예약 집중 테스트
- Typecheck
- Lint
- Clean Build
- `git diff --check`
- Desktop 1280px, 1440px
- Mobile 390px, 430px

## v0.9.2 - Project Creation Polish

Release Date: 2026-07-30

### ✨ Added

- 실시간 프로젝트 미리보기
- 대표 아이콘 더보기

### 🔄 Changed

- 프로젝트 이름을 첫 입력으로 이동
- 빠른 시작을 설명 포함 카드로 개선
- 생성 버튼을 `새 프로젝트 시작`으로 변경

### 🎨 Improved

- 프리셋 선택 상태 강화
- 유형·아이콘·색상 연동 UX
- 색상 선택 시각 피드백
- Desktop 및 Mobile 생성 화면 완성도

### ✅ Verified

- 프로젝트 생성·Workspace·일정 연결 집중 테스트
- Typecheck
- Lint
- Clean Build
- `git diff --check`

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

### v0.9.4

예정:

- Workspace 실사용 피드백 반영
- 접근성 및 성능 개선
- 버그 수정

### v1.0.0

First Stable Release

실제 여행과 업무에서 검증한 첫 번째 정식 릴리즈
