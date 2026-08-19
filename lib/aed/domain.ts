import { z } from "zod";

export const AED_STATUS = {
  expired: "expired",
  inspectionNeeded: "inspectionNeeded",
  replacementSoon: "replacementSoon",
  inspectionSoon: "inspectionSoon",
  normal: "normal",
} as const;

export type AedStatus = (typeof AED_STATUS)[keyof typeof AED_STATUS];

export const aedDeviceInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "AED 이름을 입력해 주세요.").max(120),
  location: z.string().trim().min(1, "설치 위치를 입력해 주세요.").max(200),
  batteryExpiryDate: z.string().date().nullable(),
  padExpiryDate: z.string().date().nullable(),
  lastInspectionDate: z.string().date().nullable(),
  nextInspectionDate: z.string().date().nullable(),
  inspectionIntervalMonths: z.number().int().min(0).max(120),
  note: z.string().trim().max(2000).nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export type AedDeviceInput = z.infer<typeof aedDeviceInputSchema>;

const replacementThresholdDays = 60;

function daysUntil(today: string, date: string | null): number | null {
  if (!date) return null;
  const todayUtc = Date.parse(`${today}T00:00:00Z`);
  const targetUtc = Date.parse(`${date}T00:00:00Z`);
  return Math.round((targetUtc - todayUtc) / 86_400_000);
}

export function getAedStatus(device: Pick<AedDeviceInput, "batteryExpiryDate" | "padExpiryDate" | "nextInspectionDate">, today: string): AedStatus {
  const batteryDays = daysUntil(today, device.batteryExpiryDate);
  const padDays = daysUntil(today, device.padExpiryDate);
  const inspectionDays = daysUntil(today, device.nextInspectionDate);
  if ((batteryDays !== null && batteryDays < 0) || (padDays !== null && padDays < 0)) return AED_STATUS.expired;
  if (inspectionDays !== null && inspectionDays <= 0) return AED_STATUS.inspectionNeeded;
  if ((batteryDays !== null && batteryDays <= replacementThresholdDays) || (padDays !== null && padDays <= replacementThresholdDays)) return AED_STATUS.replacementSoon;
  if (inspectionDays !== null && inspectionDays <= replacementThresholdDays) return AED_STATUS.inspectionSoon;
  return AED_STATUS.normal;
}

export const aedStatusLabels: Record<AedStatus, string> = {
  expired: "만료",
  inspectionNeeded: "점검 필요",
  replacementSoon: "교체 준비",
  inspectionSoon: "점검 예정",
  normal: "정상",
};

export const aedStatusPriority: readonly AedStatus[] = ["expired", "inspectionNeeded", "replacementSoon", "inspectionSoon", "normal"];

export function nextInspectionDateFrom(lastInspectionDate: string, inspectionIntervalMonths: number): string | null {
  if (inspectionIntervalMonths <= 0) return null;
  const [yearText, monthText, dayText] = lastInspectionDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1 + inspectionIntervalMonths, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}
