import { ExerciseWorkspace } from "@/components/exercise/exercise-workspace";
import { isExerciseRecordEvent } from "@/lib/exercise/domain";
import { listAllEvents } from "@/lib/work-items/repository";
import { todayInSeoul } from "@/lib/work-items/date";

export default async function ExercisePage({ searchParams }: { readonly searchParams: Promise<{ readonly create?: string }> }) {
  const params = await searchParams;
  const events = await listAllEvents();
  return <ExerciseWorkspace events={events.filter(isExerciseRecordEvent)} initialOpen={params.create === "1"} today={todayInSeoul()} />;
}
