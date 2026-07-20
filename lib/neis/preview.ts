import type {
  NeisPreviewFilters,
  NeisPreviewItem,
  NeisScheduleCategory,
} from "@/lib/neis/types";

const examPattern = /(중간|기말|모의)?\s*(고사|평가|시험)|전국연합/;
const vacationPattern = /(여름|겨울|봄)?\s*방학|방학식|개학/;
const holidayPattern = /공휴일|대체공휴일|신정|설날|삼일절|3[·.]?1절|어린이날|부처님오신날|석가탄신일|현충일|제헌절|광복절|개천절|한글날|추석|성탄절|크리스마스|근로자의\s*날|토요휴업일/;

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase("ko-KR").replace(/[-/.]/g, "").replace(/\s+/g, "");
}

export function classifyNeisSchedule(title: string): NeisScheduleCategory {
  if (holidayPattern.test(title)) return "holiday";
  if (vacationPattern.test(title)) return "vacation";
  if (examPattern.test(title)) return "exam";
  return "schoolEvent";
}

export function formatGradeBadge(grades: readonly string[]): string {
  if (grades.includes("전 학년")) return "전 학년";
  const numbers = grades.flatMap((grade) => grade.match(/^([1-6])학년$/)?.[1] ?? []);
  return numbers.length > 0 ? `${numbers.join("·")}학년` : "학년 정보 없음";
}

export function filterNeisPreviewItems(
  items: readonly NeisPreviewItem[],
  filters: NeisPreviewFilters,
): readonly NeisPreviewItem[] {
  const query = normalizeSearchText(filters.query.trim());

  return items.filter((item) => {
    const category = classifyNeisSchedule(item.title);
    if (!filters.includeSaturdayClosures && item.title.includes("토요휴업일")) return false;
    if (!filters.includeHolidays && category === "holiday") return false;
    if (!filters.includeVacations && category === "vacation") return false;
    if (filters.category !== "all" && category !== filters.category) return false;
    if (!query) return true;

    const searchable = [
      item.title,
      item.content,
      formatGradeBadge(item.grades),
      item.grades.join(" "),
      item.date,
      item.date.replaceAll("-", "."),
    ].join(" ");
    return normalizeSearchText(searchable).includes(query);
  });
}
