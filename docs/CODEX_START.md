# 보건온 Codex 개발 시작 지시문

## 1. 문서 목적

이 문서는 Codex가 보건온 저장소를 처음 열었을 때 가장 먼저 따라야 하는 실행 지시문이다. 기획 문서를 코드보다 우선하며, 한 번에 전체 MVP를 구현하지 않는다.

## 2. 최초 읽기 순서

작업 전에 다음 문서를 순서대로 전체 읽는다.

1. `AI_RULES.md`
2. `PROJECT.md`
3. `PRODUCT_SPEC.md`
4. `DATA_MODEL.md`
5. `SCREEN_SPEC.md`
6. `DESIGN_SYSTEM.md`
7. `ROADMAP.md`
8. `COMPONENT_GUIDE.md`
9. `API_FLOW.md`
10. `DATABASE_SCHEMA.sql`

문서가 `docs/` 아래에 있으면 동일한 순서로 `docs/<파일명>`을 읽는다.

문서가 누락되거나 상호 충돌하면 임의로 구현하지 않는다. 충돌 위치, 영향 범위와 가장 보수적인 해석을 보고하고 사용자 지시를 기다린다.

## 3. 첫 실행 범위

첫 실행에서는 `ROADMAP.md`의 `Phase 0 — 저장소와 문서 정리`만 수행한다.

첫 실행에서 허용되는 작업:

- 저장소 현재 상태 확인
- 확정 문서 위치 정리
- Next.js App Router 기본 구성
- TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons 구성
- ESLint와 테스트 기반
- npm scripts
- `.env.example`
- Supabase CLI 기본 구성
- 기본 빈 페이지 실행 확인
- README의 로컬 실행 안내

첫 실행에서 금지되는 작업:

- Phase 1 이상의 화면 구현
- Google OAuth 연결
- Supabase 원격 프로젝트 변경
- `DATABASE_SCHEMA.sql` 적용
- 실제 테이블과 RLS 생성
- Repository 구현
- 업무·일정·캘린더 CRUD
- 다음 Phase의 패키지 선행 설치

Phase 0 완료를 보고한 뒤 사용자가 다음 Phase 진행을 요청할 때까지 멈춘다.

## 4. 작업 시작 절차

1. 현재 작업 디렉터리와 git 상태를 확인한다.
2. `AGENTS.md` 또는 저장소 지시 파일이 있으면 읽는다.
3. 2절의 문서를 순서대로 읽는다.
4. 현재 Phase와 요청 범위를 한 문장으로 확인한다.
5. 기존 사용자 변경을 확인하고 덮어쓰지 않는다.
6. 해당 Phase의 생성·수정 파일 목록을 확인한다.
7. 작은 구현 계획을 작성한다.
8. 현재 Phase에 필요한 파일만 수정한다.
9. 자동 검증과 수동 검증을 수행한다.
10. 문서와 코드 차이를 확인한다.
11. 완료 보고 후 다음 Phase를 임의로 시작하지 않는다.

## 5. 절대 금지

- 확정 문서 무시
- 사용자 요청 없는 기능 추가
- 디자인 토큰·배치·메뉴명 임의 변경
- 학생 개인정보 입력·저장·검색·통계 기능
- 학생 이름·학번·질병·상담·투약·처치 예시
- localStorage를 도메인 원본 저장소로 사용
- UI에서 Supabase 직접 호출
- RLS 비활성화 또는 우회
- service role 또는 secret key를 애플리케이션 CRUD에 사용
- service role을 브라우저에 노출
- 클라이언트 `userId`만으로 권한 판단
- Google Calendar 선행 구현
- AI 추천·분류·요약 기능 선행 구현
- Realtime, PWA, 알림과 Reminder 선행 구현
- PC·모바일 Repository 중복 구현
- 참고 서비스 화면·코드·색상·컴포넌트 구조 모방
- 전체 MVP를 한 번에 구현

## 6. 환경변수 규칙

### 6.1 생성 가능 파일

`.env.example`만 저장소에 생성·수정한다.

예시:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

실제 구현 시 공식 문서에서 요구하는 변수명이 달라졌다면 현재 문서를 확인한 뒤 `.env.example`의 이름만 갱신한다.

### 6.2 금지

- 실제 URL, publishable key, secret key와 service role key 작성
- `.env.local` 생성 또는 커밋
- 실제 OAuth client secret 작성
- 테스트 fixture에 실제 키 작성
- 로그나 완료 보고에 키 출력

### 6.3 검증

