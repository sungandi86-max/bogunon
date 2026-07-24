import { CompetitionReviewForm } from "@/components/exercise/competition-review-form";
import { LessonReviewForm } from "@/components/exercise/lesson-review-form";
import type { ExerciseLogWithReview } from "@/lib/exercise/repository";
import type { ExerciseRecordType } from "@/types/database";

export type ActiveExerciseReview = {
  readonly competitionDefaults?: CompetitionReviewDefaults;
  readonly logId: string;
  readonly recordType: Exclude<ExerciseRecordType, "exercise">;
};

export interface CompetitionReviewDefaults {
  readonly competitionName?: string;
  readonly eventCategory?: string;
  readonly grade?: string;
  readonly location?: string;
  readonly partner?: string;
}

interface ExerciseReviewPanelProps {
  readonly active: ActiveExerciseReview;
  readonly logs: readonly ExerciseLogWithReview[];
}

export function ExerciseReviewPanel({ active, logs }: ExerciseReviewPanelProps) {
  const hydrated = logs.find((log) => log.id === active.logId);
  if (active.recordType === "lesson") return <LessonReviewForm exerciseLogId={active.logId} review={hydrated?.lessonReview ?? null} />;
  return <CompetitionReviewForm exerciseLogId={active.logId} review={hydrated?.competitionReview ?? null} {...(active.competitionDefaults ? { defaults: active.competitionDefaults } : {})} />;
}
