import { CalendarCreateButton } from "@/components/calendar/calendar-create-button";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { listCalendarStickers } from "@/lib/calendar-stickers/repository";
import { listExerciseStickerData } from "@/lib/exercise/repository";
import { listWorkflowData } from "@/lib/work-items/phase5-repository";
import { monthRange, todayInSeoul } from "@/lib/work-items/date";
import { ensureRecurringEvents, listEvents } from "@/lib/work-items/repository";

export default async function CalendarPage({ searchParams }: { readonly searchParams: Promise<{ readonly create?: string }> }) {
  const params = await searchParams;
  const today = todayInSeoul();
  const month = today.slice(0, 7);
  const { first, last } = monthRange(today);
  await ensureRecurringEvents(last).catch(() => undefined);
  const [events, workflow, schoolStickers, exercise] = await Promise.all([
    listEvents(first, last),
    listWorkflowData(),
    listCalendarStickers(first, last).catch(() => []),
    listExerciseStickerData(first, last).catch(() => ({ stickers: [], logs: [] })),
  ]);
  return <main className="calendar-page"><div className="page-canvas">
    <PageHeader action={<MobileCreateButton kind="event" />} description="업무·학교·개인 일정과 날짜 기록을 한 달에 모아봅니다." title="캘린더" />
    <div className="calendar-toolbar calendar-page-toolbar"><strong>{month.replace("-", "년 ")}월</strong><CalendarCreateButton /></div>
    <CalendarWorkspace events={events} exerciseLogs={exercise.logs} exerciseStickers={exercise.stickers} initialStickerOpen={params.create === "sticker"} month={month} stickers={schoolStickers} today={today} workflow={workflow} />
  </div></main>;
}
