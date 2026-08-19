import { Suspense } from "react";

import { MealCard, MealCardSkeleton } from "@/components/briefing/meal-card";
import { AedSummaryCard } from "@/components/briefing/aed-summary-card";
import { QuickMemoCard } from "@/components/briefing/quick-memo-card";
import { SchoolInfoCard } from "@/components/briefing/school-info-card";
import { TodayScheduleCard } from "@/components/briefing/today-schedule-card";
import type { AedDevice } from "@/lib/aed/repository";
import type { UserSchoolSettings } from "@/lib/neis/types";
import type { EventRow, TaskRow } from "@/types/database";

export function OperationsRail({ aedDevices, eventsToday, quickNotes, school, today }: { readonly aedDevices: readonly AedDevice[]; readonly eventsToday: readonly EventRow[]; readonly quickNotes: readonly TaskRow[]; readonly school: UserSchoolSettings | null; readonly today: string }) {
  return <aside className="operations-rail" aria-label="오늘의 학교 생활 정보">
    <TodayScheduleCard events={eventsToday} today={today} />
    <Suspense fallback={<MealCardSkeleton />}><MealCard date={today} school={school} /></Suspense>
    <AedSummaryCard devices={aedDevices} today={today} />
    <QuickMemoCard notes={quickNotes} today={today} />
    <SchoolInfoCard school={school} />
  </aside>;
}
