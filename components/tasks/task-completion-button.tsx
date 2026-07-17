"use client";

import { CheckCircle2, Circle } from "lucide-react";

import { toggleTaskAction } from "@/app/(app)/work-item-actions";

export function TaskCompletionButton({ completed, incompleteChecklist, taskId, title }: { readonly completed: boolean; readonly incompleteChecklist: number; readonly taskId: string; readonly title: string }) {
  return <form action={toggleTaskAction} onSubmit={(event) => { if (!completed && incompleteChecklist > 0 && !window.confirm(`미완료 체크리스트가 ${incompleteChecklist}개 있습니다. 업무를 완료할까요?`)) event.preventDefault(); }}><input name="id" type="hidden" value={taskId} /><input name="completed" type="hidden" value={String(!completed)} /><button aria-label={`${title} ${completed ? "완료 취소" : "완료"}`} className="icon-action" type="submit">{completed ? <CheckCircle2 /> : <Circle />}</button></form>;
}
