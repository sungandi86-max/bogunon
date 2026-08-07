"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { projectPlaceInputFromFormData } from "@/lib/projects/places";
import { deleteProjectPlace, reorderProjectPlaces, saveProjectPlace, updateProjectPlaceVisited } from "@/lib/projects/places-repository";
import type { ProjectPlaceRow } from "@/types/database";

export type PlaceActionResult =
  | { readonly status: "success"; readonly message: string; readonly place?: ProjectPlaceRow }
  | { readonly status: "error"; readonly message: string };

function actionError(error: unknown, fallback: string): PlaceActionResult {
  if (error instanceof z.ZodError) return { status: "error", message: error.issues[0]?.message ?? fallback };
  if (error instanceof Error) return { status: "error", message: error.message };
  return { status: "error", message: fallback };
}

export async function savePlaceAction(_state: PlaceActionResult, formData: FormData): Promise<PlaceActionResult> {
  try {
    const input = projectPlaceInputFromFormData(formData);
    const place = await saveProjectPlace(input);
    revalidatePath(`/projects/${input.projectId}`);
    return { status: "success", message: input.placeId ? "장소를 수정했습니다." : "지도에 장소를 추가했습니다.", place };
  } catch (error) {
    return actionError(error, "장소를 저장하지 못했습니다.");
  }
}

const mutationSchema = z.object({ projectId: z.string().uuid(), placeId: z.string().uuid() });

export async function deletePlaceAction(input: unknown): Promise<PlaceActionResult> {
  try {
    const parsed = mutationSchema.parse(input);
    await deleteProjectPlace(parsed.projectId, parsed.placeId);
    revalidatePath(`/projects/${parsed.projectId}`);
    return { status: "success", message: "장소를 삭제했습니다." };
  } catch (error) {
    return actionError(error, "장소를 삭제하지 못했습니다.");
  }
}

export async function reorderPlacesAction(input: unknown): Promise<PlaceActionResult> {
  try {
    const parsed = z.object({ projectId: z.string().uuid(), placeIds: z.array(z.string().uuid()).min(1) }).parse(input);
    await reorderProjectPlaces(parsed.projectId, parsed.placeIds);
    revalidatePath(`/projects/${parsed.projectId}`);
    return { status: "success", message: "방문 순서를 저장했습니다." };
  } catch (error) {
    return actionError(error, "장소 순서를 저장하지 못했습니다.");
  }
}

export async function togglePlaceVisitedAction(input: unknown): Promise<PlaceActionResult> {
  try {
    const parsed = mutationSchema.extend({ isVisited: z.boolean() }).parse(input);
    const place = await updateProjectPlaceVisited(parsed.projectId, parsed.placeId, parsed.isVisited);
    revalidatePath(`/projects/${parsed.projectId}`);
    return { status: "success", message: parsed.isVisited ? "방문 완료로 표시했습니다." : "방문 예정으로 되돌렸습니다.", place };
  } catch (error) {
    return actionError(error, "방문 상태를 저장하지 못했습니다.");
  }
}
