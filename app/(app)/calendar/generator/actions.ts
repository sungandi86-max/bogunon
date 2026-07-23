"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSmartCalendarEventStore } from "@/lib/calendar-generator/event-repository";
import { buildSmartCalendarPreview } from "@/lib/calendar-generator/generation-planner";
import { persistSmartCalendarItems } from "@/lib/calendar-generator/persistence";
import type { SmartCalendarSaveResult } from "@/lib/calendar-generator/persistence";

const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  if (!calendarDatePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day;
}

const calendarDateSchema = z.string().refine(isCalendarDate);
const previewRequestSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  semester: z.enum(["all", "first", "second"]),
  selectedPacks: z.array(z.enum(["holiday", "academic", "health"])).min(1).max(3),
});
const saveItemSchema = z.object({
  clientId: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(200),
  startDate: calendarDateSchema,
  endDate: calendarDateSchema,
  area: z.enum(["schoolSchedule", "healthWork"]),
  description: z.string().trim().min(1).max(300),
  selected: z.boolean(),
  duplicateDecision: z.enum(["unchecked", "skip", "force"]),
}).refine((item) => item.endDate >= item.startDate);
const saveItemsSchema = z.array(saveItemSchema).min(1).max(250);

export type SmartCalendarSaveActionResult =
  | { readonly status: "completed"; readonly result: SmartCalendarSaveResult }
  | { readonly status: "error"; readonly message: string };

export async function generateSmartCalendarPreviewAction(input: unknown) {
  const parsed = previewRequestSchema.safeParse(input);
  if (!parsed.success) throw new Error("생성 기준을 다시 확인해 주세요.");
  const store = await createSmartCalendarEventStore();
  return buildSmartCalendarPreview({
    ...parsed.data,
    existingEvents: await store.listExisting(),
  });
}

export async function saveSmartCalendarAction(input: unknown): Promise<SmartCalendarSaveActionResult> {
  const parsed = saveItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "생성할 일정 내용을 다시 확인해 주세요." };
  }
  const store = await createSmartCalendarEventStore();
  const result = await persistSmartCalendarItems({ items: parsed.data, store });
  if (result.summary.created > 0) {
    revalidatePath("/calendar");
    revalidatePath("/annual");
    revalidatePath("/briefing");
  }
  return { status: "completed", result };
}
