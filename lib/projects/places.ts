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

export type ProjectMapDay = {
  readonly date: string;
  readonly dayNumber: number;
};

export type ProjectMapViewport = {
  readonly center: readonly [number, number];
  readonly zoom: number;
};

export type ProjectPlaceCandidate = {
  readonly category: ProjectPlaceCategory;
  readonly date: string;
  readonly id: string;
  readonly location: string;
  readonly source: "event" | "reservation";
  readonly sourceLabel: string;
  readonly time: string | null;
  readonly title: string;
};

export type ProjectPlaceDayGroup<T> = {
  readonly date: string | null;
  readonly places: readonly T[];
};

type CandidateEvent = {
  readonly event_type?: string;
  readonly id: string;
  readonly location?: string | null;
  readonly start_date: string;
  readonly start_time: string | null;
  readonly title: string;
};

type CandidateReservation = {
  readonly id: string;
  readonly location: string | null;
  readonly reservation_date: string;
  readonly start_time: string | null;
  readonly title: string;
  readonly type: string;
};

type LinkedPlace = {
  readonly event_id: string | null;
  readonly reservation_id: string | null;
};

const DAY_IN_MS = 86_400_000;
const MAX_GENERATED_PROJECT_DAYS = 31;
const DEFAULT_MAP_VIEWPORT: ProjectMapViewport = { center: [36.4, 127.8], zoom: 6 };

const REGION_VIEWPORTS = [
  { keywords: ["제주", "jeju"], viewport: { center: [33.38, 126.55], zoom: 10 } },
  { keywords: ["서울", "seoul"], viewport: { center: [37.5665, 126.978], zoom: 11 } },
  { keywords: ["부산", "busan"], viewport: { center: [35.1796, 129.0756], zoom: 11 } },
  { keywords: ["강릉"], viewport: { center: [37.7519, 128.8761], zoom: 11 } },
  { keywords: ["경주"], viewport: { center: [35.8562, 129.2247], zoom: 11 } },
  { keywords: ["전주"], viewport: { center: [35.8242, 127.148], zoom: 11 } },
] as const satisfies readonly { readonly keywords: readonly string[]; readonly viewport: ProjectMapViewport }[];

function dateValue(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function dateDifference(start: string, end: string): number {
  return Math.floor((dateValue(end) - dateValue(start)) / DAY_IN_MS);
}

function dateRange(start: string, end: string): string[] {
  const length = dateDifference(start, end) + 1;
  if (length < 1 || length > MAX_GENERATED_PROJECT_DAYS) return [];
  return Array.from({ length }, (_, index) => new Date(dateValue(start) + (index * DAY_IN_MS)).toISOString().slice(0, 10));
}

export function buildProjectMapDays(input: {
  readonly placeDates: readonly string[];
  readonly projectEndDate: string | null;
  readonly projectStartDate: string | null;
  readonly relatedDates: readonly string[];
}): ProjectMapDay[] {
  const periodDates = input.projectStartDate && input.projectEndDate
    ? dateRange(input.projectStartDate, input.projectEndDate)
    : input.projectStartDate ? [input.projectStartDate] : [];
  const dates = [...new Set([
    ...periodDates,
    ...input.placeDates,
    ...input.relatedDates,
  ].filter(Boolean))].sort();
  const firstDate = input.projectStartDate ?? dates[0];
  return dates.map((date, index) => ({
    date,
    dayNumber: firstDate ? dateDifference(firstDate, date) + 1 : index + 1,
  }));
}

export function inferProjectMapViewport(input: {
  readonly locations: readonly string[];
  readonly projectName: string;
}): ProjectMapViewport {
  const searchable = [input.projectName, ...input.locations].join(" ").toLocaleLowerCase("ko-KR");
  return REGION_VIEWPORTS.find((region) => region.keywords.some((keyword) => searchable.includes(keyword)))?.viewport
    ?? DEFAULT_MAP_VIEWPORT;
}

function eventCategory(eventType?: string): ProjectPlaceCategory {
  return eventType === "workout" || eventType === "tournament" ? "sports" : "other";
}

function reservationCategory(type: string): ProjectPlaceCategory {
  if (type === "flight") return "airport";
  if (type === "hotel") return "accommodation";
  if (type === "restaurant") return "restaurant";
  if (type === "badminton") return "sports";
  if (type === "rental_car" || type === "transportation") return "transportation";
  return type === "ticket" ? "activity" : "other";
}

export function findProjectPlaceCandidates(input: {
  readonly events: readonly CandidateEvent[];
  readonly places: readonly LinkedPlace[];
  readonly reservations: readonly CandidateReservation[];
}): ProjectPlaceCandidate[] {
  const linkedEvents = new Set(input.places.flatMap((place) => place.event_id ? [place.event_id] : []));
  const linkedReservations = new Set(input.places.flatMap((place) => place.reservation_id ? [place.reservation_id] : []));
  const eventCandidates = input.events.flatMap((event): ProjectPlaceCandidate[] => {
    const location = event.location?.trim();
    if (!location || linkedEvents.has(event.id)) return [];
    return [{
      category: eventCategory(event.event_type),
      date: event.start_date,
      id: event.id,
      location,
      source: "event",
      sourceLabel: "일정",
      time: event.start_time,
      title: event.title,
    }];
  });
  const reservationCandidates = input.reservations.flatMap((reservation): ProjectPlaceCandidate[] => {
    const location = reservation.location?.trim();
    if (!location || linkedReservations.has(reservation.id)) return [];
    return [{
      category: reservationCategory(reservation.type),
      date: reservation.reservation_date,
      id: reservation.id,
      location,
      source: "reservation",
      sourceLabel: "예약",
      time: reservation.start_time,
      title: reservation.title,
    }];
  });
  return [...eventCandidates, ...reservationCandidates].sort((left, right) => left.date.localeCompare(right.date)
    || (left.time ?? "99:99").localeCompare(right.time ?? "99:99"));
}

export function groupProjectPlacesByDay<T extends {
  readonly created_at: string;
  readonly sort_order: number;
  readonly visited_date: string | null;
  readonly visited_time: string | null;
}>(places: readonly T[]): ProjectPlaceDayGroup<T>[] {
  const dates = [...new Set(places.map((place) => place.visited_date))].sort((left, right) => {
    if (left === null) return 1;
    if (right === null) return -1;
    return left.localeCompare(right);
  });
  return dates.map((date) => ({
    date,
    places: sortProjectPlaces(places.filter((place) => place.visited_date === date)),
  }));
}

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
