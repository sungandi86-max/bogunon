"use client";

import { PROJECT_FILES_BUCKET } from "@/lib/projects/files";
import { createClient } from "@/lib/supabase/client";

export class ProjectFileTransferError extends Error {
  readonly operation: "preview" | "upload";

  constructor(operation: ProjectFileTransferError["operation"], message: string) {
    super(message);
    this.name = "ProjectFileTransferError";
    this.operation = operation;
  }
}

export async function uploadProjectFileToSignedUrl(
  file: File,
  upload: { readonly path: string; readonly token: string },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .uploadToSignedUrl(upload.path, upload.token, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (error) throw new ProjectFileTransferError("upload", "파일 업로드에 실패했습니다.");
}

export async function loadSignedFilePreview(
  signedUrl: string,
  mimeType: string,
): Promise<{ readonly objectUrl?: string; readonly text?: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(signedUrl, { signal: controller.signal });
    if (!response.ok) throw new ProjectFileTransferError("preview", "파일 미리보기를 불러오지 못했습니다.");
    if (mimeType === "text/plain") {
      return { text: (await response.text()).slice(0, 20_000) };
    }
    const blob = await response.blob();
    return { objectUrl: URL.createObjectURL(blob) };
  } catch (error) {
    if (error instanceof ProjectFileTransferError) throw error;
    throw new ProjectFileTransferError("preview", "파일 미리보기를 불러오지 못했습니다.");
  } finally {
    window.clearTimeout(timeout);
  }
}