- `.gitignore`가 로컬 환경 파일을 제외하는지 확인한다.
- `NEXT_PUBLIC_` 변수에 secret 또는 service role을 넣지 않는다.
- `git diff`와 검색으로 키가 포함되지 않았는지 확인한다.

## 7. Supabase 작업 규칙

Phase 2 이상에서 Supabase 작업을 시작할 때만 적용한다.

- 현재 공식 Supabase Auth·Next.js SSR·RLS 문서를 확인한다.
- CLI 명령은 `--help`로 현재 버전을 확인한다.
- DB 변경은 migration 파일로 관리한다.
- `DATABASE_SCHEMA.sql`을 기준으로 Phase 3 migration을 작성한다.
- 모든 사용자 테이블에 RLS를 활성화한다.
- 사용자 A/B/비로그인 정책 테스트를 작성한다.
- UPDATE policy에 `USING`과 `WITH CHECK`를 모두 둔다.
- browser와 server client를 분리한다.
- Database Type을 생성하고 직접 중복 선언하지 않는다.
- DB advisor에서 보안·성능 문제를 확인한다.

## 8. 디자인 구현 규칙

Phase 1 이상에서 다음을 따른다.

- PC 고정 왼쪽 사이드바
- 중앙 월간 통합 캘린더와 오른쪽 운영 열을 포함한 3열 브리핑
- 운영 열과 별도로 필요할 때만 열리는 우측 편집 패널
- 모바일 하단 메뉴
- 모바일 7일 주간 스트립
- 사이드바·운영 열·모바일 상단의 빠른 추가
- 딥 네이비 브랜드와 청록 행동색
- 축소 달력과 전체 달력의 역할 분리
- 구분선 목록, 타임라인, 배지와 제한된 핵심 카드 혼합

다음은 구현하지 않는다.

- 특정 레퍼런스의 3열 비율과 장식을 그대로 복제한 대시보드
- 민트 중심의 거의 흰 화면
- 모바일 대형 원형 플로팅 버튼
- 모든 정보를 큰 둥근 흰색 카드로 감싸기

## 9. 코드 구조 규칙

- App Router page는 조회·조합만 담당한다.
- Server와 Client Component 경계를 최소화한다.
- 컴포넌트는 Repository 구현을 알지 못한다.
- Repository는 UI 문구를 알지 못한다.
- domain은 React, Supabase와 브라우저 API에 의존하지 않는다.
- camelCase 도메인과 snake_case DB 사이에 mapper를 둔다.
- 생성·수정 폼 로직을 공유한다.
- PC 패널과 모바일 시트는 같은 Editor를 사용한다.
- CompactMonthCalendar와 FullMonthCalendar는 집계 로직은 공유하되 별도 프레젠테이션으로 구현한다.
- 불필요한 범용 CRUD·Item·Card 추상화를 만들지 않는다.

## 10. 개인정보 규칙

구현 전후 다음을 검색·검토한다.

금지되는 도메인 필드 예:

- `studentName`
- `studentId`
- `classNumber`
- `parentPhone`
- `diagnosis`
- `symptoms`
- `consultation`
- `medication`
- `treatment`
- `healthResult`

자유 입력 UI에는 다음 의미의 안내를 제공한다.

> 학생 이름, 학번, 질병명, 상담 내용 등 개인 건강정보를 입력하지 마세요. 업무 상태와 비식별 수량만 기록해 주세요.

사용자 입력 원문을 콘솔·분석 로그·오류 메시지에 출력하지 않는다.

## 11. 검증 규칙

매 Phase마다 최소한 다음 명령을 수행한다.

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

명령이 아직 정의되지 않은 Phase 0에서는 먼저 `package.json`에 스크립트를 정의한다. 검증 실패를 숨기거나 다음 Phase로 미루지 않는다.

Phase별 추가 검증은 `ROADMAP.md`를 따른다.

- 인증: `npm run test:auth`
- RLS: `npm run test:rls`
- 통합: `npm run test:integration`
- E2E: `npm run test:e2e`
- DB: local reset, lint, type generation, advisor

실제 스크립트 이름을 변경할 필요가 있다면 ROADMAP과 README를 함께 갱신한다.

## 12. 수동 검증 규칙

각 Phase의 ROADMAP 수동 검증을 수행하고 결과를 완료 보고에 포함한다.

화면 Phase 기본 해상도:

- 375×812
- 768×1024
- 1280×800
- 1440×900

확인 항목:

