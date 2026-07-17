import { CalendarDays, Clock3, MapPin, MoreHorizontal, Repeat2, Timer } from "lucide-react";

import { setExerciseStatusAction } from "@/app/(app)/exercise-actions";
import { Badge } from "@/components/ui/badge";
import { EXERCISE_INTENSITIES, exerciseRecurrenceLabels, exerciseStatusLabels } from "@/lib/exercise/domain";
import type { ExerciseRecord, ExerciseStatus } from "@/lib/exercise/domain";

const statusTones = { planned: "exercise", completed: "success", cancelled: "neutral" } as const;

function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" }).format(new Date(`${date}T00:00:00+09:00`));
}

function StatusAction({ id, label, status }: { readonly id: string; readonly label: string; readonly status: ExerciseStatus }) {
  return <form action={setExerciseStatusAction}><input name="id" type="hidden" value={id} /><input name="status" type="hidden" value={status} /><button type="submit">{label}</button></form>;
}

export function ExerciseCard({ record }: { readonly record: ExerciseRecord }) {
  const intensityLabel = EXERCISE_INTENSITIES.find((item) => item.value === record.intensity)?.label ?? "보통";
  return <article className="exercise-card">
    <header><div><span className="exercise-card__type">운동</span><h3>{record.event.title}</h3></div><div className="exercise-card__header-actions"><Badge tone={statusTones[record.status]}>{exerciseStatusLabels[record.status]}</Badge><details className="exercise-card__more"><summary aria-label={`${record.event.title} 상태 변경`}><MoreHorizontal aria-hidden="true" size={18} /></summary><div>{record.status !== "completed" && <StatusAction id={record.id} label="완료로 표시" status="completed" />}{record.status !== "cancelled" && <StatusAction id={record.id} label="취소로 표시" status="cancelled" />}{record.status !== "planned" && <StatusAction id={record.id} label="예정으로 되돌리기" status="planned" />}</div></details></div></header>
    <div className="exercise-card__schedule"><span><CalendarDays aria-hidden="true" size={15} />{dateLabel(record.date)}</span><span><Clock3 aria-hidden="true" size={15} />{record.startTime}</span><span><Timer aria-hidden="true" size={15} />{record.durationMinutes}분</span></div>
    <div className="exercise-card__meta">{record.location && <span><MapPin aria-hidden="true" size={14} />{record.location}</span>}<span>강도 {intensityLabel}</span>{record.recurrence && <span><Repeat2 aria-hidden="true" size={14} />{exerciseRecurrenceLabels[record.recurrence]}</span>}</div>
    {record.memo && <p>{record.memo}</p>}
  </article>;
}
