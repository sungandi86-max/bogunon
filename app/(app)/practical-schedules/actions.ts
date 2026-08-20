"use server";

import { revalidatePath } from "next/cache";
import { linkExistingEvent, removePracticalSchedule, savePracticalSchedule } from "@/lib/practical-schedules/repository";
import { isSafePracticalUrl, parsePracticalStickerKey } from "@/lib/practical-schedules/domain";
import type { PracticalScheduleCategory } from "@/types/database";

const categories = new Set<PracticalScheduleCategory>(["staff", "student", "admin"]);

function optional(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function validDate(value: string | null): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

function refresh() {
  revalidatePath("/practical-schedules");
  revalidatePath("/annual");
  revalidatePath("/calendar");
  revalidatePath("/briefing");
}

export async function savePracticalScheduleAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const year = Number(formData.get("year"));
  const category = String(formData.get("category") ?? "staff") as PracticalScheduleCategory;
  const scheduledDate = optional(formData, "scheduledDate");
  const startTime = optional(formData, "startTime");
  const endTime = optional(formData, "endTime");
  if (!title || !Number.isInteger(year) || year < 2000 || year > 2100 || !categories.has(category)) throw new Error("구분, 연도, 업무명을 확인해 주세요.");
  if (!validDate(scheduledDate)) throw new Error("날짜 형식을 확인해 주세요.");
  if ((startTime || endTime) && (!startTime || !endTime || endTime <= startTime)) throw new Error("시간을 확인해 주세요.");
  const url = optional(formData, "url");
  if (url && !isSafePracticalUrl(url)) throw new Error("관련 링크는 http 또는 https 주소만 사용할 수 있습니다.");
  const stickerValue = optional(formData, "stickerKey");
  const stickerKey = parsePracticalStickerKey(stickerValue);
  if (stickerValue && !stickerKey) throw new Error("일정 스티커를 확인해 주세요.");
  await savePracticalSchedule({
    year, category, title, scheduledDate, startTime, endTime, location: optional(formData, "location"),
    method: optional(formData, "method"), notes: optional(formData, "notes"), url, annualPresetKey: optional(formData, "annualPresetKey"), stickerKey,
  }, optional(formData, "id") ?? undefined);
  refresh();
}

export async function linkExistingEventAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const year = Number(formData.get("year"));
  const category = String(formData.get("category") ?? "staff") as PracticalScheduleCategory;
  if (!eventId || !Number.isInteger(year) || year < 2000 || year > 2100 || !categories.has(category)) throw new Error("연결할 일정과 구분을 확인해 주세요.");
  const url = optional(formData, "url");
  if (url && !isSafePracticalUrl(url)) throw new Error("관련 링크는 http 또는 https 주소만 사용할 수 있습니다.");
  await linkExistingEvent(eventId, {
    year, category, method: optional(formData, "method"), notes: optional(formData, "notes"), url,
    annualPresetKey: optional(formData, "annualPresetKey"),
  });
  refresh();
}

export async function deletePracticalScheduleAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await removePracticalSchedule(id);
  refresh();
}
