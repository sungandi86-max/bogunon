import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ExerciseRecordType } from "@/types/database";

interface ExerciseRecordBadgeProps {
  readonly compact?: boolean;
  readonly recordType: ExerciseRecordType;
}

export function ExerciseRecordBadge({ compact = false, recordType }: ExerciseRecordBadgeProps) {
  if (recordType === "exercise") return null;
  const competition = recordType === "competition";
  return <Badge className={`exercise-record-badge${compact ? " exercise-record-badge--compact" : ""}`} tone={competition ? "success" : "exercise"}>
    {competition && <Trophy aria-hidden="true" size={compact ? 10 : 12} strokeWidth={1.8} />}
    <span data-record-type={recordType}>{competition ? "대회" : "레슨"}</span>
  </Badge>;
}
