"use client";

import { Check, CirclePause, FastForward, Link2, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { saveWorkflowStepAction, transitionWorkflowAction, transitionWorkflowStepAction } from "@/app/(app)/workflow-actions";
import { calculateWorkflowProgress, deriveNextWorkflowAction } from "@/lib/workflows/domain";
import type { TaskRow } from "@/types/database";
import type { HealthWorkflowData, TaskWorkflowInstanceRow, TaskWorkflowStepRow } from "@/types/workflows";
import { WorkflowSubmitButton } from "@/components/workflows/workflow-submit-button";

const statusLabel = { active: "진행 중", paused: "일시 중지", completed: "완료", cancelled: "취소" } as const;
const stepStatusLabel = { pending: "대기", in_progress: "진행 중", completed: "완료", skipped: "건너뜀", blocked: "보류" } as const;

function StepEditor({ data, step }: { readonly data: HealthWorkflowData; readonly step: TaskWorkflowStepRow }) {
  const checklist = data.checklistItems.filter((item) => item.workflow_step_id === step.id);
  const links = data.links.filter((item) => item.workflow_step_id === step.id);
  const [checklistLines, setChecklistLines] = useState(checklist.map((item) => `${item.is_completed ? "[x]" : "[ ]"} ${item.title}`).join("\n"));
  const [linkLines, setLinkLines] = useState(links.map((item) => `${item.title} | ${item.url}`).join("\n"));
  const checklistJson = JSON.stringify(checklistLines.split("\n").map((line) => line.trim()).filter(Boolean).map((line, position) => ({
    title: line.replace(/^\[[ xX]\]\s*/, ""), isCompleted: /^\[[xX]\]/.test(line), position,
  })));
  const linksJson = JSON.stringify(linkLines.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [title, url] = line.split("|").map((item) => item.trim()); return { title: title || url, url };
  }));
  return <details className="workflow-step-editor"><summary>메모 · 체크리스트 · 링크</summary><form action={saveWorkflowStepAction} className="workflow-compact-form"><input name="stepId" type="hidden" value={step.id} /><label><span>담당자 표시</span><input defaultValue={step.assignee_label ?? ""} name="assigneeLabel" /></label><label><span>완료 조건</span><input defaultValue={step.completion_condition ?? ""} name="completionCondition" /></label><label><span>메모</span><textarea defaultValue={step.memo ?? ""} name="memo" rows={2} /></label><label><span>내부 참고사항</span><textarea defaultValue={step.internal_notes ?? ""} name="internalNotes" rows={2} /></label><label><span>체크리스트 ([x] 완료, 줄 순서가 표시 순서)</span><textarea onChange={(event) => setChecklistLines(event.target.value)} rows={4} value={checklistLines} /></label><label><span>링크 (제목 | https://주소)</span><textarea onChange={(event) => setLinkLines(event.target.value)} rows={3} value={linkLines} /></label><input name="checklist" type="hidden" value={checklistJson} /><input name="links" type="hidden" value={linksJson} /><button className="button button--secondary" type="submit">단계 상세 저장</button></form></details>;
}

function StepActions({ data, step }: { readonly data: HealthWorkflowData; readonly step: TaskWorkflowStepRow }) {
  const incomplete = data.checklistItems.filter((item) => item.workflow_step_id === step.id && !item.is_completed).length;
  const predecessorIncomplete = data.steps.some((item) => item.instance_id === step.instance_id && item.position < step.position && item.status !== "completed" && item.status !== "skipped");
  const action = (status: string, label: string, Icon: typeof Play, force = false) => <form action={transitionWorkflowStepAction}><input name="stepId" type="hidden" value={step.id} /><input name="status" type="hidden" value={status} /><input name="force" type="hidden" value={String(force)} /><button className="icon-text-action" onClick={(event) => { if (force && !window.confirm("미완료 체크리스트 또는 선행 단계가 있습니다. 그래도 이 단계를 완료할까요?")) event.preventDefault(); }} type="submit"><Icon size={14} />{label}</button></form>;
  return <div className="workflow-step-actions">
    {step.status === "pending" && action("in_progress", "시작", Play)}
    {step.status === "in_progress" && action("completed", incomplete || predecessorIncomplete ? `확인 후 강제 완료${incomplete ? ` (${incomplete}개 미완료)` : ""}` : "완료", Check, incomplete > 0 || predecessorIncomplete)}
    {(step.status === "pending" || step.status === "in_progress") && action("blocked", "보류", CirclePause)}
    {step.status !== "completed" && step.status !== "skipped" && action("skipped", "건너뛰기", FastForward)}
    {(step.status === "completed" || step.status === "skipped" || step.status === "blocked") && action("in_progress", "이 단계로 복귀", RotateCcw)}
  </div>;
}

