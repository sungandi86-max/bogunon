import { Suspense } from "react";

import { MealCard, MealCardSkeleton } from "@/components/briefing/meal-card";
import { QuickMemoCard } from "@/components/briefing/quick-memo-card";
import { SchoolInfoCard } from "@/components/briefing/school-info-card";
import { TodayScheduleCard } from "@/components/briefing/today-schedule-card";
import { WeatherCard } from "@/components/briefing/weather-card";
import type { NeisDefaultSchool } from "@/lib/neis/types";
import type { EventRow, TaskRow } from "@/types/database";

export function OperationsRail({ eventsToday, quickNotes, school, today }: { readonly eventsToday: readonly EventRow[]; readonly quickNotes: readonly TaskRow[]; readonly school: NeisDefaultSchool | null; readonly today: string }) {
  return <aside className="operations-rail" aria-label="오늘의 학교 생활 정보">
    <TodayScheduleCard events={eventsToday} today={today} />
    <Suspense fallback={<MealCardSkeleton />}><MealCard date={today} school={school} /></Suspense>
    <WeatherCard school={school} />
    <QuickMemoCard notes={quickNotes} today={today} />
    <SchoolInfoCard school={school} />
  </aside>;
}
