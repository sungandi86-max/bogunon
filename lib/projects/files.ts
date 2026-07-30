import { z } from "zod";

import type { ProjectFileRow } from "@/types/database";

export const PROJECT_FILES_BUCKET = "project-files";
export const MAX_PROJECT_FILE_SIZE = 15 * 1024 * 1024;
export const PROJECT_FILE_ACCEPT = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".docx",
  ".xlsx",
  ".pptx",
  ".txt",
].join(",");

const fileFormats = {
  docx: {
    kind: "office",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  jpeg: { kind: "image", mimeType: "image/jpeg" },
  jpg: { kind: "image", mimeType: "image/jpeg" },
  pdf: { kind: "pdf", mimeType: "application/pdf" },
  png: { kind: "image", mimeType: "image/png" },
  pptx: {
    kind: "office",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  txt: { kind: "text", mimeType: "text/plain" },
  webp: { kind: "image", mimeType: "image/webp" },
  xlsx: {
    kind: "office",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
} as const;

const fileExtensionSchema = z.enum([
  "docx",
  "jpeg",
  "jpg",
  "pdf",
  "png",
  "pptx",
  "txt",
  "webp",
  "xlsx",
]);

export type ProjectFileKind = (typeof fileFormats)[keyof typeof fileFormats]["kind"];
export type ProjectFileSort = "recent" | "name" | "size";

const fileCandidateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive(),
  type: z.string().trim().min(1),
});

const projectIdSchema = z.string().uuid();
const fileIdSchema = z.string().uuid();

export const projectFilesTargetSchema = z.object({
  projectId: projectIdSchema,
});

export const projectFileTargetSchema = z.object({
  fileId: fileIdSchema,
  projectId: projectIdSchema,
});

export const projectFileAccessSchema = projectFileTargetSchema.extend({
  mode: z.enum(["preview", "download"]),
});

export const projectFileCandidateInputSchema = projectFilesTargetSchema.extend({
  name: z.string(),
  size: z.number(),
  type: z.string(),
});

export const projectFileFinalizeSchema = projectFileTargetSchema.extend({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  originalFilename: z.string().min(1).max(255),
  reservationId: z.string().uuid().nullable(),
  sizeBytes: z.number().int().positive().max(MAX_PROJECT_FILE_SIZE),
  storagePath: z.string().min(1),
});

export type ProjectFileTarget = z.infer<typeof projectFileTargetSchema>;
export type ProjectFileAccess = z.infer<typeof projectFileAccessSchema>;
export type ProjectFileFinalize = z.infer<typeof projectFileFinalizeSchema>;

export type ParsedProjectFile = {
  readonly extension: keyof typeof fileFormats;
  readonly kind: ProjectFileKind;
  readonly mimeType: string;
  readonly name: string;
  readonly size: number;
};

export class ProjectFileValidationError extends Error {
  readonly code: "empty" | "mismatch" | "size" | "type" | "unsafe";

  constructor(code: ProjectFileValidationError["code"], message: string) {
    super(message);
    this.name = "ProjectFileValidationError";
    this.code = code;
  }
}

export function parseProjectFileCandidate(input: unknown): ParsedProjectFile {
  const result = fileCandidateSchema.safeParse(input);
  if (!result.success) {
    const size = typeof input === "object" && input !== null && "size" in input
      ? input.size
      : undefined;
    if (size === 0) throw new ProjectFileValidationError("empty", "비어 있는 파일은 업로드할 수 없습니다.");
    throw new ProjectFileValidationError("type", "파일 정보를 확인해 주세요.");
  }
  const { name, size, type } = result.data;
  if (/[/\\\u0000-\u001f\u007f]/u.test(name)) {
    throw new ProjectFileValidationError("unsafe", "파일명에 사용할 수 없는 문자가 있습니다.");
  }
  if (size > MAX_PROJECT_FILE_SIZE) {
    throw new ProjectFileValidationError("size", "파일은 15MB 이하만 업로드할 수 있습니다.");
  }
  const extensionResult = fileExtensionSchema.safeParse(
    name.split(".").at(-1)?.toLocaleLowerCase("en-US") ?? "",
  );
  if (!extensionResult.success) {
    throw new ProjectFileValidationError("type", "지원하지 않는 파일 형식입니다.");
  }
  const extension = extensionResult.data;
  const format = fileFormats[extension];
  if (format.mimeType !== type) {
    throw new ProjectFileValidationError("mismatch", "확장자와 파일 형식이 일치하지 않습니다.");
  }
  return { extension, kind: format.kind, mimeType: format.mimeType, name, size };
}

export function projectFileKind(file: Pick<ProjectFileRow, "mime_type">): ProjectFileKind {
  if (file.mime_type.startsWith("image/")) return "image";
  if (file.mime_type === "application/pdf") return "pdf";
  if (file.mime_type === "text/plain") return "text";
  return "office";
}

export function filterProjectFiles(
  files: readonly ProjectFileRow[],
  query: string,
): ProjectFileRow[] {
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  if (!normalized) return [...files];
  return files.filter((file) => (
    file.original_filename.toLocaleLowerCase("ko-KR").includes(normalized)
  ));
}

export function sortProjectFiles(
  files: readonly ProjectFileRow[],
  sort: ProjectFileSort,
): ProjectFileRow[] {
  return [...files].sort((left, right) => {
    if (sort === "name") {
      return left.original_filename.localeCompare(right.original_filename, "ko-KR");
    }
    if (sort === "size") return right.size_bytes - left.size_bytes;
    return right.uploaded_at.localeCompare(left.uploaded_at);
  });
}

export function formatProjectFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes}B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)}KB`;
  const megabytes = sizeBytes / (1024 * 1024);
  return `${Number(megabytes.toFixed(1))}MB`;
}
