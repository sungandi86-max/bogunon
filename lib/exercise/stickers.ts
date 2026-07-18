import type { ExerciseLogRow, ExerciseStickerIconKey } from "@/types/database";

export interface DefaultExerciseSticker {
  readonly iconKey: ExerciseStickerIconKey;
  readonly label: string;
  readonly colorKey: "mint" | "pink" | "yellow" | "coral" | "blue" | "lavender" | "sky" | "aqua" | "cream";
}

export const DEFAULT_EXERCISE_STICKERS: readonly DefaultExerciseSticker[] = [
  { iconKey: "badminton", label: "배드민턴", colorKey: "mint" },
  { iconKey: "badminton_lesson", label: "배드민턴 레슨", colorKey: "pink" },
  { iconKey: "walking", label: "걷기", colorKey: "yellow" },
  { iconKey: "running", label: "러닝", colorKey: "coral" },
  { iconKey: "strength", label: "근력운동", colorKey: "blue" },
  { iconKey: "stretching", label: "스트레칭", colorKey: "lavender" },
  { iconKey: "cycling", label: "자전거", colorKey: "sky" },
  { iconKey: "swimming", label: "수영", colorKey: "aqua" },
  { iconKey: "other", label: "기타", colorKey: "cream" },
] as const;

const assetNames: Readonly<Record<ExerciseStickerIconKey, string>> = {
  badminton: "badminton",
  badminton_lesson: "badminton-lesson",
  walking: "walking",
  running: "running",
  strength: "strength",
  stretching: "stretching",
  cycling: "cycling",
  swimming: "swimming",
  other: "other",
};

export function exerciseAssetPath(iconKey: ExerciseStickerIconKey): string {
  return `/stickers/exercise/${assetNames[iconKey]}.svg`;
}

export function exerciseCalendarSummary(logs: readonly ExerciseLogRow[], date: string) {
  const matches = logs.filter((log) => log.exercise_date === date);
  return { visible: matches.slice(0, 2), remaining: Math.max(0, matches.length - 2) } as const;
}

function previousDate(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

export function exerciseStreak(logs: readonly ExerciseLogRow[], referenceDate: string): number {
  const dates = new Set(logs.map((log) => log.exercise_date));
  let cursor = referenceDate;
  let count = 0;
  while (dates.has(cursor)) {
    count += 1;
    cursor = previousDate(cursor);
  }
  return count;
}
