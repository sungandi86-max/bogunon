# CHANGELOG

BOGUNON의 주요 변경 사항을 기록합니다.

이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

## v0.11.0 - Health Support Instructor Manager

Release Date: 2026-08-18

### Added

- 보건 보조인력 관리(Health Support Instructor Manager): 강사 정보, 근무 기록, 월별 정산, Excel 가져오기 및 출력 문서를 한 작업 공간에서 관리

### Verified

- Health Support Instructor Manager 집중 테스트 및 로컬 회귀 검증 범위 기록

## v0.10.2 - Contextual Workspace

Release Date: 2026-08-11

### ✨ Added

- 프로젝트 프리셋 정체성을 재사용하는 유형별 Workspace 탐색 우선순위
- 여행 프로젝트의 저빈도 노트 탭을 위한 접근 가능한 더보기 메뉴

### 🔄 Changed

- 여행 프로젝트를 일정·예약·지도 중심 순서로 재배치
- 학교·출판·개발·운동 프로젝트의 실제 작업 흐름에 맞춰 탭 순서 변경
- 개요 Empty State와 빠른 액션을 프로젝트 유형별 핵심 작업으로 조정

### 🎨 Improved

- Mobile 가로 탭에서 중요한 기능을 먼저 노출하고 44px 터치 영역 유지
- 더보기 내부 탭의 직접 hash 접근, 선택 상태, 키보드 탐색 피드백

### 🛠 Fixed

- 모든 프로젝트에 동일한 탭 순서가 노출되던 정보구조 문제
- 유형을 확실히 판별할 수 없는 프로젝트가 임의 유형으로 분류될 수 있던 문제

### ✅ Verified

- 유형별 탭·CTA·hash 복원 집중 테스트
- Typecheck
- Lint
- Clean Build
- `git diff --check`

## v0.10.1 - Travel Map UX v2

Release Date: 2026-08-11

### ✨ Added

- 프로젝트 기간과 연결 데이터로 계산하는 여행 DAY별 코스
- 일정·예약의 미등록 장소 추천과 Kakao 검색 기반 확인 흐름
- 여행 종료 후 DAY별 방문 장소 회고 요약

### 🔄 Changed

- Desktop 지도를 지도 65%·코스 목록 35%의 연결된 2-Pane Workspace로 개선
- Mobile 지도·코스 전환에서 날짜별 실제 장소 목록을 표시
- 장소 검색 결과를 먼저 선택하고 여행 정보만 확인하는 추가 흐름으로 단순화

### 🎨 Improved

- 장소 수와 프로젝트 지역에 따라 대한민국·지역 중심·단일 장소·fitBounds를 선택하는 지도 viewport
- 지도 핀과 코스 목록의 양방향 선택 및 포커스 동기화
- 날짜별로 분리된 번호 핀과 polyline, DAY chip 가독성

### 🛠 Fixed

- 전체 보기에서 서로 다른 날짜의 장소가 하나의 연속 route로 연결되던 문제
- 지도 선택 전환 시 OpenStreetMap TileLayer가 중복될 수 있던 문제
- 좌표가 없는 일정·예약 장소를 다시 직접 입력해야 했던 흐름

### ✅ Verified

- Travel Map DAY·viewport·추천·상호작용 집중 테스트
- Kakao 장소 검색 provider 회귀 테스트
- Typecheck
- Lint
- Clean Build
- `git diff --check`

## v0.10.0 - Travel Map & Routes

Release Date: 2026-08-08

### ✨ Added

- 모든 Project Workspace에서 사용할 수 있는 지도 탭
- 장소 검색, 수동 좌표 입력, 날짜별 번호 핀과 기본 polyline 코스
- 장소 방문 예정·완료 상태와 여행 종료 후 방문 요약
- 일정·예약에서 사용자가 확인 후 장소를 추가하는 연결 흐름

### 🔄 Changed

- 프로젝트 장소를 일정·예약과 같은 사용자·같은 프로젝트에서만 연결하도록 데이터 무결성 강화
- 일정·예약 삭제 시 장소는 유지하고 연결 ID만 해제

### 🎨 Improved

- Desktop 지도·목록 2열과 Mobile 지도·목록 전환 UX
- Desktop drag, Mobile 위·아래 버튼을 통한 방문 순서 관리

