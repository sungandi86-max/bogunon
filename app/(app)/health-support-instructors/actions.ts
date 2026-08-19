"use server";

import { revalidatePath } from "next/cache";

import {
  createHealthSupportInstructor,
  createHealthSupportWorkLog,
  deleteHealthSupportInstructor,
  deleteHealthSupportWorkLog,
  parseHealthSupportInstructorInput,
  parseHealthSupportWorkLogMutation,
  updateHealthSupportInstructor,
  updateHealthSupportWorkLog,
} from "@/lib/health-support-instructors/repository";

export type HealthSupportActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };
type WorkLogActionInput = { readonly instructorId: string; readonly date: string; readonly startTime: string; readonly endTime: string; readonly note: string | null };

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function refreshHealthSupportInstructors(): void {
  revalidatePath("/health-support-instructors");
}

function validationMessage(error: { readonly issues: readonly { readonly message: string }[] }): string {
  return error.issues[0]?.message ?? "Please check the entered values";
}

function parseWorkLogActionInput(formData: FormData): WorkLogActionInput | { readonly error: string } {
  const parsed = parseHealthSupportWorkLogMutation({
    instructorId: value(formData, "instructorId"),
    date: value(formData, "date"),
    startTime: value(formData, "startTime"),
    endTime: value(formData, "endTime"),
    note: value(formData, "note") || null,
  });
  return parsed.success ? parsed.data : { error: validationMessage(parsed.error) };
}

export async function saveHealthSupportInstructorAction(_state: HealthSupportActionState, formData: FormData): Promise<HealthSupportActionState> {
  const parsed = instructorActionInput(formData);
  if ("error" in parsed) return { status: "error", message: parsed.error };
  try {
    const id = value(formData, "id");
    if (id) await updateHealthSupportInstructor(id, parsed);
    else await createHealthSupportInstructor(parsed);
    refreshHealthSupportInstructors();
    return { status: "success", message: "Instructor settings saved" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save instructor settings" };
  }
}

export async function saveHealthSupportWorkLogAction(_state: HealthSupportActionState, formData: FormData): Promise<HealthSupportActionState> {
  const parsed = parseWorkLogActionInput(formData);
  if ("error" in parsed) return { status: "error", message: parsed.error };
  try {
    const id = value(formData, "id");
    if (id) await updateHealthSupportWorkLog(id, parsed);
    else await createHealthSupportWorkLog(parsed);
    refreshHealthSupportInstructors();
    return { status: "success", message: "Work log saved" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save work log" };
  }
}

export async function deleteHealthSupportInstructorAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  if (!id) return;
  await deleteHealthSupportInstructor(id);
  refreshHealthSupportInstructors();
}

export async function deleteHealthSupportWorkLogAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  if (!id) return;
  await deleteHealthSupportWorkLog(id);
  refreshHealthSupportInstructors();
}

function instructorActionInput(formData: FormData): ReturnType<typeof parseHealthSupportInstructorInput> | { readonly error: string } {
  try {
    return parseHealthSupportInstructorInput({
      name: value(formData, "name"), subject: value(formData, "subject"), weeklyHours: Number(value(formData, "weeklyHours")), hourlyRate: Number(value(formData, "hourlyRate")), monthlyInsurance: Number(value(formData, "monthlyInsurance")), monthlyHourLimit: Number(value(formData, "monthlyHourLimit")), weeklyHourLimit: Number(value(formData, "weeklyHourLimit")), totalBudget: Number(value(formData, "totalBudget")), operationStartDate: value(formData, "operationStartDate"), operationEndDate: value(formData, "operationEndDate"),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Please check the entered values" };
  }
}
