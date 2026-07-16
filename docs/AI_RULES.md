# 보건온 Codex 개발 규칙

## 1. 목적

이 문서는 Codex가 보건온을 기획, 구현, 수정, 검토할 때 반드시 지켜야 하는 제품·보안·개인정보·코드 규칙을 정의한다.

## 2. 우선순위

1. 사용자의 현재 명시적 지시
2. 이 문서의 보안·개인정보 규칙
3. `PROJECT.md`
4. `PRODUCT_SPEC.md`
5. `DATA_MODEL.md`
6. `SCREEN_SPEC.md`
7. `DESIGN_SYSTEM.md`
8. `ROADMAP.md`
9. `CODEX_START.md`

충돌 시 개인정보와 데이터 격리에 더 엄격한 규칙, MVP 범위를 더 작게 유지하는 규칙을 우선한다. 충돌을 임의 해석해 구현하지 않는다.

## 3. 고정 제품 기준

- 제품명: 보건온
- 기본 언어: 한국어
- 시간대: `Asia/Seoul`
- 주 시작일: 월요일
- 인증: Supabase Auth의 Google OAuth
- 주 저장소: Supabase Postgres Database
- 접근 제어: 모든 사용자 소유 테이블의 RLS
- 사용자 소유 키: 인증 사용자의 `userId`
- PC·모바일: 같은 계정의 동일 데이터
- localStorage: 폼 초안, 마지막 화면, 필터와 UI 캐시만 허용
- 일정과 할 일: 별도 모델
- 오늘 꼭 끝낼 일: 날짜별 최대 3개, 사용자 직접 지정
- 운동: MVP 주요 영역
- 학생 기록: 비식별 업무 상태와 수량만 허용

## 4. 임의 기능 추가 금지

문서에 없거나 사용자가 요청하지 않은 기능을 추가하지 않는다. 다음 이유는 기능 추가 근거가 아니다.

- 다른 서비스에 보통 포함됨
- 기술적으로 쉽게 구현 가능함
- 향후 필요할 가능성이 있음
- 더 완성된 서비스처럼 보임
- 라이브러리나 템플릿이 기본 제공함

특히 사용자 간 공유, 관리자, 학생 명단, 파일 업로드, Google Calendar, AI 기능, 알림과 오프라인 동기화는 명시적 범위 변경 없이 구현하지 않는다.

## 5. Supabase 적용 규칙

Supabase 관련 작업 전 현재 공식 문서와 변경사항을 확인한다. 기억에 의존해 API, SSR 또는 CLI 사용법을 작성하지 않는다.

### 5.1 인증

- Google OAuth만 MVP 로그인 제공자로 구현한다.
- Next.js App Router에 맞는 공식 SSR 쿠키 세션 방식을 사용한다.
- 브라우저와 서버의 Supabase 클라이언트를 분리한다.
- 보호된 화면과 데이터 요청에서 유효한 인증 사용자를 확인한다.
- 세션 만료, OAuth 취소와 콜백 오류를 처리한다.
- 로그인하지 않은 사용자는 로그인 화면으로 이동시킨다.
- 로그아웃 시 현재 세션을 종료하고 사용자 데이터 화면을 비운다.
- 브라우저에서 전달한 `userId`를 인증 근거로 신뢰하지 않는다.
- `user_metadata`를 권한 판단에 사용하지 않는다.

### 5.2 API 키와 환경 변수

- 브라우저에는 publishable key만 노출할 수 있다.
- secret key와 service role key를 `NEXT_PUBLIC_` 변수에 넣지 않는다.
- service role key를 브라우저 코드, 테스트 스냅샷, 로그와 저장소에 포함하지 않는다.
- `.env.local`을 커밋하지 않는다.
- 필요한 변수 이름만 `.env.example`에 값 없이 기록한다.

### 5.3 Database

- 사용자 원본 데이터는 Supabase Database에 저장한다.
- 사용자가 생성하는 모든 최상위 데이터 행은 `user_id uuid not null`을 가진다.
- `user_id`는 `auth.users(id)`를 참조한다.
- 소유권 필터에 사용하는 `user_id`에 인덱스를 둔다.
- 외래키와 자주 사용하는 날짜·상태 조회에 필요한 인덱스만 명시적으로 추가한다.
- 모든 스키마 변경은 migration 파일로 관리한다.
- 스키마를 수동으로만 변경하고 migration을 누락하지 않는다.

### 5.4 RLS

