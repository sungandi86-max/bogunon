import type { AcademicEventInsert } from "@/lib/academic-calendar-import/repository";

export function createAcademicEvent(
  title: string,
  startDate: string,
  endDate: string,
  description: string | null = null,
): AcademicEventInsert {
  return {
    title,
    area: "schoolSchedule",
    start_date: startDate,
    end_date: endDate,
    is_all_day: true,
    start_time: null,
    end_time: null,
    location: null,
    color_key: "yellow",
    recurrence_frequency: null,
    recurrence_source_id: null,
    recurrence_date: null,
    recurrence_generated_through: null,
    memo: null,
    description,
  };
}
