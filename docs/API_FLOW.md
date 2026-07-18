# 보건온 API 흐름 명세

## 1. 문서 목적

이 문서는 보건온의 사용자 행동이 UI, feature 계층, Repository와 Supabase를 거쳐 다시 UI에 반영되는 흐름을 정의한다. 새로운 API 기능을 추가하지 않으며 확정된 기능의 호출 경계와 오류 처리를 구체화한다.

## 2. 공통 계층

```text
UI 진입
  ↓
Feature / Server Action / Route Handler
  ↓
Runtime Validation + AuthContext
  ↓
Repository Interface
  ↓
Supabase Adapter
  ↓
Supabase Auth / Database + RLS
  ↓
Result<DomainModel, RepositoryError>
  ↓
UI 성공 또는 실패 상태
```

### 2.1 공통 원칙

- 화면 컴포넌트는 Supabase를 직접 호출하지 않는다.
- Repository는 현재 인증 사용자를 AuthContext에서 확인한다.
- 사용자 입력의 `userId`를 신뢰하지 않는다.
- Supabase Database가 도메인 데이터 원본이다.
- 서버 저장 성공 전 성공 UI를 표시하지 않는다.
- UI에는 SQL, 테이블명, RLS 정책명과 다른 사용자의 데이터를 노출하지 않는다.
- 날짜 전용 값은 `YYYY-MM-DD`로 전달한다.
- Client optimistic UI는 실패 시 원래 상태로 되돌릴 수 있는 변경에만 사용한다.

## 3. 오류 분류

| 코드 | 발생 조건 | 기본 UI 처리 |
|---|---|---|
| `UNAUTHENTICATED` | 세션 없음·만료 | 입력 유지 후 다시 로그인 |
| `FORBIDDEN` | RLS 거부·소유권 불일치 | 접근 불가 안내, 데이터 미표시 |
| `VALIDATION_ERROR` | 형식·도메인 규칙 실패 | 필드 오류 또는 섹션 오류 |
| `NETWORK_ERROR` | 연결 끊김·timeout | 입력 유지, 재시도 |
| `CONFLICT` | 서버 `updatedAt`이 더 최신 | ConflictDialog |
| `DATABASE_ERROR` | 제약·쿼리·transaction 실패 | 원본 유지, 일반 저장 오류 |
| `NOT_FOUND` | 삭제됐거나 존재하지 않음 | 목록 재조회·상세 닫기 |
| `UNKNOWN` | 분류되지 않은 오류 | 일반 오류와 재시도 |

오류 객체와 로그에 사용자 입력 원문을 불필요하게 포함하지 않는다.

## 4. 로그인

### 진입

- LoginScreen에서 `Google로 로그인` 선택

### Repository / 인증 계층

- auth feature가 Supabase browser client의 Google OAuth 시작 함수를 호출한다.
- redirect URL은 등록된 `/auth/callback`을 사용한다.

### Supabase

- Supabase Auth가 Google OAuth로 사용자를 인증한다.
- callback route가 인증 코드를 쿠키 기반 세션으로 교환한다.
- 서버가 인증 사용자 ID를 확인한다.
- SettingsRepository가 사용자 설정 존재 여부를 확인하고 없으면 기본 설정을 생성한다.

### 성공

- 보호된 브리핑 경로로 이동한다.
- 브리핑 초기 데이터를 서버에서 조회한다.
- 해당 사용자의 임시 초안 namespace만 사용한다.

### 실패

- 인증 취소·OAuth 오류: `UNAUTHENTICATED`
- callback·네트워크 실패: `NETWORK_ERROR` 또는 `UNKNOWN`
- 기본 설정 생성 실패: `DATABASE_ERROR`

### UI

- 진행 중 버튼 중복 클릭을 막는다.
- 실패 시 로그인 화면에 오류와 재시도를 표시한다.
- 내부 provider 오류 코드를 그대로 표시하지 않는다.

## 5. 로그아웃

