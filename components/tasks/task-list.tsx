import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";

import { deleteWorkItemAction, toggleTaskAction } from "@/app/(app)/work-item-actions";
import { CreateItemForm } from "@/components/layout/create-item-form";
import { Badge } from "@/components/ui/badge";
import type { TaskRow } from "@/types/database";

const areaLabel = { healthWork: "보건업무", schoolSchedule: "학교일정", exercise: "운동", personal: "개인일정", project: "프로젝트" } as const;

export function TaskList({ tasks }: { readonly tasks: TaskRow[] }) {
  if (!tasks.length) return <section className="empty-state"><Circle aria-hidden="true" /><h2>등록된 업무가 없습니다.</h2><p>빠른 추가에서 첫 업무를 등록해 보세요.</p></section>;
  return <section className="work-item-list" aria-label="업무 목록">{tasks.map((task) => (
    <article className="work-item-card" key={task.id}>
      <div className="work-item-card__main">
        <form action={toggleTaskAction}><input name="id" type="hidden" value={task.id} /><input name="completed" type="hidden" value={String(task.status !== "completed")} /><button aria-label={`${task.title} ${task.status === "completed" ? "완료 취소" : "완료"}`} className="icon-action" type="submit">{task.status === "completed" ? <CheckCircle2 /> : <Circle />}</button></form>
        <div><strong className={task.status === "completed" ? "is-completed" : undefined}>{task.title}</strong><div className="work-item-meta"><Badge tone={task.area === "healthWork" ? "health" : task.area === "schoolSchedule" ? "school" : task.area}>{areaLabel[task.area]}</Badge><span>{task.due_date ? `마감 ${task.due_date}` : task.scheduled_date ? `수행 ${task.scheduled_date}` : "날짜 미정"}</span><span>{task.status === "waitingForReply" ? "회신 대기" : task.priority === "high" ? "우선" : ""}</span></div></div>
      </div>
      <div className="work-item-actions"><details><summary><Pencil aria-hidden="true" size={16} />편집</summary><div className="inline-editor"><CreateItemForm initialItem={task} /></div></details><form action={deleteWorkItemAction}><input name="id" type="hidden" value={task.id} /><input name="kind" type="hidden" value="task" /><button className="danger-action" type="submit"><Trash2 aria-hidden="true" size={16} />삭제</button></form></div>
    </article>
  ))}</section>;
}
