"use server";

import { revalidatePath } from "next/cache";

import { exerciseEventValues, exerciseInputSchema, exerciseRecordFromEvent, exerciseStatusSchema, isExerciseRecordEvent, serializeExerciseMetadata } from "@/lib/exercise/domain";
import { saveEventBundle } from "@/lib/work-items/phase5-repository";
import { listAllEvents, updateEventDescription } from "@/lib/work-items/repository";

export type ExerciseActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function refreshExercise(): void {
  revalidatePath("/exercise");
  revalidatePath("/calendar");
  revalidatePath("/briefing");
  revalidatePath("/annual");
}

export async function saveExerciseAction(_state: ExerciseActionState, formData: FormData): Promise<ExerciseActionState> {
  const recurrenceValue = value(formData, "recurrence");
  const parsed = exerciseInputSchema.safeParse({
    date: value(formData, "date"),
    durationMinutes: Number(value(formData, "durationMinutes")),
    exerciseType: value(formData, "exerciseType"),
    intensity: value(formData, "intensity"),
    location: value(formData, "location"),
    memo: value(formData, "memo"),
    recurrence: recurrenceValue || null,
    startTime: value(formData, "startTime"),
    status: "planned",
  });
  if (!parsed.success) {
    const durationInvalid = parsed.error.issues.some((issue) => issue.path[0] === "durationMinutes");
    return { status: "error", message: durationInvalid ? "운동 시간을 확인해 주세요." : "운동 기록의 필수 항목을 확인해 주세요." };
  }
  try {
    await saveEventBundle(exerciseEventValues(parsed.data), { links: [], reminders: [] });
    refreshExercise();
    return { status: "success", message: "운동 기록을 저장했습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "운동 기록을 저장하지 못했습니다." };
  }
}

export async function setExerciseStatusAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  const status = exerciseStatusSchema.safeParse(value(formData, "status"));
  if (!id || !status.success) return;
  const event = (await listAllEvents()).find((item) => item.id === id && isExerciseRecordEvent(item));
  if (!event) return;
  const record = exerciseRecordFromEvent(event);
  await updateEventDescription(id, serializeExerciseMetadata({ ...record, status: status.data }));
  refreshExercise();
}
