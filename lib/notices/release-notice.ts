import type { NoticeInput } from "@/lib/notices/model";

const TITLE_LIMIT = 160;
const SUMMARY_LIMIT = 300;
const CONTENT_LIMIT = 10_000;
const USER_FACING_CHANGELOG_SECTIONS = ["Added", "Changed", "Improved", "Fixed"] as const;
const INTERNAL_ROOTS = [".github/", "archive/", "docs/", "fixtures/", "scripts/", "test/", "tests/"] as const;
const INTERNAL_EXACT_FILES = [
  "lib/notices/release-notice.ts",
  "lib/notices/system-repository.ts",
  "lib/supabase/admin.ts",
] as const;
const RELEASE_ONLY_FILES = ["CHANGELOG.md", "package.json", "package-lock.json", "tsconfig.tsbuildinfo"] as const;
const TEST_FILE_MARKERS = [".test.", ".spec.", "/__tests__/", "/test/", "/tests/"] as const;

export type ReleaseNoticeInput = {
  readonly version: string;
  readonly changedPaths: readonly string[];
  readonly changelogText: string;
};

export type ReleaseNoticeResult =
  | { readonly kind: "publish"; readonly notice: NoticeInput }
  | { readonly kind: "skip"; readonly reason: "internal_only_diff" | "release_entry_missing" };

export function buildReleaseNotice(input: ReleaseNoticeInput): ReleaseNoticeResult {
  if (!input.changedPaths.some(isUserFacingPath)) {
    return { kind: "skip", reason: "internal_only_diff" };
  }

  const entry = changelogEntry(input.version, input.changelogText);
  if (entry === null) {
    return { kind: "skip", reason: "release_entry_missing" };
  }

  const bullets = userFacingBullets(entry);
  if (bullets.length === 0) {
    return { kind: "skip", reason: "internal_only_diff" };
  }

  const firstBullet = bullets[0] ?? "사용자 화면 개선";
  const content = limitText(
    [
      `BOGUNON ${input.version} 업데이트에서는 사용자가 체감할 수 있는 변경 사항을 정리했습니다.`,
      "",
      ...bullets.map((bullet) => `- ${bullet}`),
    ].join("\n"),
    CONTENT_LIMIT,
  );

  return {
    kind: "publish",
    notice: {
      title: limitText(`BOGUNON ${input.version} 업데이트`, TITLE_LIMIT),
      summary: limitText(`${firstBullet} 등 사용성 개선 사항을 담았습니다.`, SUMMARY_LIMIT),
      content,
      category: "update",
      isPublished: true,
      isImportant: false,
      publishStartAt: null,
      publishEndAt: null,
    },
  };
}

function isUserFacingPath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//u, "");
  if (INTERNAL_EXACT_FILES.some((file) => file === normalized)) return false;
  if (RELEASE_ONLY_FILES.some((file) => file === normalized)) return false;
  if (INTERNAL_ROOTS.some((root) => normalized.startsWith(root))) return false;
  if (TEST_FILE_MARKERS.some((marker) => normalized.includes(marker))) return false;
  if (normalized.endsWith(".md") || normalized.endsWith(".mdx")) return false;
  return true;
}

function changelogEntry(version: string, changelogText: string): string | null {
  const pattern = new RegExp(`^##\\s+v?${escapeRegex(version)}(?:\\s|$).*`, "m");
  const match = pattern.exec(changelogText);
  if (match === null) return null;
  const entryAndFollowing = changelogText.slice(match.index);
  const nextEntryOffset = entryAndFollowing.slice(1).search(/^##\s+/m);
  return nextEntryOffset === -1 ? entryAndFollowing.trim() : entryAndFollowing.slice(0, nextEntryOffset + 1).trim();
}

function userFacingBullets(entry: string): readonly string[] {
  const bullets: string[] = [];
  let collectBullets = false;

  for (const line of entry.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      const sectionName = trimmed.slice(4).trim();
      collectBullets = USER_FACING_CHANGELOG_SECTIONS.some((section) => sectionName === section || sectionName.endsWith(` ${section}`));
      continue;
    }

    if (collectBullets && trimmed.startsWith("- ")) {
      const bullet = cleanBullet(trimmed.slice(2));
      if (bullet) bullets.push(bullet);
    }
  }

  return bullets;
}

function cleanBullet(value: string): string {
  return value
    .replace(/`/gu, "")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function limitText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}…`;
}
