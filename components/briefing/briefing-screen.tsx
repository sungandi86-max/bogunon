import { BriefingHeader } from "@/components/briefing/briefing-header";
import { MobileDailySchedule } from "@/components/briefing/mobile-daily-schedule";
import { OperationsRail } from "@/components/briefing/operations-rail";
import { TodayExerciseSection } from "@/components/briefing/today-exercise-section";
import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { MobileWeekStrip } from "@/components/calendar/mobile-week-strip";
import { SchoolCalendarSticker } from "@/components/calendar/school-calendar-sticker";
import { nextScheduledEvent, sortTodayEvents } from "@/lib/briefing/mobile-home";
import { isQuickNote } from "@/lib/briefing/quick-notes";
import { calendarStickerCategory } from "@/lib/calendar-stickers/catalog";
import type { NeisDefaultSchool } from "@/lib/neis/types";
import type { CalendarStickerRow, EventRow, ExerciseLogRow, ExerciseStickerRow, TaskRow } from "@/types/database";

export function BriefingScreen({ calendarStickers = [], events, exerciseLogs = [], exerciseStickers = [], month, nowIso, school = null, tasks, today }: { readonly calendarStickers?: CalendarStickerRow[]; readonly events: EventRow[]; readonly exerciseLogs?: ExerciseLogRow[]; readonly exerciseStickers?: ExerciseStickerRow[]; readonly month: string; readonly nowIso?: string; readonly school?: NeisDefaultSchool | null; readonly tasks: TaskRow[]; readonly today: string }) {
  const activeTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "onHold");
  const eventsToday = events.filter((event) => event.start_date <= today && event.end_date >= today);
  const priorityTasks = activeTasks.filter((task) => task.priority === "high" && (task.scheduled_date === today || task.due_date === today));
  const quickNotes = tasks.filter(isQuickNote);
  const currentTime = new Date(nowIso ?? `${today}T00:00:00+09:00`);
  const sortedEventsToday = sortTodayEvents(eventsToday, currentTime);
  const nextEvent = nextScheduledEvent(events, currentTime)?.event;
  const todayStickers = calendarStickers.filter((item) => item.sticker_date <= today && (item.end_date ?? item.sticker_date) >= today && calendarStickerCategory(item.sticker_key) === "school");

  return (
    <main className="page-canvas briefing-page">
      <div className="operations-dashboard">
        <div className="operations-main">
          <BriefingHeader eventCount={sortedEventsToday.length} nextEvent={nextEvent} priorityCount={priorityTasks.length} today={today} />
          {todayStickers.length > 0 && <div className="today-school-stickers" aria-label="오늘의 학교 날짜">{todayStickers.map((item) => <SchoolCalendarSticker key={item.id} stickerKey={item.sticker_key} />)}</div>}
          <MobileDailySchedule today={today} upcomingEvents={events} />
          <MobileWeekStrip events={events} today={today} />
          <TodayExerciseSection logs={exerciseLogs} stickers={exerciseStickers} today={today} />
          <section className="month-overview" aria-labelledby="month-overview-title">
            <div className="section-heading month-overview__heading"><div><p>월간 통합 캘린더</p><h2 id="month-overview-title">{month.replace("-", "년 ")}월</h2></div></div>
            <FullMonthCalendar events={events} month={month} schoolStickers={calendarStickers} />
          </section>
        </div>
        <OperationsRail eventsToday={sortedEventsToday} quickNotes={quickNotes} school={school} today={today} />
      </div>
    </main>
  );
}
