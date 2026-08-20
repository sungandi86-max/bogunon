import type { PracticalScheduleCategory } from "@/types/database";

export const practicalScheduleCategoryLabels: Record<PracticalScheduleCategory, string> = {
  staff: "교직원",
  student: "학생",
  admin: "행정",
};

export function isSafePracticalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function formatPracticalScheduleDate(value: string | null): string {
  return value ? value.replaceAll("-", ".") : "날짜 미정";
}

export function practicalScheduleCalendarDescription(method: string | null, notes: string | null): string | null {
  const description = [method, notes].filter((item): item is string => Boolean(item)).join("\n");
  return description || null;
}
