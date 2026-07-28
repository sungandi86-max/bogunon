import {
  PROJECT_FILES_BUCKET,
  parseProjectFileCandidate,
  type ProjectFileAccess,
  type ProjectFileFinalize,
  type ProjectFileTarget,
} from "@/lib/projects/files";
import { createClient } from "@/lib/supabase/server";
import type { ProjectFileRow } from "@/types/database";

const SIGNED_URL_SECONDS = 120;

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

async function ownedFile(input: ProjectFileTarget): Promise<ProjectFileRow> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("id", input.fileId)
    .eq("project_id", input.projectId)
    .eq("user_id", userId)
    .single();
  if (error) throw new Error("파일 정보를 찾지 못했습니다.");
  return data;
}

export async function listProjectFiles(projectId: string): Promise<ProjectFileRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });
  if (error) throw new Error("파일을 불러오지 못했습니다.");
  return data;
}

export async function prepareProjectFileUpload(input: {
  readonly name: string;
  readonly projectId: string;
  readonly size: number;
  readonly type: string;
}) {
  const parsed = parseProjectFileCandidate(input);
  const { supabase, userId } = await ownedClient();
  const fileId = crypto.randomUUID();
  const filename = `${fileId}.${parsed.extension}`;
  const path = `${userId}/${input.projectId}/${filename}`;
  const { data, error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw new Error("업로드를 준비하지 못했습니다.");
  return { fileId, filename, path, token: data.token };
}

export async function finalizeProjectFileUpload(
  input: ProjectFileFinalize,
): Promise<ProjectFileRow> {
  const parsed = parseProjectFileCandidate({
    name: input.originalFilename,
    size: input.sizeBytes,
    type: input.mimeType,
  });
  const expectedFilename = `${input.fileId}.${parsed.extension}`;
  const { supabase, userId } = await ownedClient();
  const expectedPath = `${userId}/${input.projectId}/${expectedFilename}`;
  if (input.filename !== expectedFilename || input.storagePath !== expectedPath) {
    throw new Error("업로드 파일 경로가 올바르지 않습니다.");
  }
  const { data, error } = await supabase
    .from("project_files")
    .insert({
      filename: expectedFilename,
      id: input.fileId,
      mime_type: parsed.mimeType,
      original_filename: parsed.name,
      project_id: input.projectId,
      size_bytes: parsed.size,
      storage_path: expectedPath,
      user_id: userId,
    })
    .select("*")
    .single();
  if (error) throw new Error("파일 정보를 저장하지 못했습니다.");
  return data;
}

export async function cancelProjectFileUpload(input: {
  readonly path: string;
  readonly projectId: string;
}): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const prefix = `${userId}/${input.projectId}/`;
  if (!input.path.startsWith(prefix)) throw new Error("업로드 파일 경로가 올바르지 않습니다.");
  const { error } = await supabase.storage.from(PROJECT_FILES_BUCKET).remove([input.path]);
  if (error) throw new Error("업로드 파일을 정리하지 못했습니다.");
}

export async function createProjectFileAccess(input: ProjectFileAccess): Promise<string> {
  const file = await ownedFile(input);
  const { supabase } = await ownedClient();
  const options = input.mode === "download"
    ? { download: file.original_filename }
    : undefined;
  const { data, error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_SECONDS, options);
  if (error) throw new Error(
    input.mode === "download" ? "다운로드 주소를 만들지 못했습니다." : "미리보기를 열지 못했습니다.",
  );
  return data.signedUrl;
}

export async function deleteProjectFile(input: ProjectFileTarget): Promise<void> {
  const file = await ownedFile(input);
  const { supabase, userId } = await ownedClient();
  const { error: storageError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .remove([file.storage_path]);
  if (storageError) throw new Error("Storage 파일을 삭제하지 못했습니다.");
  const { error } = await supabase
    .from("project_files")
    .delete()
    .eq("id", input.fileId)
    .eq("project_id", input.projectId)
    .eq("user_id", userId);
  if (error) throw new Error("파일 정보를 삭제하지 못했습니다.");
}

export async function deleteProjectFileObjects(projectId: string): Promise<void> {
  const files = await listProjectFiles(projectId);
  if (!files.length) return;
  const { supabase } = await ownedClient();
  const { error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .remove(files.map((file) => file.storage_path));
  if (error) throw new Error("프로젝트 파일을 정리하지 못했습니다.");
}
