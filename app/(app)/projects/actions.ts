"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { projectInputFromFormData } from "@/lib/projects/domain";
import { deleteProject, saveProject } from "@/lib/projects/repository";

export interface ProjectActionState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly projectId?: string;
}

function refreshProjects(id?: string): void {
  revalidatePath("/projects");
  revalidatePath("/calendar");
  if (id) revalidatePath(`/projects/${id}`);
}

export async function saveProjectAction(
  _state: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  try {
    const id = String(formData.get("id") ?? "").trim() || undefined;
    const projectId = await saveProject(projectInputFromFormData(formData), id);
    refreshProjects(projectId);
    return { status: "success", message: id ? "프로젝트를 수정했습니다." : "프로젝트를 만들었습니다.", projectId };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message ?? "프로젝트 정보를 확인해 주세요."
      : error instanceof Error ? error.message : "프로젝트를 저장하지 못했습니다.";
    return { status: "error", message };
  }
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await deleteProject(id);
  refreshProjects(id);
}
