import { z } from "zod";

export const RESERVATION_TYPES = [
  { value: "flight", label: "항공", icon: "plane" },
  { value: "hotel", label: "숙박", icon: "hotel" },
  { value: "rental_car", label: "렌터카", icon: "car" },
  { value: "restaurant", label: "식당", icon: "utensils" },
  { value: "badminton", label: "배드민턴", icon: "activity" },
  { value: "transportation", label: "교통", icon: "bus" },
  { value: "ticket", label: "티켓", icon: "ticket" },
  { value: "custom", label: "기타", icon: "calendar-check" },
] as const;

export const reservationTypeSchema = z.enum([
  "flight",
  "hotel",
  "rental_car",
  "restaurant",
  "badminton",
  "transportation",
  "ticket",
  "custom",
]);

const optionalText = (maximum: number) => z.string().trim().max(maximum).nullable();
const optionalTime = z.union([z.iso.time({ precision: -1 }), z.null()]);

export const reservationInputSchema = z.object({
  projectId: z.uuid(),
  reservationId: z.uuid().optional(),
  type: reservationTypeSchema,
  title: z.string().trim().min(1, "예약 이름을 입력해 주세요.").max(160),
  reservationDate: z.iso.date(),
  startTime: optionalTime,
  endTime: optionalTime,
  company: optionalText(160),
  confirmationNumber: optionalText(120),
  location: optionalText(300),
  phone: optionalText(60),
  website: z.union([z.url("웹사이트 주소를 확인해 주세요.").max(500), z.null()]),
  memo: optionalText(2000),
  syncCalendar: z.boolean(),
}).superRefine(({ startTime, endTime }, context) => {
  if (endTime && !startTime) {
    context.addIssue({
      code: "custom",
      message: "종료 시간을 입력하려면 시작 시간도 입력해 주세요.",
      path: ["endTime"],
    });
  }
  if (startTime && endTime && endTime <= startTime) {
    context.addIssue({
      code: "custom",
      message: "종료 시간은 시작 시간보다 늦어야 합니다.",
      path: ["endTime"],
    });
  }
});

export const reservationDeleteSchema = z.object({
  projectId: z.uuid(),
  reservationId: z.uuid(),
  deleteLinkedEvent: z.boolean(),
});

export type ReservationInput = z.infer<typeof reservationInputSchema>;
export type ReservationType = z.infer<typeof reservationTypeSchema>;
export type ReservationDeleteInput = z.infer<typeof reservationDeleteSchema>;

export function reservationToEventValues(input: ReservationInput) {
  return {
    project_id: input.projectId,
    title: input.title,
    area: "project" as const,
    start_date: input.reservationDate,
    end_date: input.reservationDate,
    is_all_day: !input.startTime,
    start_time: input.startTime,
    end_time: input.endTime,
    location: input.location,
    color_key: "mint" as const,
    memo: input.memo,
    description: null,
  };
}

export function nullableFormValue(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

export function reservationInputFromFormData(formData: FormData): ReservationInput {
  return reservationInputSchema.parse({
    projectId: String(formData.get("projectId") ?? ""),
    reservationId: nullableFormValue(formData.get("reservationId")) ?? undefined,
    type: formData.get("type"),
    title: formData.get("title"),
    reservationDate: formData.get("reservationDate"),
    startTime: nullableFormValue(formData.get("startTime")),
    endTime: nullableFormValue(formData.get("endTime")),
    company: nullableFormValue(formData.get("company")),
    confirmationNumber: nullableFormValue(formData.get("confirmationNumber")),
    location: nullableFormValue(formData.get("location")),
    phone: nullableFormValue(formData.get("phone")),
    website: nullableFormValue(formData.get("website")),
    memo: nullableFormValue(formData.get("memo")),
    syncCalendar: formData.get("syncCalendar") === "on",
  });
}
