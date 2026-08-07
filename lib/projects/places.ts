import { z } from "zod";

export const PLACE_CATEGORIES = [
  "airport", "accommodation", "restaurant", "cafe", "activity",
  "shopping", "transportation", "sports", "sightseeing", "other",
] as const;

export type ProjectPlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const PLACE_CATEGORY_LABELS = {
  airport: "공항",
  accommodation: "숙소",
  restaurant: "식당",
  cafe: "카페",
  activity: "체험",
  shopping: "쇼핑",
  transportation: "교통",
  sports: "운동",
  sightseeing: "관광",
  other: "기타",
} as const satisfies Readonly<Record<ProjectPlaceCategory, string>>;

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const optionalId = z.string().uuid().or(z.literal("")).transform((value) => value || null);
const optionalDate = z.string().date().or(z.literal("")).transform((value) => value || null);
const optionalTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal("")).transform((value) => value || null);
const optionalCoordinate = z.union([z.literal(""), z.coerce.number()]).transform((value) => value === "" ? null : value);

export const projectPlaceInputSchema = z.object({
  placeId: optionalId,
  projectId: z.string().uuid(),
  eventId: optionalId,
  reservationId: optionalId,
  name: z.string().trim().min(1, "장소명을 입력해 주세요.").max(160),
  address: optionalText(500),
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  visitedDate: optionalDate,
  visitedTime: optionalTime,
  category: z.enum(PLACE_CATEGORIES),
  memo: optionalText(2000),
  isVisited: z.boolean(),
}).superRefine((value, context) => {
  if ((value.latitude === null) !== (value.longitude === null)) {
    context.addIssue({ code: "custom", message: "위도와 경도를 함께 입력해 주세요." });
  }
  if (value.latitude !== null && (value.latitude < -90 || value.latitude > 90)) {
    context.addIssue({ code: "custom", message: "위도 값을 확인해 주세요." });
  }
  if (value.longitude !== null && (value.longitude < -180 || value.longitude > 180)) {
    context.addIssue({ code: "custom", message: "경도 값을 확인해 주세요." });
  }
});

export type ProjectPlaceInput = z.infer<typeof projectPlaceInputSchema>;

export function projectPlaceInputFromFormData(formData: FormData): ProjectPlaceInput {
  return projectPlaceInputSchema.parse({
    placeId: String(formData.get("placeId") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    eventId: String(formData.get("eventId") ?? ""),
    reservationId: String(formData.get("reservationId") ?? ""),
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
    latitude: String(formData.get("latitude") ?? ""),
    longitude: String(formData.get("longitude") ?? ""),
    visitedDate: String(formData.get("visitedDate") ?? ""),
    visitedTime: String(formData.get("visitedTime") ?? ""),
    category: String(formData.get("category") ?? "other"),
    memo: String(formData.get("memo") ?? ""),
    isVisited: formData.get("isVisited") === "on",
  });
}

export function sortProjectPlaces<T extends { readonly sort_order: number; readonly visited_time: string | null; readonly created_at: string }>(places: readonly T[]): T[] {
  return [...places].sort((left, right) => left.sort_order - right.sort_order
    || (left.visited_time ?? "99:99").localeCompare(right.visited_time ?? "99:99")
    || left.created_at.localeCompare(right.created_at));
}