- Data API에 노출되는 모든 사용자 데이터 테이블에 RLS를 활성화한다.
- 인증 역할만 접근하도록 정책에 `TO authenticated`를 명시한다.
- `TO authenticated`만으로 접근을 허용하지 않는다.
- SELECT와 DELETE는 `(select auth.uid()) = user_id`를 `USING`에 사용한다.
- INSERT는 `(select auth.uid()) = user_id`를 `WITH CHECK`에 사용한다.
- UPDATE는 같은 소유권 조건을 `USING`과 `WITH CHECK` 모두에 사용한다.
- `auth.role()`을 사용하지 않는다.
- 클라이언트 필터 `.eq("user_id", user.id)`는 조회 최적화에 사용할 수 있지만 RLS를 대체하지 않는다.
- 다른 사용자의 `user_id`로 행을 생성하거나 변경할 수 없어야 한다.
- RLS 검증 테스트에서 사용자 A, 사용자 B와 비로그인 상태를 분리해 확인한다.

권장 정책 형태:

```sql
alter table public.tasks enable row level security;

create policy "tasks_select_own"
on public.tasks for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "tasks_insert_own"
on public.tasks for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "tasks_update_own"
on public.tasks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "tasks_delete_own"
on public.tasks for delete
to authenticated
using ((select auth.uid()) = user_id);
```

### 5.5 보안 금지사항

- RLS 오류 해결을 위해 RLS를 끄지 않는다.
- `SECURITY DEFINER`로 일반 CRUD 권한 문제를 우회하지 않는다.
- 앱 클라이언트에서 service role을 사용하지 않는다.
- UI에서 숨기는 방식만으로 데이터 접근을 제한하지 않는다.
- 사용자가 제공한 이메일 또는 Google 프로필을 소유권 기준으로 사용하지 않는다.
- 공개 뷰로 사용자 데이터를 노출하지 않는다. 뷰가 필요하면 별도 승인과 `security_invoker` 검토가 필요하다.

## 6. 동기화 규칙

- Supabase Database를 단일 원본으로 사용한다.
- 저장 성공은 서버 쓰기 성공 후에만 표시한다.
- 낙관적 UI를 사용하더라도 실패 시 서버 기준으로 되돌릴 수 있어야 한다.
- PC와 모바일은 로그인 후 서버에서 데이터를 조회한다.
- MVP 동기화는 저장 후 재조회와 화면 재진입 시 최신 데이터 반영을 보장한다.
- 실시간 공동 편집과 복잡한 오프라인 큐는 구현하지 않는다.
- 수정 시 `updatedAt` 또는 동등한 버전 조건으로 충돌을 감지한다.
- 충돌 시 다른 기기의 변경을 조용히 덮어쓰지 않고 사용자에게 새로고침 또는 현재 입력으로 교체를 선택하게 한다.

## 7. localStorage 규칙

허용:

- 저장 전 폼 초안
- 마지막 화면 경로
- 캘린더 영역 필터
- 정렬과 접힘 상태 같은 UI 캐시

금지:

- 일정·할 일·운동·프로젝트·템플릿·메모의 원본
- 서버 데이터 전체 복제본
- 오프라인 쓰기 대기열
- Supabase access token을 앱이 별도 키로 복제 저장
- 학생 관련 자유 입력 데이터의 장기 보관

폼 초안은 사용자별 네임스페이스를 사용하고 로그아웃 시 제거한다. 서버 저장 성공 후 해당 초안을 제거한다.

## 8. 개인정보 보호 규칙

### 8.1 저장 금지

- 학생 이름, 학번, 생년월일
- 개인을 식별할 수 있는 반·번호 조합
- 학생·보호자 연락처
- 질병명, 증상, 진단, 검진 결과
- 상담, 투약, 처치와 병원 이용 내용
- 장애·특수교육 관련 개인 정보
- 학생 개인을 추론할 수 있는 사건 설명
- 해당 정보가 포함된 파일과 외부 문서 본문

학생 이름 일부를 가린 예시도 사용하지 않는다.

### 8.2 허용

- 2학년 관련 담임 확인 필요
- 보호자 연락 여부 재확인
- 후속 확인 3건
- 미제출 5건
- 외부 기관 회신 대기

### 8.3 계정정보

- `userId`는 학생 정보가 아니라 로그인 사용자의 Supabase Auth UUID다.
- 앱 도메인 테이블에 Google access token을 저장하지 않는다.
- 이메일과 프로필 사진은 제품 기능에 필요하지 않으면 별도 profiles 테이블에 복제하지 않는다.
- 인증정보와 학생 데이터 금지 원칙을 혼동하지 않는다.

### 8.4 로그

- 제목, 메모, 체크리스트, 링크와 태그 원문을 콘솔 또는 원격 로그에 출력하지 않는다.
- 오류 메시지에 사용자 입력 원문을 넣지 않는다.
- RLS 오류에 다른 사용자 데이터나 행 내용을 포함하지 않는다.

## 9. 한국어 UI 규칙

고정 용어:

