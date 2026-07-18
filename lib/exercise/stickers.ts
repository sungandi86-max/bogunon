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

export function exerciseAssetPath(iconKey: string): string {
  const assetName = assetNames[iconKey as ExerciseStickerIconKey];
  if (!assetName && process.env.NODE_ENV !== "production") console.warn(`[exercise] Unknown sticker asset key: ${iconKey}`);
  return `/stickers/exercise/${assetName ?? assetNames.other}.svg`;
}

export function exerciseDateKey(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > (daysByMonth[month - 1] ?? 0)) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function groupExerciseLogsByDate(logs: readonly ExerciseLogRow[]): Readonly<Record<string, readonly ExerciseLogRow[]>> {
  const groups: Record<string, ExerciseLogRow[]> = {};
  for (const log of logs) {
    const key = exerciseDateKey(log.exercise_date);
    if (!key) continue;
    groups[key] = [...(groups[key] ?? []), log];
  }
  return groups;
}

export function exerciseCalendarSummary(logsByDate: Readonly<Record<string, readonly ExerciseLogRow[]>>, date: string) {
  const matches = [...(logsByDate[date] ?? [])].sort((left, right) => right.created_at.localeCompare(left.created_at) || right.id.localeCompare(left.id));
  return { visible: matches.slice(0, 2), remaining: Math.max(0, matches.length - 2) } as const;
}

function previousDate(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

export function exerciseStreak(logs: readonly ExerciseLogRow[], referenceDate: string): number {
  const dates = new Set(Object.keys(groupExerciseLogsByDate(logs)));
  let cursor = referenceDate;
  let count = 0;
  while (dates.has(cursor)) {
    count += 1;
    cursor = previousDate(cursor);
  }
  return count;
}