### 진입

- ProfileMenu 또는 AccountSettings에서 로그아웃 선택

### Repository / 인증 계층

- auth feature가 Supabase Auth 로그아웃을 호출한다.

### Supabase

- 현재 세션을 종료한다.

### 성공

- 메모리의 사용자 데이터와 해당 사용자의 폼 초안을 제거한다.
- 로그인 화면으로 이동한다.

### 실패

- `NETWORK_ERROR` 또는 `UNKNOWN`
- 보호 데이터 화면은 세션 상태를 다시 확인한다.

### UI

- 성공 전 데이터 삭제 완료로 표시하지 않는다.
- 서버의 사용자 도메인 데이터는 삭제하지 않는다.

## 6. 브리핑 조회

### 진입

- 로그인 후 `/briefing`
- 선택 날짜 변경
- 명시적 다시 불러오기

### Repository

- AuthContext로 현재 사용자 확인
- EventRepository: 선택 날짜를 포함하는 일정
- TaskRepository: 수행일·마감·후속 확인·상태 조건
- DailyFocusRepository: 선택 날짜 지정
- ExerciseRepository: 운동 기록
- SettingsRepository: 근무시간
- briefing service가 중복 제거·정렬·요약 문장·날짜 집계를 수행한다.

### Supabase

- 각 쿼리에 필요한 날짜·상태 조건을 적용한다.
- RLS가 현재 사용자 행만 반환한다.
- 축소 달력에는 표시 월의 집계 범위만 조회한다.

### 성공

- `BriefingViewModel` 반환
- 오늘 꼭 끝낼 일, 기다리는 업무, 시간순 일정, 마감, 운동, 선택 날짜 요약 표시

### 실패

- 인증: 로그인 화면
- 네트워크: 기존 화면 유지·재시도
- DB: 실패한 섹션 또는 전체 조회 오류
- 알 수 없는 오류: 일반 조회 오류

### UI

- 전체 화면을 무조건 비우지 않는다.
- 섹션별 부분 성공을 지원하기로 구현한 경우 실패 섹션만 SectionError로 표시한다.
- AI 없이 규칙 기반 요약 문장을 표시한다.

## 7. 할 일 생성

### 진입

- `+ 새로 만들기` → 업무 유형 → TaskEditor

### Repository

- 입력 trim·런타임 검증
- 기본 priority `normal`
- 완료 상태면 completedAt 생성, 그 외 제거
- TaskRepository.save
- 체크리스트가 있으면 같은 작업 범위에서 저장

### Supabase

- tasks INSERT
- checklist_items INSERT
- 현재 인증 사용자 ID 사용
- RLS와 CHECK·FK·UNIQUE 적용

### 성공

- 생성 Task와 체크리스트 반환
- 관련 목록·브리핑 재검증
- 폼 초안 제거

### 실패

- Validation: 필드별 오류
- Auth: 세션 만료
- Network: 입력 유지
- Database: 제약 오류를 사용자용 메시지로 매핑
- Unknown: 일반 저장 오류

### UI

- 저장 중 중복 제출 방지
- 성공 후 패널·시트 닫기
- 실패 시 입력 유지

## 8. 할 일 수정

### 진입

- TaskDetail → 편집

### Repository

- 초기 `updatedAt` 보관
- 입력과 완료 시각 불변식 검증
- TaskRepository.save(task, expectedUpdatedAt)
- 체크리스트 추가·수정·삭제 반영

### Supabase

- 현재 `updated_at` 조건을 포함한 UPDATE
- 관련 체크리스트 변경
- RLS와 같은 사용자 FK 적용

### 성공

- 최신 Task 반환
- 목록·상세·브리핑 재검증

### 실패

- Conflict: 서버 행이 더 최신
- Validation·Auth·Network·Database·Unknown 공통 처리
- Not Found: 상세 닫기와 목록 재조회

### UI

