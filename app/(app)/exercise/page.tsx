import { ExerciseWorkspace } from "@/components/exercise/exercise-workspace";
import { isExerciseRecordEvent } from "@/lib/exercise/domain";
import { listExerciseStickerData } from "@/lib/exercise/repository";
import { listEvents } from "@/lib/work-items/repository";
import { monthRange, todayInSeoul } from "@/lib/work-items/date";

export default async function ExercisePage({ searchParams }: { readonly searchParams: Promise<{ readonly create?: string; readonly month?: string }> }) {
  const params = await searchParams;
  const today = todayInSeoul();
  const requestedMonth = params.month;
  const month = requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : today.slice(0, 7);
  const { first, last } = monthRange(`${month}-01`);
  const [events, stickerData] = await Promise.all([
    listEvents(first, last),
    listExerciseStickerData(first, last).catch(() => null),
  ]);
  return <ExerciseWorkspace dataAvailable={stickerData !== null} events={events.filter(isExerciseRecordEvent)} initialOpen={stickerData !== null && (params.create === "sticker" || params.create === "1")} logs={stickerData?.logs ?? []} month={month} stickers={stickerData?.stickers ?? []} today={today} />;
}
