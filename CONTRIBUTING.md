# Contributing to BOGUNON

## 릴리즈 기록

- 새 릴리즈를 준비할 때 `CHANGELOG.md` 최상단의 기존 릴리즈보다 위에 새 버전을 추가합니다.
- 릴리즈 버전은 `v0.9.2` 형식을 사용합니다.
- 각 릴리즈에는 Release Name과 Release Date를 기록합니다.
- 섹션은 `Added`, `Changed`, `Improved`, `Fixed`, `Verified` 순서를 유지하며, 해당 변경이 없는 섹션은 생략할 수 있습니다.
- `package.json`의 `version`은 `CHANGELOG.md`의 최신 릴리즈 버전에서 `v`를 제외한 값과 항상 일치해야 합니다.
- `package-lock.json`의 루트 패키지 버전도 `package.json`과 함께 갱신합니다.
- 아직 배포되지 않은 계획은 `Next` 아래에 기록하고, 실제 배포 시 정식 릴리즈 항목으로 이동합니다.

## 릴리즈 공지 실행 계약

- 릴리즈 공지 자동화는 Production 서버 환경에서만 실행합니다.
- 필요한 환경 변수 이름은 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SYSTEM_NOTICE_AUTHOR_ID`입니다. 실제 값, 식별자, 메일 주소는 문서나 저장소에 기록하지 않습니다.
- `SYSTEM_NOTICE_AUTHOR_ID`는 운영 데이터베이스에 이미 존재하는 admin 또는 owner 계정이어야 합니다.
- Preview와 build 단계에서는 공지 데이터를 쓰지 않습니다.
- Vercel Production deployment status가 `READY`인 것을 먼저 확인한 뒤 게시 절차를 실행합니다.
- 자동화 실행 자체만으로 사용자 공지가 생성되지는 않습니다.
