import { describe, expect, it } from "vitest";
import { buildReleaseNotice } from "@/lib/notices/release-notice";

const releaseEntry = `# CHANGELOG

## v0.21.0 - Mobile Calendar Date Detail

Release Date: 2026-09-08

### Added

- 모바일 월간 캘린더에서 선택한 날짜의 일정, 업무, 날짜 스티커를 확인하는 날짜 상세 바텀 시트
- 선택한 날짜를 시작일과 종료일로 미리 채우는 \`이 날 일정 추가하기\` 흐름

### Improved

- 날짜 상세 바텀 시트의 닫기 동작과 닫힌 뒤 날짜 버튼으로 돌아가는 포커스 복원
- 기존 데스크톱 월간 상세 패널과 일간 시간표 흐름 유지

### Verified

- 모바일 날짜 상세, 빈 날짜, 일정 추가 날짜 전달, 닫기 및 데스크톱 회귀 집중 테스트
- \`git diff --check\`

## v0.12.0 - AED Management

- 다른 릴리즈`;

const userFacingPaths = [
  "CHANGELOG.md",
  "components/calendar/calendar-workspace-mobile-detail.test.tsx",
  "components/calendar/calendar-workspace.tsx",
  "components/calendar/event-list.test.tsx",
  "components/calendar/event-list.tsx",
  "package-lock.json",
  "package.json",
  "styles/responsive-layout.test.ts",
  "styles/responsive.css",
] as const;

describe("buildReleaseNotice", () => {
  it("builds a published Korean update payload when the release diff changes user-facing behavior", () => {
    // Given
    const input = { version: "0.21.0", changedPaths: userFacingPaths, changelogText: releaseEntry };

    // When
    const result = buildReleaseNotice(input);

    // Then
    expect(result.kind).toBe("publish");
    if (result.kind !== "publish") return;
    expect(result.notice).toMatchObject({
      title: "BOGUNON 0.21.0 업데이트",
      category: "update",
      isPublished: true,
      isImportant: false,
      publishStartAt: null,
      publishEndAt: null,
    });
    expect(result.notice.summary?.length ?? 0).toBeLessThanOrEqual(300);
    expect(result.notice.content.length).toBeLessThanOrEqual(10_000);
    expect(result.notice.content).toContain("모바일 월간 캘린더");
    expect(result.notice.content).toContain("날짜 상세 바텀 시트");
    expect(result.notice.content).toContain("일정");
    expect(result.notice.content).toContain("업무");
    expect(result.notice.content).toContain("날짜 스티커");
    expect(result.notice.content).toContain("선택한 날짜");
    expect(result.notice.content).toContain("이 날 일정 추가하기");
    expect(result.notice.content).not.toContain("components/");
    expect(result.notice.content).not.toContain("calendar-workspace.tsx");
    expect(result.notice.content).not.toContain("package.json");
    expect(result.notice.content).not.toContain("git diff");
  });

  it("skips internal-only test docs chore and release automation diffs", () => {
    // Given
    const input = {
      version: "0.21.0",
      changedPaths: [
        "CHANGELOG.md",
        "docs/release-notes.md",
        "components/calendar/calendar-workspace-mobile-detail.test.tsx",
        "scripts/release/notice-generator.ts",
        ".github/workflows/release.yml",
        "package-lock.json",
        "package.json",
      ],
      changelogText: releaseEntry,
    };

    // When
    const result = buildReleaseNotice(input);

    // Then
    expect(result).toEqual({ kind: "skip", reason: "internal_only_diff" });
  });

  it("skips release notice automation implementation diffs", () => {
    // Given
    const input = {
      version: "0.21.0",
      changedPaths: [
        "lib/notices/release-notice.ts",
        "lib/notices/release-notice.test.ts",
        "lib/notices/system-repository.ts",
        "lib/notices/system-repository.test.ts",
        "lib/supabase/admin.ts",
        "lib/supabase/admin.test.ts",
        "scripts/release/create-system-notice.ts",
        ".github/workflows/release-notice.yml",
        "docs/system-notice-automation.md",
        "package.json",
        "package-lock.json",
      ],
      changelogText: releaseEntry,
    };

    // When
    const result = buildReleaseNotice(input);

    // Then
    expect(result).toEqual({ kind: "skip", reason: "internal_only_diff" });
  });

  it("builds release content from repository-standard emoji changelog headings", () => {
    // Given
    const input = {
      version: "0.20.0",
      changedPaths: ["components/calendar/calendar-workspace.tsx"],
      changelogText: `# CHANGELOG

## v0.20.0 - Calendar polish

### ✨ Added

- 모바일 캘린더에서 날짜별 스티커를 더 쉽게 확인

### 🔄 Changed

- 선택한 날짜의 일정 추가 동선을 개선
`,
    };

    // When
    const result = buildReleaseNotice(input);

    // Then
    expect(result.kind).toBe("publish");
    if (result.kind !== "publish") return;
    expect(result.notice.content).toContain("모바일 캘린더");
    expect(result.notice.content).toContain("날짜별 스티커");
    expect(result.notice.content).toContain("선택한 날짜");
    expect(result.notice.content).toContain("일정 추가");
  });

  it("skips instead of publishing stale changelog text when the requested version is missing", () => {
    // Given
    const input = { version: "0.22.0", changedPaths: userFacingPaths, changelogText: releaseEntry };

    // When
    const result = buildReleaseNotice(input);

    // Then
    expect(result).toEqual({ kind: "skip", reason: "release_entry_missing" });
  });

  it("skips malformed changelog text without a matching release heading", () => {
    // Given
    const input = {
      version: "0.22.0",
      changedPaths: userFacingPaths,
      changelogText: "v0.22.0\n\n- 모바일 캘린더 개선",
    };

    // When
    const result = buildReleaseNotice(input);

    // Then
    expect(result).toEqual({ kind: "skip", reason: "release_entry_missing" });
  });

  it("skips a changelog entry for a different version even when the diff is user-facing", () => {
    // Given
    const input = {
      version: "0.21.1",
      changedPaths: userFacingPaths,
      changelogText: "## v0.21.0\n\n### Added\n\n- 모바일 월간 캘린더 개선",
    };

    // When
    const result = buildReleaseNotice(input);

    // Then
    expect(result).toEqual({ kind: "skip", reason: "release_entry_missing" });
  });
});