- ConflictDialog에서 최신 내용 재조회 또는 현재 입력으로 교체 선택
- 자동 덮어쓰기 금지
- 실패 시 편집값 유지

## 9. 할 일 완료·완료 취소

### 진입

- TaskRow, TaskDetail 또는 DailyFocusSection 완료 토글

### Repository

- 완료: status `completed`, completedAt 현재 시각
- 완료 취소: 사용자가 선택한 상태, completedAt 제거
- 미완료 체크리스트가 있으면 확인 후 실행

### Supabase

- expectedUpdatedAt 조건 UPDATE
- CHECK가 상태와 completed_at 일치를 검증

### 성공

- 최신 행 반환
- 오늘 꼭 끝낼 일은 당일 화면에 완료 표시로 유지
- 마감 파생 값 재계산

### 실패

- Conflict 시 토글 원복
- Network·Database 실패 시 낙관적 표시 원복
- Auth 만료 시 입력 상태 유지 후 로그인 안내

### UI

- 성공 전 영구 완료로 간주하지 않는다.
- 실패 토스트와 재시도를 제공한다.

## 10. 일정 생성

### 진입

- 새로 만들기, 캘린더 날짜 추가 또는 EventEditor

### Repository

- 날짜·시간·종일·운동 전용 필드 검증
- EventRepository.save
- 연결 할 일이 있으면 같은 사용자 여부와 대표 일정 변경을 확인한다.

### Supabase

- events INSERT
- 연결 tasks UPDATE
- FK·CHECK·RLS 적용

### 성공

- 일정 반환
- 브리핑·축소 달력·전체 캘린더 재검증

### 실패

- Validation: 날짜·시간·URL·운동 필드
- Conflict: 연결 할 일이 다른 기기에서 변경됨
- Auth·Network·Database·Unknown 공통 처리

### UI

- 저장 성공 후 선택 날짜 목록에 반영한다.
- 실패 시 폼과 선택 날짜를 유지한다.

## 11. 일정 수정·삭제

### 진입

- EventDetail → 편집 또는 삭제

### Repository

- 수정: expectedUpdatedAt 검증 후 저장
- 삭제: 연결 할 일의 linkedEventId 해제
- 운동 일정 삭제: 연결 ExerciseRecord 삭제

### Supabase

- UPDATE 또는 DELETE
- FK `SET NULL`·`CASCADE`와 RLS 적용

### 성공

- 관련 화면 재검증
- 삭제 상세 패널 닫기

### 실패

- Conflict·Not Found·Network·Database·Unknown

### UI

- 삭제 확인에서 영향 범위를 표시한다.
- 실패 시 목록에서 임의 제거하지 않는다.

## 12. 캘린더 조회

### 진입

- 캘린더 메뉴
- 월간·주간·목록 전환
- 기간 이동·영역 필터

### Repository

- 조회 기간 계산
- EventRepository와 TaskRepository 조회
- calendar service가 일정·수행일·마감·운동 항목을 날짜별 표시 모델로 변환한다.

### Supabase

- 기간과 영역 조건 조회
- RLS로 현재 사용자 행만 반환
- 필요한 열만 SELECT

### 성공

- Month, Week 또는 Agenda ViewModel 반환
- 같은 날짜의 수행일·마감일 중복 규칙 적용

### 실패

- Auth·Network·Database·Unknown
- 일부 잘못된 응답은 Validation 오류

### UI

- 기존 기간을 유지하며 다시 시도 제공
- 셀 안 긴 제목 대신 최대 항목과 `+N` 표시

## 13. 반복 업무 복사

### 진입

- TemplateDetail → 업무로 복사
- 적용 연도·날짜 검토

### Repository

- TemplateRepository로 원본과 체크리스트 조회
- template copy service가 새 Task·ChecklistItem ID 생성
- 날짜와 윤년 검증
- TaskRepository를 통한 원자적 저장

### Supabase

- tasks와 checklist_items INSERT
- 원본 템플릿 변경 없음
- RLS·FK·CHECK 적용