export function WorkflowInstanceCard({ data, instance, task }: { readonly data: HealthWorkflowData; readonly instance: TaskWorkflowInstanceRow; readonly task?: TaskRow | undefined }) {
  const steps = data.steps.filter((item) => item.instance_id === instance.id).toSorted((a, b) => a.position - b.position);
  const snapshot = steps.map((step) => ({ id: step.id, name: step.name, position: step.position, status: step.status, incompleteChecklist: data.checklistItems.filter((item) => item.workflow_step_id === step.id && !item.is_completed).length }));
  const progress = calculateWorkflowProgress(snapshot); const next = deriveNextWorkflowAction(snapshot);
  const timeline = data.timeline.filter((item) => item.instance_id === instance.id).slice(0, 10);
  return <article className="workflow-instance-card" id={`workflow-${instance.id}`}>
    <header><div><span className={`workflow-status workflow-status--${instance.status}`}>{statusLabel[instance.status]}</span><h2>{instance.name}</h2><p>{task?.title ?? "연결 업무"}</p></div><strong>{progress.completed}/{progress.total} · {progress.percentage}%</strong></header>
    <div className="workflow-progress" aria-label={`진행률 ${progress.percentage}%`}><span style={{ width: `${progress.percentage}%` }} /></div>
    <div className="workflow-next"><strong>다음 해야 할 일</strong><p>{next.message}</p><span>현재 {next.stepName ?? "완료 확인"} · 남은 단계 {progress.remaining}</span></div>
    <div className="workflow-instance-actions">{instance.status === "active" && <><form action={transitionWorkflowAction}><input name="instanceId" type="hidden" value={instance.id} /><input name="status" type="hidden" value="paused" /><WorkflowSubmitButton className="button button--ghost">일시 중지</WorkflowSubmitButton></form><form action={transitionWorkflowAction}><input name="instanceId" type="hidden" value={instance.id} /><input name="status" type="hidden" value="completed" /><WorkflowSubmitButton className="button button--secondary" confirmMessage="모든 단계를 확인하고 Workflow를 완료할까요?">Workflow 완료</WorkflowSubmitButton></form></>}{instance.status === "paused" && <form action={transitionWorkflowAction}><input name="instanceId" type="hidden" value={instance.id} /><input name="status" type="hidden" value="active" /><WorkflowSubmitButton className="button button--secondary">재개</WorkflowSubmitButton></form>}{(instance.status === "active" || instance.status === "paused") && <form action={transitionWorkflowAction}><input name="instanceId" type="hidden" value={instance.id} /><input name="status" type="hidden" value="cancelled" /><WorkflowSubmitButton className="danger-action" confirmMessage="이 Workflow를 취소할까요? 취소 후에는 다시 열 수 없습니다.">취소</WorkflowSubmitButton></form>}</div>
    <ol className="workflow-steps">{steps.map((step) => <li className={`workflow-step workflow-step--${step.status}`} key={step.id}><div className="workflow-step__index">{step.position + 1}</div><div className="workflow-step__body"><div><strong>{step.name}</strong><span>{stepStatusLabel[step.status]}{step.estimated_minutes ? ` · ${step.estimated_minutes}분` : ""}</span></div>{step.description && <p>{step.description}</p>}<StepActions data={data} step={step} /><StepEditor data={data} step={step} /></div></li>)}</ol>
    <details className="workflow-timeline"><summary>Timeline {timeline.length}건</summary>{timeline.map((event) => <div key={event.id}><span /><p><strong>{event.message}</strong><time>{new Date(event.created_at).toLocaleString("ko-KR")}</time></p></div>)}</details>
    {data.links.some((item) => steps.some((step) => step.id === item.workflow_step_id)) && <span className="workflow-link-count"><Link2 size={13} />단계 링크 포함</span>}
  </article>;
}
