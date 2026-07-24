"use client";

import {
  Activity,
  Bike,
  Dumbbell,
  Ellipsis,
  Footprints,
  Mountain,
  PersonStanding,
  Trophy,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import {
  CALENDAR_WORKOUT_STICKERS,
  tournamentEventTemplate,
  workoutEventTemplate,
} from "@/lib/calendar-stickers/event-catalog";
import type {
  CalendarEventStickerPack,
  CalendarWorkoutIconKey,
} from "@/lib/calendar-stickers/event-catalog";

const workoutIcons = {
  activity: Activity,
  stretch: PersonStanding,
  strength: Dumbbell,
  running: Footprints,
  walking: Footprints,
  cycling: Bike,
  swimming: Waves,
  hiking: Mountain,
  other: Ellipsis,
} as const satisfies Readonly<Record<CalendarWorkoutIconKey, LucideIcon>>;

interface CalendarEventStickerPickerProps {
  readonly date: string;
  readonly pack: CalendarEventStickerPack;
}

export function CalendarEventStickerPicker({
  date,
  pack,
}: CalendarEventStickerPickerProps) {
  const { openCreate } = useAppShellCreate();

  if (pack === "tournament") {
    return (
      <div
        aria-labelledby="calendar-sticker-tournament-tab"
        className="calendar-event-sticker-panel"
        id="calendar-sticker-panel"
        role="tabpanel"
      >
        <button
          aria-label="대회 일정 만들기"
          className="calendar-tournament-create"
          onClick={(event) => openCreate(
            event.currentTarget,
            "event",
            tournamentEventTemplate(date),
          )}
          type="button"
        >
          <Trophy aria-hidden="true" size={24} />
          <span>
            <strong>대회 일정 만들기</strong>
            <small>대회 정보와 날짜·시간을 입력합니다.</small>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      aria-labelledby="calendar-sticker-workout-tab"
      className="calendar-event-sticker-panel"
      id="calendar-sticker-panel"
      role="tabpanel"
    >
      <p>운동 종류를 선택하면 일정명과 분류가 자동으로 채워집니다.</p>
      <div className="calendar-workout-sticker-grid">
        {CALENDAR_WORKOUT_STICKERS.map((sticker) => {
          const Icon = workoutIcons[sticker.iconKey];
          return (
            <button
              aria-label={`${sticker.label} 운동 일정 만들기`}
              key={sticker.key}
              onClick={(event) => openCreate(
                event.currentTarget,
                "event",
                workoutEventTemplate(sticker, date),
              )}
              type="button"
            >
              <Icon aria-hidden="true" size={21} />
              <span>{sticker.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
