"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  projectFileAccessSchema,
  projectFileCandidateInputSchema,
  projectFileFinalizeSchema,
  projectFilesTargetSchema,
  projectFileTargetSchema,
} from "@/lib/projects/files";
import {
  cancelProjectFileUpload,
  createProjectFileAccess,
  deleteProjectFile,
  finalizeProjectFileUpload,
  listProjectFiles,
  prepareProjectFileUpload,
} from "@/lib/projects/files-repository";
import type { ProjectFileRow } from "@/types/database";

export type FileUploadTarget = {
  readonly fileId: string;
  readonly filename: string;
  readonly path: string;
  readonly token: string;
};

export type FilesActionResult =
  | {
    readonly file?: ProjectFileRow;
    readonly files?: readonly ProjectFileRow[];
    readonly message: string;
    readonly signedUrl?: string;
    readonly status: "success";
    readonly upload?: FileUploadTarget;
  }
  | { readonly message: string; readonly status: "error" };

const cancelUploadSchema = projectFilesTargetSchema.extend({
  path: z.string().min(1),
});

function actionError(error: unknown, fallback: string): FilesActionResult {
  if (error instanceof z.ZodError) {
    return { message: error.issues[0]?.message ?? fallback, status: "error" };
  }
  if (error instanceof Error) return { message: error.message, status: "error" };
  return { message: fallback, status: "error" };
}

export async function loadProjectFilesAction(input: unknown): Promise<FilesActionResult> {
  try {
    const { projectId } = projectFilesTargetSchema.parse(input);
    return { files: await listProjectFiles(projectId), message: "", status: "success" };
  } catch (error) {
    return actionError(error, "파일을 불러오지 못했습니다.");
  }
}

export async function prepareProjectFileUploadAction(input: unknown): Promise<FilesActionResult> {
  try {
    const parsed = projectFileCandidateInputSchema.parse(input);
    return {
      message: "",
      status: "success",
      upload: await prepareProjectFileUpload(parsed),
    };
  } catch (error) {
    return actionError(error, "업로드를 준비하지 못했습니다.");
  }
}

export async function finalizeProjectFileUploadAction(input: unknown): Promise<FilesActionResult> {
  try {
    const parsed = projectFileFinalizeSchema.parse(input);
    const file = await finalizeProjectFileUpload(parsed);
    revalidatePath(`/projects/${parsed.projectId}`);
    return { file, message: "파일을 업로드했습니다.", status: "success" };
  } catch (error) {
    return actionError(error, "파일 정보를 저장하지 못했습니다.");
  }
}

export async function cancelProjectFileUploadAction(input: unknown): Promise<FilesActionResult> {
  try {
    const parsed = cancelUploadSchema.parse(input);
    await cancelProjectFileUpload(parsed);
    return { message: "", status: "success" };
  } catch (error) {
    return actionError(error, "업로드 파일을 정리하지 못했습니다.");
  }
}

export async function createProjectFileAccessAction(input: unknown): Promise<FilesActionResult> {
  try {
    const parsed = projectFileAccessSchema.parse(input);
    return {
      message: "",
      signedUrl: await createProjectFileAccess(parsed),
      status: "success",
    };
  } catch (error) {
    return actionError(error, "파일을 열지 못했습니다.");
  }
}

export async function deleteProjectFileAction(input: unknown): Promise<FilesActionResult> {
  try {
    const parsed = projectFileTargetSchema.parse(input);
    await deleteProjectFile(parsed);
    revalidatePath(`/projects/${parsed.projectId}`);
    return { message: "파일을 삭제했습니다.", status: "success" };
  } catch (error) {
    return actionError(error, "파일을 삭제하지 못했습니다.");
  }
}
