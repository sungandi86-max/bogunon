import { z } from "zod";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;
  const [yearText, monthText, dayText] = value.split("-");
  if (!yearText || !monthText || !dayText) return false;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export const dateOnlySchema = z.string().regex(DATE_ONLY_PATTERN).refine(isRealDateOnly, "실제 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.");

export const calendarStickerRangeSchema = z.object({
  stickerDate: dateOnlySchema,
  endDate: dateOnlySchema.nullable(),
}).refine(({ stickerDate, endDate }) => endDate === null || endDate >= stickerDate, {
  message: "종료일은 시작일보다 빠를 수 없습니다.",
  path: ["endDate"],
});

export function rangesOverlap(
  stickerDate: string,
  endDate: string | null,
  first: string,
  last: string,
): boolean {
  const row = calendarStickerRangeSchema.parse({ stickerDate, endDate });
  const query = calendarStickerRangeSchema.parse({ stickerDate: first, endDate: last });
  return row.stickerDate <= (query.endDate ?? query.stickerDate)
    && (row.endDate ?? row.stickerDate) >= query.stickerDate;
}
