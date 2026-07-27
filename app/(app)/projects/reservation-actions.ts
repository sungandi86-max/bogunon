"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  reservationDeleteSchema,
  reservationInputFromFormData,
} from "@/lib/projects/reservations";
import {
  deleteProjectReservation,
  saveProjectReservation,
} from "@/lib/projects/reservation-repository";

export type ReservationActionResult =
  | { readonly status: "success"; readonly message: string; readonly reservationId?: string }
  | { readonly status: "error"; readonly message: string };

function refreshReservationViews(projectId: string): void {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/calendar");
}

function actionError(error: unknown, fallback: string): ReservationActionResult {
  if (error instanceof z.ZodError) {
    return { status: "error", message: error.issues[0]?.message ?? fallback };
  }
  if (error instanceof Error) return { status: "error", message: error.message };
  return { status: "error", message: fallback };
}

export async function saveReservationAction(
  _state: ReservationActionResult,
  formData: FormData,
): Promise<ReservationActionResult> {
  try {
    const input = reservationInputFromFormData(formData);
    const reservationId = await saveProjectReservation(input);
    refreshReservationViews(input.projectId);
    return {
      status: "success",
      message: input.reservationId ? "예약을 수정했습니다." : "예약을 추가했습니다.",
      reservationId,
    };
  } catch (error) {
    return actionError(error, "예약을 저장하지 못했습니다.");
  }
}

export async function deleteReservationAction(input: unknown): Promise<ReservationActionResult> {
  try {
    const parsed = reservationDeleteSchema.parse(input);
    await deleteProjectReservation(parsed);
    refreshReservationViews(parsed.projectId);
    return { status: "success", message: "예약을 삭제했습니다." };
  } catch (error) {
    return actionError(error, "예약을 삭제하지 못했습니다.");
  }
}
