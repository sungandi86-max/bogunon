"use server";

import { revalidatePath } from "next/cache";

import { duplicateEvent } from "@/lib/work-items/phase5-repository";
import { moveSingleDayEvent } from "@/lib/work-items/repository";

export interface CalendarEventActionState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
}

export interface EventCopyActionState extends CalendarEventActionState {
  readonly targetDate?: string;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() + 1 === month
    && parsed.getUTCDate() === day;
}

function shortKoreanDate(date: string): string {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
}

function refreshEventSurfaces(): void {
  revalidatePath("/briefing");
  revalidatePath("/calendar");
  revalidatePath("/annual");
}

export async function moveSingleDayEventAction(input: {
  readonly id: string;
  readonly newDate: string;
}): Promise<CalendarEventActionState> {
  if (!input.id || !isCalendarDate(input.newDate)) {
    return { status: "error", message: "이동할 일정과 날짜를 확인해 주세요." };
  }

  try {
    await moveSingleDayEvent(input.id, input.newDate);
    refreshEventSurfaces();
    return {
      status: "success",
      message: `일정을 ${shortKoreanDate(input.newDate)}로 이동했습니다.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "일정을 이동하지 못했습니다.",
    };
  }
}

export async function copyEventAction(
  _state: EventCopyActionState,
  formData: FormData,
): Promise<EventCopyActionState> {
  const id = String(formData.get("id") ?? "");
  const targetDate = String(formData.get("targetDate") ?? "");
  if (!id || !isCalendarDate(targetDate)) {
    return { status: "error", message: "복사할 일정과 날짜를 확인해 주세요." };
  }

  try {
    await duplicateEvent(id, targetDate, true, true);
    refreshEventSurfaces();
    return {
      status: "success",
      message: `일정이 ${shortKoreanDate(targetDate)}로 복사되었습니다.`,
      targetDate,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "일정을 복사하지 못했습니다.",
    };
  }
}