- 가로 스크롤
- 키보드 포커스
- 모바일 터치 영역
- 상세 패널과 시트 포커스 복귀
- 빈 상태·로딩·오류
- 개인정보 안내
- 디자인 차별성 체크리스트

## 13. 커밋 규칙

### 13.1 기본 원칙

- 한 커밋은 한 목적만 가진다.
- Phase가 끝나고 모든 필수 검증이 통과했을 때만 커밋한다.
- 미완료 Phase를 완료된 것처럼 커밋하지 않는다.
- 사용자 변경과 현재 Phase 변경을 섞지 않는다.
- 생성 파일과 관련 테스트·문서를 같은 목적 안에서 커밋한다.

### 13.2 커밋 메시지

형식:

```text
<type>: <phase outcome>
```

허용 예:

```text
chore: initialize bogeonon development foundation
feat: build app shell and static design system
feat: implement Google authentication
feat: add database schema and row level security
```

### 13.3 커밋 실행

사용자가 커밋을 명시적으로 요청했거나 저장소 작업 규칙이 이를 허용하는 경우에만 커밋한다. 그렇지 않으면 커밋 가능한 상태와 제안 메시지만 보고한다.

## 14. 문서 동기화

구현 중 확정 문서와 코드가 충돌하면 코드를 기준으로 문서를 사후 변경하지 않는다.

1. 충돌 위치 확인
2. 현재 Phase 중단
3. 사용자에게 영향 보고
4. 지시 후 문서와 코드 함께 수정

버그 수정으로 기능 범위가 변하지 않으면 관련 구현 설명과 테스트만 갱신한다. 새로운 기능은 반드시 사용자 승인과 문서 변경 후 구현한다.

## 15. Phase 진행 조건

다음 조건이 모두 충족되어야 Phase 완료다.

- 구현 범위 완료
- 제외 범위 미구현
- 자동 검증 통과
- 수동 검증 완료
- 개인정보 검토 완료
- 문서와 코드 일치
- 변경 파일 검토
- 커밋 가능한 단일 목적 상태

다음 Phase는 사용자의 명시적 요청 후 시작한다.

## 16. 완료 보고 형식

Phase 완료 시 다음 형식을 사용한다.

```markdown
## 완료 결과

- Phase: Phase N — 이름
- 결과: 완료 / 일부 완료 / 차단
- 핵심 변경: 1~5개 항목

## 생성·수정 파일

- `경로`: 변경 목적

## 자동 검증

- `npm run lint`: 통과/실패
- `npm run typecheck`: 통과/실패
- `npm run build`: 통과/실패
- `npm run test`: 통과/실패
- Phase 추가 검증: 통과/실패/해당 없음

## 수동 검증

- 확인 항목과 결과
- 확인하지 못한 항목과 이유

## 범위 확인

- 제외 범위 구현 여부: 없음/있음
- 학생 개인정보 필드·예시: 없음/있음
- 문서와 구현 차이: 없음/있음

## 남은 사항

- 현재 Phase의 미완료 또는 차단 사항
- 다음 Phase는 시작하지 않았음을 명시

## 커밋

- 상태: 커밋 완료 / 커밋 가능 / 미완료
- 제안 메시지: `<type>: <message>`
```

실패한 검증을 생략하지 않는다. 실행하지 못한 검증은 `미실행`과 이유를 명시한다.

## 17. 차단 시 보고

다음 상황에서는 추측으로 진행하지 않는다.

- 필수 문서 누락 또는 충돌
- 실제 환경변수 필요
- Supabase 프로젝트 접근 권한 필요
- Google OAuth 설정 필요
- migration 적용 대상 불명확
- 기존 사용자 변경과 충돌
- 승인되지 않은 범위 확장 필요

보고 내용:

- 차단된 Phase와 작업
- 확인한 사실
- 필요한 사용자 조치
- 안전하게 완료한 부분
- 다음 Phase를 시작하지 않았음

## 18. 첫 작업 체크리스트

- [ ] 저장소 지시 파일을 읽었다.
- [ ] 10개 확정 문서를 순서대로 읽었다.
- [ ] 현재 요청이 Phase 0임을 확인했다.
- [ ] git 상태와 기존 변경을 확인했다.
- [ ] 실제 키를 작성하지 않는다.
- [ ] 실제 기능·DB·인증을 구현하지 않는다.
- [ ] Phase 0 파일만 생성·수정한다.
- [ ] lint·typecheck·build·test를 실행한다.
- [ ] 수동 기본 실행을 확인한다.
- [ ] 완료 보고 후 멈춘다.
