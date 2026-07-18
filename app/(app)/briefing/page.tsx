import { BriefingScreen } from "@/components/briefing/briefing-screen";
import { monthRange, todayInSeoul } from "@/lib/work-items/date";
import { addDays } from "@/lib/work-items/recurrence";
import { ensureRecurringEvents, ensureRecurringTasks, listEvents, listTasks } from "@/lib/work-items/repository";
import { listHealthWorkflowData } from "@/lib/workflows/repository";
import { listExerciseStickerData } from "@/lib/exercise/repository";
import { listCalendarStickers } from "@/lib/calendar-stickers/repository";

export default async function BriefingPage() {
  const today = todayInSeoul();
  const month = today.slice(0, 7);
  const { first, last } = monthRange(today);
  const eventRangeEnd = addDays(today, 31) > last ? addDays(today, 31) : last;
  await Promise.all([ensureRecurringTasks(today), ensureRecurringEvents(eventRangeEnd).catch(() => undefined)]);
  const [tasks, events, workflow, exercise, calendarStickers] = await Promise.all([
    listTasks(),
    listEvents(first, eventRangeEnd),
    listHealthWorkflowData(),
    listExerciseStickerData(today, today).catch(() => ({ stickers: [], logs: [] })),
    listCalendarStickers(first, last).catch(() => []),
  ]);
  return <BriefingScreen calendarStickers={calendarStickers} events={events} exerciseLogs={exercise.logs} exerciseStickers={exercise.stickers} month={month} nowIso={new Date().toISOString()} tasks={tasks} today={today} workflow={workflow} />;
}
