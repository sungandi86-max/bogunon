import type { Area } from "@/types/database";

export const EVENT_COLOR_KEYS = ["mint", "blue", "yellow", "coral", "lavender", "pink"] as const;
export type EventColorKey = (typeof EVENT_COLOR_KEYS)[number];

export type PersonalEventPreset = {
  readonly key: string;
  readonly title: string;
  readonly colorKey: EventColorKey;
  readonly area: Extract<Area, "personal">;
};

export const PERSONAL_EVENT_PRESETS = [
  { key: "hospital", title: "병원", colorKey: "lavender", area: "personal" },
  { key: "appointment", title: "약속", colorKey: "pink", area: "personal" },
  { key: "travel", title: "여행", colorKey: "yellow", area: "personal" },
  { key: "salon", title: "미용실", colorKey: "coral", area: "personal" },
  { key: "family", title: "가족 일정", colorKey: "mint", area: "personal" },
  { key: "exercise-meetup", title: "운동 약속", colorKey: "blue", area: "personal" },
  { key: "other", title: "기타", colorKey: "lavender", area: "personal" },
] as const satisfies readonly PersonalEventPreset[];