### 성공

- 새 할 일 상세 또는 목록 이동
- 템플릿은 유지

### 실패

- Validation: 잘못된 날짜
- Auth·Network·Database·Unknown
- 부분 저장 실패 시 전체 실패로 처리

### UI

- 복사 전 미리보기 유지
- 실패 시 생성된 것으로 표시하지 않는다.

## 14. 프로젝트 생성·수정

### 진입

- 프로젝트 화면 → 새 프로젝트 또는 편집

### Repository

- 이름·진행률·색상·대표 다음 행동 검증
- ProjectRepository.save
- 연결 할 일은 같은 사용자·프로젝트 관계인지 확인

### Supabase

- projects INSERT 또는 UPDATE
- 연결 tasks UPDATE
- 대표 다음 행동 FK·RLS·CHECK 적용

### 성공

- Project 반환
- 목록·상세 재검증

### 실패

- Validation: 진행률·대표 다음 행동 조합
- Conflict·Auth·Network·Database·Unknown

### UI

- 진행률을 자동 변경하지 않는다.
- 직접 입력 다음 행동에서 할 일을 생성하지 않는다.

## 15. 운동 기록

### 진입

- 운동 일정 상세 → 기록 작성 또는 수정

### Repository

- 연결 일정이 운동 영역인지 확인
- 강도·컨디션·날짜 검증
- ExerciseRepository.save

### Supabase

- exercise_records INSERT 또는 UPDATE
- `(user_id, event_id)` UNIQUE
- 같은 사용자 복합 FK와 RLS 적용

### 성공

- 기록 반환
- 오늘 운동·최근 기록 재검증

### 실패

- Validation·Conflict·Auth·Network·Database·Unknown
- 중복 기록은 기존 기록 재조회 후 편집 흐름으로 안내

### UI

- 실패 시 강도·컨디션·메모 입력 유지
- 운동 완료가 다른 도메인 상태를 바꾸지 않는다.

## 16. 빠른 메모

### 진입

- 빠른 메모 생성·수정·삭제 또는 전환

### Repository

- QuickMemoRepository CRUD
- 전환 시 event 또는 task feature를 호출하고 원본 처리 선택을 기다린다.

### Supabase

- quick_memos CRUD
- 전환 대상 INSERT
- 원본 삭제를 선택한 경우에만 memo DELETE

### 성공

- 목록 재검증
- 전환 성공 후 유지·삭제 결과 반영

### 실패

- Validation: 빈 내용
- 전환 생성 실패: 원본 유지
- Auth·Network·Database·Unknown

### UI

- 전환 실패 시 원본 메모와 입력을 유지한다.

## 17. 설정 조회·저장

### 진입

- 설정 화면 또는 첫 로그인 기본 설정 생성

### Repository

- SettingsRepository.get/save
- 요일·출퇴근·교시 겹침·시간 범위 검증

### Supabase

- user_settings UPSERT
- work_periods INSERT·UPDATE·DELETE
- 사용자당 설정 하나 UNIQUE
- RLS 적용

### 성공

- 최신 설정 반환
- 브리핑의 근무 상태와 퇴근까지 남은 시간 재계산

### 실패

- Validation: 시간·구간
- Conflict·Auth·Network·Database·Unknown

### UI

- 필드 가까이에 시간 오류 표시
- 실패 시 기존 서버 설정과 편집값을 구분해 유지

## 18. JSON 백업

### 진입

- 설정 → 데이터 백업 → 내보내기

### Repository

- 모든 도메인 Repository로 현재 사용자 데이터 조회
- BackupService가 schema·backup version, exportedAt, ownerUserId와 data를 구성
- 개인정보 안내 확인

### Supabase

- 현재 사용자 행만 SELECT
- 인증 토큰·Google 프로필은 조회하지 않음

### 성공

- 검증된 JSON 파일 생성
- 파일명에 `Asia/Seoul` 기준 시각 사용

### 실패

