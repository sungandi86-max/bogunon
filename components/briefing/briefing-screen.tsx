import { BriefingHeader } from "@/components/briefing/briefing-header";
import { OperationsRail } from "@/components/briefing/operations-rail";
import { WeeklySummary } from "@/components/briefing/weekly-summary";
import { buildWorkflowBriefingItems } from "@/components/briefing/workflow-briefing";
import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { MobileWeekStrip } from "@/components/calendar/mobile-week-strip";
import { MobileDailySchedule } from "@/components/briefing/mobile-daily-schedule";
import { TodayExerciseSection } from "@/components/briefing/today-exercise-section";
import { nextScheduledEvent, sortTodayEvents } from "@/lib/briefing/mobile-home";
import type { EventRow, ExerciseLogRow, ExerciseStickerRow, TaskRow } from "@/types/database";
import type { HealthWorkflowData } from "@/types/workflows";

const emptyHealthWorkflows: HealthWorkflowData = { templates: [], templateSteps: [], templateChecklistItems: [], templateLinks: [], instances: [], steps: [], checklistItems: [], links: [], timeline: [], followups: [] };

export function BriefingScreen({ events, exerciseLogs = [], exerciseStickers = [], month, nowIso, tasks, today, workflow = emptyHealthWorkflows }: { readonly events: EventRow[]; readonly exerciseLogs?: ExerciseLogRow[]; readonly exerciseStickers?: ExerciseStickerRow[]; readonly month: string; readonly nowIso?: string; readonly tasks: TaskRow[]; readonly today: string; readonly workflow?: HealthWorkflowData }) {
  const activeTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "onHold");
  const dueToday = activeTasks.filter((task) => task.due_date === today);
  const todayTasks = activeTasks.filter((task) => task.scheduled_date === today || task.due_date === today);
  const eventsToday = events.filter((event) => event.start_date <= today && event.end_date >= today);
  const waitingTasks = activeTasks.filter((task) => task.status === "waitingForReply");
  const priorityTasks = activeTasks.filter((task) => task.priority === "high" && (task.scheduled_date === today || task.due_date === today));
  const sortedEventsToday = sortTodayEvents(eventsToday);
  const currentTime = new Date(nowIso ?? `${today}T00:00:00+09:00`);
  const nextEvent = nextScheduledEvent(events, currentTime)?.event;
  const workflowItems = buildWorkflowBriefingItems(workflow);
  return <main className="page-canvas briefing-page"><div className="operations-dashboard"><div className="operations-main"><BriefingHeader eventCount={sortedEventsToday.length} nextEvent={nextEvent} priorityCount={priorityTasks.length} today={today} /><MobileDailySchedule eventsToday={sortedEventsToday} nowIso={currentTime.toISOString()} tasks={todayTasks} today={today} upcomingEvents={events} /><MobileWeekStrip events={events} today={today} /><WeeklySummary eventsToday={sortedEventsToday.length} todayTasks={todayTasks.length} waiting={waitingTasks.length} workflows={workflowItems.length} /><TodayExerciseSection logs={exerciseLogs} stickers={exerciseStickers} today={today} /><section className="month-overview" aria-labelledby="month-overview-title"><div className="section-heading month-overview__heading"><div><p>월간 통합 캘린더</p><h2 id="month-overview-title">{month.replace("-", "년 ")}월</h2></div></div><FullMonthCalendar events={events} month={month} /></section></div><OperationsRail dueToday={dueToday.length} eventsToday={sortedEventsToday} priorityTasks={priorityTasks} todayTasks={todayTasks} waitingTasks={waitingTasks} workflowItems={workflowItems} /></div></main>;
}
