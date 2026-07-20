import type { AcademicImportItem } from "@/lib/academic-calendar-import/types";
import type { EventRow } from "@/types/database";

export function normalizeAcademicTitle(value: string): string {
  return value.trim().toLocaleLowerCase("ko-KR").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

export function markAcademicDuplicates(items: readonly AcademicImportItem[], events: readonly EventRow[]): readonly AcademicImportItem[] {
  const existing = new Set(events
    .filter((event) => event.area === "schoolSchedule")
    .map((event) => `${event.start_date}|${event.end_date}|${normalizeAcademicTitle(event.title)}`));
  return items.map((item) => {
    if (item.status !== "ready") return item;
    const key = `${item.startDate}|${item.endDate}|${normalizeAcademicTitle(item.title)}`;
    if (existing.has(key)) return { ...item, status: "duplicate", selected: false };
    existing.add(key);
    return item;
  });
}