### 🛠 Fixed

- 실제 사용자 데이터와 Production QA 데이터를 구분하도록 장소 테이블을 QA 정리 검증 대상에 추가
- Content Security Policy가 OpenStreetMap 타일 이미지를 차단해 지도가 회색으로 표시되던 문제

### ✅ Verified

- Project Places 집중 테스트
- RLS 및 연결 무결성 테스트
- Typecheck
- Lint
- Clean Build
- `git diff --check`

## v0.9.6 - Calendar First Layout

Release Date: 2026-08-04

### 🔄 Changed

- Today 데스크톱 레이아웃을 월간 달력 우선 구조로 조정
- 우측 정보 패널을 화면 크기와 관계없이 296~336px 범위로 제한
- 달력과 우측 패널 사이 간격 및 월간 셀의 좌우 여백 축소

### 🎨 Improved

- 월간 일정 제목 표시 공간 확대
- 오늘 일정, 급식, 날씨, 빠른 메모 카드의 내부 여백과 세로 간격 압축
- 급식 메뉴를 최대 5~6줄 높이로 제한하고 초과 항목은 카드 안에서 확인
- 학교 정보를 접힌 한 줄 요약으로 유지

### 🛠 Fixed

- 후속 CSS 규칙이 우측 패널을 약 33%까지 확장하던 레이아웃 우선순위 문제

### ✅ Verified

- Today 레이아웃 집중 테스트
- Typecheck
- Lint
- Clean Build
- `git diff --check`
- Desktop 1280px, 1366px, 1440px, 1600px
- Mobile 390px, 430px

## v0.9.5 - Timed Stickers

Release Date: 2026-08-03

### ✨ Added

- 모든 스티커 일정의 종일·시작 시간·종료 시간 설정
- 온라인 연수 수강, 온라인 연수 강의, 대면 연수 참석, 연수 자료 준비 스티커
- 스티커 관리 화면의 전체 시간 표시와 일정 수정 진입점

### 🔄 Changed

- 학교생활·학사일정·보건업무·공휴일·개인 스티커를 공통 Event 생성·수정 흐름으로 통합
- 기존 날짜 전용 스티커를 종일 Event로 호환 이관

### 🎨 Improved

- 월간 캘린더에서 시간 스티커의 시작 시간을 한 줄로 표시
- Today와 모바일 날짜 목록에서 동일 Event 시간 데이터 재사용

### 🛠 Fixed

- 일반 스티커에서 시간 지정과 수정이 불가능하던 문제
- 스티커 등록 경로에 따라 저장 구조가 달라지던 문제

### ✅ Verified

- 스티커 카탈로그·생성·수정·월간 표시 집중 테스트
- Typecheck
- Lint
- Clean Build
- `git diff --check`
- Desktop 1280px, 1440px
- Mobile 390px, 430px

## v0.9.4 - Multi-day Reservations

Release Date: 2026-07-30

### ✨ Added

- 예약 종료 날짜 저장
- 렌터카 대여·반납 기간 입력
- 숙박 체크인·체크아웃 기간 입력
- 항공·교통편의 익일 도착 입력

### 🔄 Changed

- 예약 유형에 따라 시작·종료 날짜와 시간 라벨을 맞춤 표시
- 다일 예약의 종료 날짜를 연결된 Calendar 일정에 자동 반영
- 예약 목록, Workspace 개요, Travel Today에서 실제 예약 기간 표시

### 🎨 Improved

- 시작일 변경 시 비어 있거나 잘못된 종료일만 자동 보정
- 390px·430px 예약 입력을 한 열로 재배치
- 기존 종료 날짜 없는 예약을 시작일 당일 예약으로 호환

### 🛠 Fixed

- 날짜를 넘기는 예약에서 종료 시간이 시작 시간보다 빠를 수 없던 문제
- 다일 예약이 Calendar에서 하루 일정으로 저장되던 문제

### ✅ Verified

- 예약 도메인·저장소·Workspace·Travel Today 집중 테스트
- Typecheck
- Lint
- Clean Build
- `git diff --check`
- Desktop 1280px, 1440px
- Mobile 390px, 430px

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

### v1.0.0

First Stable Release

실제 여행과 업무에서 검증한 첫 번째 정식 릴리즈
