import { ExerciseWorkspace } from "@/components/exercise/exercise-workspace";
import { isExerciseRecordEvent } from "@/lib/exercise/domain";
import { listExerciseStickerData, listRecentExerciseLogs } from "@/lib/exercise/repository";
import { eventDetailsForType, resolveEventType } from "@/lib/work-items/event-types";
import { listEvents } from "@/lib/work-items/repository";
import { monthRange, todayInSeoul } from "@/lib/work-items/date";
import type { ExerciseRecordType } from "@/types/database";

interface ExercisePageSearchParams {
  readonly create?: string;
  readonly date?: string;
  readonly eventId?: string;
  readonly logId?: string;
  readonly month?: string;
  readonly recordType?: string;
}

export default async function ExercisePage({ searchParams }: { readonly searchParams: Promise<ExercisePageSearchParams> }) {
  const params = await searchParams;
  const today = todayInSeoul();
  const requestedMonth = params.month;
  const month = requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : today.slice(0, 7);
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? String(params.date) : today;
  const { first, last } = monthRange(`${month}-01`);
  const [events, stickerData, recentLogs] = await Promise.all([
    listEvents(first, last),
    listExerciseStickerData(first, last).catch(() => null),
    listRecentExerciseLogs().catch(() => []),
  ]);
  const initialEvent = events.find((event) => event.id === params.eventId && ["workout", "tournament"].includes(resolveEventType(event)));
  const requestedRecordType: ExerciseRecordType | undefined = params.recordType === "competition"
    ? "competition"
    : params.recordType === "exercise"
      ? "exercise"
      : undefined;
  const initialEventType = initialEvent ? resolveEventType(initialEvent) : null;
  const initialEventDetails = initialEvent && initialEventType ? eventDetailsForType(initialEvent, initialEventType) : null;
  return <ExerciseWorkspace
    dataAvailable={stickerData !== null}
    events={events.filter(isExerciseRecordEvent)}
    initialDate={initialDate}
    initialEventDetails={initialEventDetails}
    initialOpen={stickerData !== null && (params.create === "sticker" || params.create === "1")}
    logs={stickerData?.logs ?? []}
    month={month}
    recentLogs={recentLogs}
    stickers={stickerData?.stickers ?? []}
    today={today}
    {...(initialEvent ? { initialEvent } : {})}
    {...(params.logId ? { initialLogId: params.logId } : {})}
    {...(requestedRecordType ? { initialRecordType: requestedRecordType } : {})}
  />;
}
