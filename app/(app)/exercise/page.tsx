import { ExerciseWorkspace } from "@/components/exercise/exercise-workspace";
import { isExerciseRecordEvent } from "@/lib/exercise/domain";
import { listAllEvents } from "@/lib/work-items/repository";
import { todayInSeoul } from "@/lib/work-items/date";

export default async function ExercisePage() {
  const events = await listAllEvents();
  return <ExerciseWorkspace events={events.filter(isExerciseRecordEvent)} today={todayInSeoul()} />;
}
