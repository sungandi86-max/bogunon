import { CalendarCreateButton } from "@/components/calendar/calendar-create-button";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { listAllCalendarStickers } from "@/lib/calendar-stickers/repository";
import { calendarRange, type CalendarView } from "@/lib/calendar/smart-calendar";
import { todayInSeoul } from "@/lib/work-items/date";
import { listWorkflowData } from "@/lib/work-items/phase5-repository";
import { ensureRecurringEvents, ensureRecurringTasks, listAllEvents, listTasks } from "@/lib/work-items/repository";

export default async function CalendarPage({ searchParams }: { readonly searchParams: Promise<{ readonly create?: string; readonly date?: string; readonly highlight?: string; readonly view?: string }> }) {
  const params = await searchParams;
  const today = todayInSeoul();
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? String(params.date) : today;
  const view: CalendarView = params.view === "week" ? "week" : "month";
  const { last } = calendarRange(selectedDate, view);
  await Promise.all([ensureRecurringEvents(last), ensureRecurringTasks(last)]).catch(() => undefined);
  const [events, tasks, workflow, schoolStickers] = await Promise.all([
    listAllEvents(), listTasks(), listWorkflowData(), listAllCalendarStickers().catch(() => []),
  ]);
  return <main className="calendar-page"><div className="page-canvas">
    <PageHeader action={<MobileCreateButton kind="event" />} description="업무·학교·개인 일정과 날짜 기록을 한곳에 모아봅니다." title="캘린더" />
    <CalendarWorkspace events={events} highlight={params.highlight} initialDate={selectedDate} initialStickerOpen={params.create === "sticker"} initialView={view} key={`${view}-${selectedDate}`} stickers={schoolStickers} tasks={tasks} today={today} toolbarAction={<CalendarCreateButton />} workflow={workflow} />
  </div></main>;
}
