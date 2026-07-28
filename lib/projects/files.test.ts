import { describe, expect, it } from "vitest";

import {
  MAX_PROJECT_FILE_SIZE,
  filterProjectFiles,
  formatProjectFileSize,
  parseProjectFileCandidate,
  sortProjectFiles,
} from "@/lib/projects/files";
import type { ProjectFileRow } from "@/types/database";

const files: readonly ProjectFileRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-1",
    project_id: "project-1",
    reservation_id: null,
    filename: "one.pdf",
    original_filename: "호텔 예약 확인서.pdf",
    mime_type: "application/pdf",
    size_bytes: 2_000,
    storage_path: "user-1/project-1/one.pdf",
    uploaded_at: "2026-07-27T10:00:00Z",
    updated_at: "2026-07-27T10:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: "user-1",
    project_id: "project-1",
    reservation_id: null,
    filename: "two.png",
    original_filename: "제주 지도.png",
    mime_type: "image/png",
    size_bytes: 8_000,
    storage_path: "user-1/project-1/two.png",
    uploaded_at: "2026-07-28T10:00:00Z",
    updated_at: "2026-07-28T10:00:00Z",
  },
];

describe("project files domain", () => {
  it("accepts supported extension and MIME pairs at the size boundary", () => {
    expect(parseProjectFileCandidate({
      name: "공문.pdf",
      size: MAX_PROJECT_FILE_SIZE,
      type: "application/pdf",
    })).toMatchObject({ extension: "pdf", kind: "pdf" });
  });

  it("rejects unsupported, mismatched, empty, unsafe, and oversized files", () => {
    expect(() => parseProjectFileCandidate({
      name: "movie.mp4",
      size: 100,
      type: "video/mp4",
    })).toThrow("지원하지 않는 파일 형식");
    expect(() => parseProjectFileCandidate({
      name: "renamed.pdf",
      size: 100,
      type: "image/png",
    })).toThrow("확장자와 파일 형식");
    expect(() => parseProjectFileCandidate({
      name: "../secret.txt",
      size: 100,
      type: "text/plain",
    })).toThrow("파일명");
    expect(() => parseProjectFileCandidate({
      name: "empty.txt",
      size: 0,
      type: "text/plain",
    })).toThrow("비어");
    expect(() => parseProjectFileCandidate({
      name: "large.txt",
      size: MAX_PROJECT_FILE_SIZE + 1,
      type: "text/plain",
    })).toThrow("15MB");
  });

  it("filters by filename and sorts by recent, name, or size", () => {
    expect(filterProjectFiles(files, "호텔")).toEqual([files[0]]);
    expect(sortProjectFiles(files, "recent").map((file) => file.id)).toEqual([
      files[1]?.id,
      files[0]?.id,
    ]);
    expect(sortProjectFiles(files, "name").map((file) => file.id)).toEqual([
      files[1]?.id,
      files[0]?.id,
    ]);
    expect(sortProjectFiles(files, "size").map((file) => file.id)).toEqual([
      files[1]?.id,
      files[0]?.id,
    ]);
  });

  it("formats file sizes for Korean metadata", () => {
    expect(formatProjectFileSize(512)).toBe("512B");
    expect(formatProjectFileSize(2_048)).toBe("2KB");
    expect(formatProjectFileSize(1_572_864)).toBe("1.5MB");
  });
});
