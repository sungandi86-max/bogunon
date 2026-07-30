# Contributing to BOGUNON

## 릴리즈 기록

- 새 릴리즈를 준비할 때 `CHANGELOG.md` 최상단의 기존 릴리즈보다 위에 새 버전을 추가합니다.
- 릴리즈 버전은 `v0.9.2` 형식을 사용합니다.
- 각 릴리즈에는 Release Name과 Release Date를 기록합니다.
- 섹션은 `Added`, `Changed`, `Improved`, `Fixed`, `Verified` 순서를 유지하며, 해당 변경이 없는 섹션은 생략할 수 있습니다.
- `package.json`의 `version`은 `CHANGELOG.md`의 최신 릴리즈 버전에서 `v`를 제외한 값과 항상 일치해야 합니다.
- `package-lock.json`의 루트 패키지 버전도 `package.json`과 함께 갱신합니다.
- 아직 배포되지 않은 계획은 `Next` 아래에 기록하고, 실제 배포 시 정식 릴리즈 항목으로 이동합니다.
