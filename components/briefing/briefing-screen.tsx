import { BriefingHeader } from "@/components/briefing/briefing-header";
import { BriefingMonthOverview } from "@/components/briefing/briefing-month-overview";
import { MobileDailySchedule } from "@/components/briefing/mobile-daily-schedule";
import { OperationsRail } from "@/components/briefing/operations-rail";
import { TodayExerciseSection } from "@/components/briefing/today-exercise-section";
import { MobileWeekStrip } from "@/components/calendar/mobile-week-strip";
import { SchoolCalendarSticker } from "@/components/calendar/school-calendar-sticker";
import { sortTodayEvents } from "@/lib/briefing/mobile-home";
import type { QuickLink } from "@/lib/quick-links/repository";
import { calendarStickerCategory } from "@/lib/calendar-stickers/catalog";
import type { UserSchoolSettings } from "@/lib/neis/types";
import type { AedDevice } from "@/lib/aed/repository";
import type { CalendarStickerRow, EventRow, ExerciseLogRow, ExerciseStickerRow, TaskRow } from "@/types/database";

export function BriefingScreen({ aedDevices = [], calendarStickers = [], events = [], exerciseLogs = [], exerciseStickers = [], month, nowIso, quickLinks = [], school = null, tasks: _tasks = [], today }: { readonly aedDevices?: readonly AedDevice[]; readonly calendarStickers?: CalendarStickerRow[]; readonly events?: EventRow[]; readonly exerciseLogs?: readonly ExerciseLogRow[]; readonly exerciseStickers?: readonly ExerciseStickerRow[]; readonly month: string; readonly nowIso?: string; readonly quickLinks?: readonly QuickLink[]; readonly school?: UserSchoolSettings | null; readonly tasks?: readonly TaskRow[]; readonly today: string }) {
  void _tasks;
  const eventsToday = events.filter((event) => event.start_date <= today && event.end_date >= today);
  const currentTime = new Date(nowIso ?? `${today}T00:00:00+09:00`);
  const sortedEventsToday = sortTodayEvents(eventsToday, currentTime);
  const todayStickers = calendarStickers.filter((item) => item.sticker_date <= today && (item.end_date ?? item.sticker_date) >= today && calendarStickerCategory(item.sticker_key) === "school");

  return (
    <main className="page-canvas briefing-page">
      <div className="operations-dashboard">
        <div className="operations-main">
          <BriefingHeader today={today} />
          {todayStickers.length > 0 && <div className="today-school-stickers" aria-label="오늘의 학교 날짜">{todayStickers.map((item) => <SchoolCalendarSticker key={item.id} stickerKey={item.sticker_key} />)}</div>}
          <MobileDailySchedule today={today} upcomingEvents={events} />
          <TodayExerciseSection events={events} logs={exerciseLogs} stickers={exerciseStickers} today={today} />
          <MobileWeekStrip events={events} today={today} />
          <BriefingMonthOverview events={events} month={month} stickers={calendarStickers} today={today} />
        </div>
        <OperationsRail aedDevices={aedDevices} eventsToday={sortedEventsToday} quickLinks={quickLinks} school={school} today={today} />
      </div>
    </main>
  );
}