- Auth·Network·Database·Validation·Unknown

### UI

- 성공·실패 메시지
- 실패해도 서버 데이터는 변경하지 않는다.

## 19. JSON 복원

### 진입

- 설정 → 데이터 복원 → 파일 선택 → 합치기 또는 교체

### Repository

- BackupService가 unknown 입력을 런타임 검증
- 버전과 ownerUserId 확인
- 합치기: 유형·ID·updatedAt 비교
- 교체: 전체 검증 후 적용 계획 생성
- 참조 정리 결과와 변경 수량 생성

### Supabase

- 현재 사용자 범위에서 transaction 가능한 복원 작업 수행
- 모든 행에 현재 인증 사용자 ID 검증
- FK·CHECK·UNIQUE·RLS 적용

### 성공

- 추가·교체·기존 유지·참조 정리 수량 반환
- 전체 사용자 데이터 재검증

### 실패

- Validation: 형식·버전·소유자·참조
- Conflict: 복원 도중 더 최신 서버 변경
- Auth·Network·Database·Unknown
- 실패 시 기존 서버 원본 유지

### UI

- 적용 전 영향 확인
- 진행 중 중복 실행 방지
- 실패 시 파일 오류와 서버 미변경을 안내

## 20. 삭제 공통 흐름

```text
삭제 버튼
  ↓
ConfirmationDialog
  ↓
Feature delete action
  ↓
Repository 참조 영향 확인
  ↓
Supabase DELETE / FK action / transaction
  ↓
성공: 상세 닫기 + 목록 재검증
  ↓
실패: 화면 유지 + 오류 + 재시도
```

삭제 성공 전 목록에서 영구 제거로 확정하지 않는다.

## 21. 캐시·재검증 원칙

- 서버 데이터 저장 성공 후 영향을 받는 화면만 재검증한다.
- 업무 변경: 업무 목록, 브리핑, 캘린더
- 일정 변경: 브리핑, 캘린더, 일정 상세
- 운동 기록: 운동 화면, 브리핑 오늘 운동
- 설정 변경: 설정, 브리핑 근무 상태
- 프로젝트 변경: 프로젝트 목록·상세, 연결 업무 표시
- localStorage 초안은 서버 성공 후 제거한다.

## 22. 흐름별 인수 조건

- [ ] 모든 도메인 흐름이 Repository를 거친다.
- [ ] 화면에서 Supabase를 직접 호출하지 않는다.
- [ ] 인증 실패·Validation·Network·Conflict·Database·Unknown을 구분한다.
- [ ] 저장 실패 시 입력을 유지한다.
- [ ] 충돌 시 자동 덮어쓰기하지 않는다.
- [ ] RLS 거부 시 다른 사용자 데이터가 노출되지 않는다.
- [ ] 삭제·복원 실패 시 서버 원본을 유지한다.
- [ ] 성공 후 영향 화면만 재검증한다.
- [ ] 백업에 인증 세션을 포함하지 않는다.
- [ ] 학생 개인정보용 필드와 예시를 사용하지 않는다.
# 모바일 운동 스티커·설정 흐름 (2026-07-18)

1. 운동 화면과 브리핑 서버 컴포넌트가 인증 세션으로 기본·사용자 스티커와 해당 기간 로그를 조회한다.
2. 스티커 탭은 `attachExerciseStickerAction`을 호출하고 DB UNIQUE 제약이 같은 날짜·같은 스티커 중복을 막는다.
3. 선택된 스티커의 제거는 확인 후 본인 로그만 삭제한다. 시간·메모는 별도 선택 상세 action으로 갱신한다.
4. 설정 페이지는 세션 확인 후 `user_settings.maybeSingle()`을 호출한다. 행이 없으면 기본값 폼을 표시하고 저장 시 `user_id` conflict 기준으로 upsert한다.
5. 테이블 부재·네트워크 오류는 빈 설정 상태로 위장하지 않고 재시도 가능한 실제 오류로 표시한다.
