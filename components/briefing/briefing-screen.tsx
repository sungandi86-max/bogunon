import { BriefingHeader } from "@/components/briefing/briefing-header";
import { OperationsRail } from "@/components/briefing/operations-rail";
import { WeeklySummary } from "@/components/briefing/weekly-summary";
import { buildWorkflowBriefingItems } from "@/components/briefing/workflow-briefing";
import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { MobileWeekStrip } from "@/components/calendar/mobile-week-strip";
import type { EventRow, TaskRow } from "@/types/database";
import type { HealthWorkflowData } from "@/types/workflows";

const emptyHealthWorkflows: HealthWorkflowData = { templates: [], templateSteps: [], templateChecklistItems: [], templateLinks: [], instances: [], steps: [], checklistItems: [], links: [], timeline: [], followups: [] };

export function BriefingScreen({ events, month, tasks, today, workflow = emptyHealthWorkflows }: { readonly events: EventRow[]; readonly month: string; readonly tasks: TaskRow[]; readonly today: string; readonly workflow?: HealthWorkflowData }) {
  const activeTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "onHold");
  const dueToday = activeTasks.filter((task) => task.due_date === today);
  const todayTasks = activeTasks.filter((task) => task.scheduled_date === today || task.due_date === today);
  const eventsToday = events.filter((event) => event.start_date <= today && event.end_date >= today);
  const waitingTasks = activeTasks.filter((task) => task.status === "waitingForReply");
  const priorityTasks = activeTasks.filter((task) => task.priority === "high" && (task.scheduled_date === today || task.due_date === today));
  const sortedEventsToday = [...eventsToday].sort((a, b) => (a.start_time ?? "00:00").localeCompare(b.start_time ?? "00:00"));
  const nextEvent = sortedEventsToday[0];
  const workflowItems = buildWorkflowBriefingItems(workflow);
  return <main className="page-canvas briefing-page"><div className="operations-dashboard"><div className="operations-main"><BriefingHeader nextEvent={nextEvent} priorityCount={priorityTasks.length} today={today} /><MobileWeekStrip events={events} today={today} /><WeeklySummary eventsToday={eventsToday.length} todayTasks={todayTasks.length} waiting={waitingTasks.length} workflows={workflowItems.length} /><section className="month-overview" aria-labelledby="month-overview-title"><div className="section-heading month-overview__heading"><div><p>월간 통합 캘린더</p><h2 id="month-overview-title">{month.replace("-", "년 ")}월</h2></div></div><FullMonthCalendar events={events} month={month} /></section></div><OperationsRail dueToday={dueToday.length} eventsToday={sortedEventsToday} priorityTasks={priorityTasks} todayTasks={todayTasks} waitingTasks={waitingTasks} workflowItems={workflowItems} /></div></main>;
}
