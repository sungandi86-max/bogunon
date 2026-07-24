import type { Area, EventRow } from "@/types/database";

export const EVENT_TYPES = ["personal", "work", "school", "workout", "tournament"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const TOURNAMENT_APPLICATION_STATUSES = ["planned", "applied", "waiting", "cancelled"] as const;
export type TournamentApplicationStatus = (typeof TOURNAMENT_APPLICATION_STATUSES)[number];

export type WorkoutScheduleDetail = {
  readonly kind: "workout";
  readonly workoutType: string;
};

export type TournamentDetail = {
  readonly kind: "tournament";
  readonly tournamentName: string;
  readonly discipline: string;
  readonly partner: string;
  readonly level: string;
  readonly applicationStatus: TournamentApplicationStatus;
};

export type EventDetails = WorkoutScheduleDetail | TournamentDetail;
export type EventArea = Exclude<Area, "project">;

export const EVENT_TYPE_OPTIONS = [
  { value: "personal", label: "개인" },
  { value: "work", label: "업무" },
  { value: "school", label: "학교" },
  { value: "workout", label: "운동" },
  { value: "tournament", label: "대회" },
] as const satisfies readonly { readonly value: EventType; readonly label: string }[];

export const EVENT_TYPE_LABELS = {
  personal: "개인",
  work: "업무",
  school: "학교",
  workout: "운동",
  tournament: "대회",
} as const satisfies Readonly<Record<EventType, string>>;

export const TOURNAMENT_APPLICATION_OPTIONS = [
  { value: "planned", label: "참가 예정" },
  { value: "applied", label: "신청 완료" },
  { value: "waiting", label: "대기" },
  { value: "cancelled", label: "취소" },
] as const satisfies readonly { readonly value: TournamentApplicationStatus; readonly label: string }[];

export const TOURNAMENT_APPLICATION_LABELS = {
  planned: "참가 예정",
  applied: "신청 완료",
  waiting: "대기",
  cancelled: "취소",
} as const satisfies Readonly<Record<TournamentApplicationStatus, string>>;

const areaByType = {
  personal: "personal",
  work: "healthWork",
  school: "schoolSchedule",
  workout: "exercise",
  tournament: "exercise",
} as const satisfies Readonly<Record<EventType, EventArea>>;

const colorByType = {
  personal: "lavender",
  work: "blue",
  school: "blue",
  workout: "mint",
  tournament: "coral",
} as const satisfies Readonly<Record<EventType, NonNullable<EventRow["color_key"]>>>;

export function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && EVENT_TYPES.some((type) => type === value);
}

export function eventAreaForType(type: EventType): EventArea {
  return areaByType[type];
}

export function eventColorForType(type: EventType): NonNullable<EventRow["color_key"]> {
  return colorByType[type];
}

export function resolveEventType(event: { readonly area: Area; readonly event_type?: EventType }): EventType {
  if (isEventType(event.event_type)) return event.event_type;
  if (event.area === "schoolSchedule") return "school";
  if (event.area === "exercise") return "workout";
  if (event.area === "personal") return "personal";
  return "work";
}

function detailText(value: unknown, label: string, maxLength: number): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > maxLength) throw new Error(`${label}은 ${maxLength}자 이내로 입력해 주세요.`);
  return text;
}

export function parseEventDetails(type: EventType, values: Readonly<Record<string, unknown>>): EventDetails | null {
  if (type === "workout") {
    return { kind: "workout", workoutType: detailText(values["workoutType"], "운동 종류", 80) };
  }
  if (type === "tournament") {
    const applicationStatus = TOURNAMENT_APPLICATION_STATUSES.find((status) => status === values["applicationStatus"]);
    if (!applicationStatus) throw new Error("대회 신청 상태를 확인해 주세요.");
    return {
      kind: "tournament",
      tournamentName: detailText(values["tournamentName"], "대회명", 120),
      discipline: detailText(values["discipline"], "참가 종목", 80),
      partner: detailText(values["partner"], "파트너", 80),
      level: detailText(values["level"], "급수", 40),
      applicationStatus,
    };
  }
  return null;
}

export function eventDetailsForType(event: Pick<EventRow, "event_details">, type: EventType): EventDetails | null {
  const details = event.event_details;
  if (!details || typeof details !== "object") return null;
  if (type === "workout" && details.kind === "workout") return details;
  if (type === "tournament" && details.kind === "tournament") return details;
  return null;
}
