import { BriefingScreen } from "@/components/briefing/briefing-screen";
import { monthRange, todayInSeoul } from "@/lib/work-items/date";
import { addDays } from "@/lib/work-items/recurrence";
import { ensureRecurringTasks, listEvents, listTasks } from "@/lib/work-items/repository";
import { listHealthWorkflowData } from "@/lib/workflows/repository";
import { listExerciseStickerData } from "@/lib/exercise/repository";

export default async function BriefingPage() {
  const today = todayInSeoul();
  const month = today.slice(0, 7);
  const { first, last } = monthRange(today);
  const eventRangeEnd = addDays(today, 31) > last ? addDays(today, 31) : last;
  await ensureRecurringTasks(today);
  const [tasks, events, workflow, exercise] = await Promise.all([
    listTasks(),
    listEvents(first, eventRangeEnd),
    listHealthWorkflowData(),
    listExerciseStickerData(today, today).catch(() => ({ stickers: [], logs: [] })),
  ]);
  return <BriefingScreen events={events} exerciseLogs={exercise.logs} exerciseStickers={exercise.stickers} month={month} nowIso={new Date().toISOString()} tasks={tasks} today={today} workflow={workflow} />;
}