- 오늘 꼭 끝낼 일
- 일정
- 할 일
- 수행일
- 마감일
- 회신 대기
- 확인 필요
- 후속 확인일
- 마감 임박
- 오늘 마감
- 기한 경과
- 반복 업무 템플릿
- 대표 다음 행동
- 빠른 추가
- 빠른 메모
- Google로 로그인
- 로그아웃
- 동기화

버튼과 오류 메시지는 한국어로 작성하고 내부 오류 코드, 테이블명과 기술 용어를 노출하지 않는다.

## 10. 정보 구조 규칙

- 최상위 영역은 보건업무·학교일정·운동·개인·프로젝트로 고정한다.
- 일정, 할 일, 빠른 메모와 프로젝트를 하나의 타입으로 합치지 않는다.
- 수행일은 `scheduledDate`, 마감일은 `dueDate`, 후속 확인일은 `followUpDate`다.
- 마감 표시와 오늘 꼭 끝낼 일 여부는 파생 또는 별도 지정 모델로 관리한다.
- 반복 템플릿은 사용자 확인 없이 업무를 생성하지 않는다.
- 프로젝트 진행률은 사용자가 직접 입력한다.

## 11. 디자인 복제 금지

- 다른 서비스의 화면, 색상값, 로고, 문구, CSS, 컴포넌트 구조와 에셋을 복사하지 않는다.
- 스크린샷을 픽셀 단위로 재현하지 않는다.
- 사이드바, 카드, 하단 메뉴와 플로팅 버튼 같은 일반 패턴은 보건온의 정보 우선순위와 디자인 토큰으로 독립 구현한다.
- 제품 UI, 코드 주석과 예시 데이터에 참고 서비스 이름을 노출하지 않는다.
- 로그인 버튼도 보건온의 디자인 시스템 안에서 표시하며 대시보드 핵심 정보보다 과도하게 강조하지 않는다.

## 12. 코드 품질

- Next.js App Router와 TypeScript를 사용한다.
- 객체 모델은 `interface`, 유니언은 `type`, 허용 값은 `as const` 배열을 사용한다.
- TypeScript `enum`과 불필요한 `any`를 피한다.
- 도메인, Repository, Supabase Adapter, 검증, 인증과 날짜 계산 책임을 분리한다.
- UI 컴포넌트가 Supabase 테이블 구조에 직접 종속되지 않게 매핑 계층을 둔다.
- 패키지 버전을 고정하고 lockfile을 커밋한다.
- Supabase 공식 타입 생성을 사용하고 임의로 Database 타입을 중복 작성하지 않는다.
- 사용자 입력과 백업 데이터는 런타임 검증한다.

## 13. Repository 규칙

- 도메인별 Repository 인터페이스를 유지한다.
- 구현체는 Supabase Repository를 기본으로 한다.
- Repository 메서드는 인증 컨텍스트 없이 임의 `userId`를 받아 다른 사용자 데이터를 조회하게 만들지 않는다.
- 생성 시 `userId`는 인증 세션에서 결정한다.
- localStorage Repository 구현은 만들지 않는다.
- 테스트용 in-memory 구현은 테스트 범위에서만 허용한다.

## 14. 테스트 규칙

필수 검증:

- Google 로그인 성공·취소·실패
- 비로그인 보호 화면 차단
- 세션 만료와 로그아웃
- 사용자 A가 자기 데이터 CRUD 가능
- 사용자 A가 사용자 B 데이터 SELECT·INSERT·UPDATE·DELETE 불가
- UPDATE로 `user_id` 변경 불가
- 모든 사용자 소유 테이블의 RLS 활성화
- PC 저장 후 모바일 재조회 반영
- 수정 충돌 처리
- localStorage 삭제 후 서버 데이터 유지
- 학생 개인정보 필드 부재
- 기존 일정·할 일·운동·프로젝트 기능

## 15. 작업 전 확인

- 현재 Supabase 공식 문서를 확인했는가?
- 데이터가 사용자 소유라면 `userId`, 인덱스와 RLS가 정의됐는가?
- 브라우저에 secret 또는 service role이 노출되지 않는가?
- localStorage를 원본으로 사용하지 않는가?
- 개인정보 금지 원칙을 유지하는가?
- 요청하지 않은 인증 제공자나 협업 기능을 추가하지 않았는가?

## 16. 작업 후 확인

- 타입 검사, 린트와 테스트가 통과하는가?
- migration이 저장소에 존재하는가?
- RLS 정책을 실제 사용자 분리 테스트로 검증했는가?
- Supabase 보안·성능 advisor 결과를 확인했는가?
- 로그아웃 후 사용자 데이터가 화면에 남지 않는가?
- 오류 시 사용자 입력과 다른 사용자 데이터가 노출되지 않는가?
- 관련 문서가 구현과 일치하는가?
