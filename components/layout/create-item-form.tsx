"use client";

import { ShieldCheck } from "lucide-react";
import type { RefObject } from "react";
import { useActionState, useEffect, useState } from "react";

import { saveWorkItemAction } from "@/app/(app)/work-item-actions";
import type { WorkItemActionState } from "@/app/(app)/work-item-actions";
import type { EventRow, TaskRow } from "@/types/database";

interface CreateItemFormProps {
  readonly defaultKind?: "task" | "event";
  readonly initialItem?: TaskRow | EventRow;
  readonly onSaved?: () => void;
  readonly titleRef?: RefObject<HTMLInputElement | null>;
}

const areas = [
  ["healthWork", "보건업무"], ["schoolSchedule", "학교일정"], ["exercise", "운동"],
  ["personal", "개인일정"], ["project", "프로젝트"],
] as const;
const initialWorkItemActionState: WorkItemActionState = { status: "idle" };

export function CreateItemForm({ defaultKind = "task", initialItem, onSaved, titleRef }: CreateItemFormProps) {
  const initialKind = initialItem && "start_date" in initialItem ? "event" : defaultKind;
  const [kind, setKind] = useState<"task" | "event">(initialKind);
  const [allDay, setAllDay] = useState(initialItem && "is_all_day" in initialItem ? initialItem.is_all_day : true);
  const [state, action, pending] = useActionState(saveWorkItemAction, initialWorkItemActionState);

  useEffect(() => { if (state.status === "success") onSaved?.(); }, [onSaved, state.status]);
  const task = initialItem && "status" in initialItem ? initialItem : undefined;
  const event = initialItem && "start_date" in initialItem ? initialItem : undefined;

  return (
    <form action={action} className="work-item-form" id={initialItem ? `edit-${initialItem.id}` : "create-work-item-form"}>
      <input name="id" type="hidden" value={initialItem?.id ?? ""} />
      <div className="field">
        <label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-kind`}>항목 종류</label>
        {initialItem && <input name="kind" type="hidden" value={kind} />}
        <select disabled={Boolean(initialItem)} id={`${initialItem?.id ?? "create"}-kind`} name={initialItem ? undefined : "kind"} onChange={(e) => setKind(e.target.value as "task" | "event")} value={kind}>
          <option value="task">업무</option><option value="event">일정</option>
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-title`}>제목</label>
        <input defaultValue={initialItem?.title} id={`${initialItem?.id ?? "create"}-title`} maxLength={120} name="title" placeholder="업무 또는 일정 제목" ref={titleRef} required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-area`}>영역</label>
        <select defaultValue={initialItem?.area ?? "healthWork"} id={`${initialItem?.id ?? "create"}-area`} name="area">
          {areas.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {kind === "task" ? (
        <div className="form-grid">
          <div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-status`}>상태</label><select defaultValue={task?.status ?? "planned"} id={`${initialItem?.id ?? "create"}-status`} name="status"><option value="planned">예정</option><option value="inProgress">진행 중</option><option value="waitingForReply">회신 대기</option><option value="needsCheck">확인 필요</option><option value="onHold">보류</option><option value="completed">완료</option></select></div>
          <div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-priority`}>우선순위</label><select defaultValue={task?.priority ?? "normal"} id={`${initialItem?.id ?? "create"}-priority`} name="priority"><option value="high">높음</option><option value="normal">보통</option><option value="low">낮음</option></select></div>
          <div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-scheduled`}>수행일</label><input defaultValue={task?.scheduled_date ?? ""} id={`${initialItem?.id ?? "create"}-scheduled`} name="scheduledDate" type="date" /></div>
          <div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-due`}>마감일</label><input defaultValue={task?.due_date ?? ""} id={`${initialItem?.id ?? "create"}-due`} name="dueDate" type="date" /></div>
          <div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-followup`}>후속 확인일</label><input defaultValue={task?.follow_up_date ?? ""} id={`${initialItem?.id ?? "create"}-followup`} name="followUpDate" type="date" /></div>
        </div>
      ) : (
        <div className="form-grid">
          <div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-start`}>시작일</label><input defaultValue={event?.start_date ?? ""} id={`${initialItem?.id ?? "create"}-start`} name="startDate" required type="date" /></div>
          <div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-end`}>종료일</label><input defaultValue={event?.end_date ?? ""} id={`${initialItem?.id ?? "create"}-end`} name="endDate" required type="date" /></div>
          <label className="checkbox-field"><input checked={allDay} name="isAllDay" onChange={(e) => setAllDay(e.target.checked)} type="checkbox" />종일 일정</label>
          {!allDay && <><div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-start-time`}>시작 시간</label><input defaultValue={event?.start_time?.slice(0, 5) ?? ""} id={`${initialItem?.id ?? "create"}-start-time`} name="startTime" required type="time" /></div><div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-end-time`}>종료 시간</label><input defaultValue={event?.end_time?.slice(0, 5) ?? ""} id={`${initialItem?.id ?? "create"}-end-time`} name="endTime" type="time" /></div></>}
        </div>
      )}
      <div className="field"><label className="field-label" htmlFor={`${initialItem?.id ?? "create"}-memo`}>메모</label><textarea defaultValue={initialItem?.memo ?? ""} id={`${initialItem?.id ?? "create"}-memo`} name="memo" placeholder="비식별 업무 상태만 기록하세요." /></div>
      <div className="privacy-notice"><ShieldCheck aria-hidden="true" size={17} /><span>학생 이름, 학번, 질병명, 상담 내용 등 민감정보를 입력하지 마세요.</span></div>
      {state.message && <p aria-live="polite" className={state.status === "error" ? "form-message form-message--error" : "form-message"}>{state.message}</p>}
      {initialItem && <button className="button button--primary" disabled={pending} type="submit">{pending ? "저장 중" : "변경 저장"}</button>}
    </form>
  );
}
