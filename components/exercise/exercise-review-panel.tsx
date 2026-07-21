import { CompetitionReviewForm } from "@/components/exercise/competition-review-form";
import { LessonReviewForm } from "@/components/exercise/lesson-review-form";
import type { ExerciseLogWithReview } from "@/lib/exercise/repository";
import type { ExerciseRecordType } from "@/types/database";

export type ActiveExerciseReview = {
  readonly logId: string;
  readonly recordType: Exclude<ExerciseRecordType, "exercise">;
};

interface ExerciseReviewPanelProps {
  readonly active: ActiveExerciseReview;
  readonly logs: readonly ExerciseLogWithReview[];
}

export function ExerciseReviewPanel({ active, logs }: ExerciseReviewPanelProps) {
  const hydrated = logs.find((log) => log.id === active.logId);
  if (active.recordType === "lesson") return <LessonReviewForm exerciseLogId={active.logId} review={hydrated?.lessonReview ?? null} />;
  return <CompetitionReviewForm exerciseLogId={active.logId} review={hydrated?.competitionReview ?? null} />;
}
