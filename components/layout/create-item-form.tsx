"use client";

import { ArrowDown, ArrowUp, Link2, Plus, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import type { RefObject } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";

import { saveWorkItemAction } from "@/app/(app)/work-item-actions";
import type { WorkItemActionState } from "@/app/(app)/work-item-actions";
import { TASK_CATEGORY_OPTIONS } from "@/lib/work-items/categories";
import { parseKoreanQuickInput } from "@/lib/work-items/workflow";
import type { QuickInputResult, TemplateDefinition } from "@/lib/work-items/workflow";
import { EVENT_COLOR_KEYS, PERSONAL_EVENT_PRESETS } from "@/lib/work-items/personal-event-presets";
import type { EventLinkRow, EventReminderRow, EventRow, TaskChecklistItemRow, TaskLinkRow, TaskReminderRow, TaskRow } from "@/types/database";
import { AssistantTrigger } from "@/components/ai/assistant-trigger";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";

type LinkDraft = { title: string; url: string };
type ChecklistDraft = { title: string; isCompleted: boolean };
type ReminderDraft = { offsetMinutes: number; referenceType: "scheduled" | "due" };

interface CreateItemFormProps {
  readonly defaultKind?: "task" | "event";
  readonly initialItem?: TaskRow | EventRow;
  readonly initialTemplate?: TemplateDefinition;
  readonly checklistItems?: readonly TaskChecklistItemRow[];
  readonly links?: readonly (TaskLinkRow | EventLinkRow)[];
  readonly reminders?: readonly (TaskReminderRow | EventReminderRow)[];
  readonly onSaved?: () => void;
  readonly titleRef?: RefObject<HTMLInputElement | null>;
}

const eventAreas = [
  ["healthWork", "업무"], ["schoolSchedule", "학교"], ["personal", "개인"],
] as const;
const taskAreas = [...eventAreas, ["exercise", "운동"]] as const;
const initialActionState: WorkItemActionState = { status: "idle" };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

export function CreateItemForm({ defaultKind = "task", initialItem, initialTemplate, checklistItems = [], links = [], reminders = [], onSaved, titleRef }: CreateItemFormProps) {
  const itemKind = initialItem && "start_date" in initialItem ? "event" : initialItem ? "task" : initialTemplate?.kind ?? defaultKind;
  const task = initialItem && "status" in initialItem ? initialItem : undefined;
  const event = initialItem && "start_date" in initialItem ? initialItem : undefined;
  const [kind, setKind] = useState<"task" | "event">(itemKind);
  const [title, setTitle] = useState(initialItem?.title ?? initialTemplate?.title ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? initialTemplate?.description ?? "");
  const initialArea = initialItem?.area === "project" || initialTemplate?.area === "project"
    ? "healthWork"
    : initialItem?.area ?? initialTemplate?.area ?? "healthWork";
  const [area, setArea] = useState(initialArea);
  const [category, setCategory] = useState(task?.category ?? initialTemplate?.category ?? "other");
  const [status, setStatus] = useState(task?.status ?? "planned");
  const [priority, setPriority] = useState(task?.priority ?? initialTemplate?.priority ?? "normal");
  const [recurrence, setRecurrence] = useState(task?.recurrence_frequency ?? event?.recurrence_frequency ?? initialTemplate?.recurrenceFrequency ?? "");
  const [scheduledDate, setScheduledDate] = useState(task?.scheduled_date ?? initialTemplate?.scheduledDate ?? "");
  const [startDate, setStartDate] = useState(event?.start_date ?? initialTemplate?.startDate ?? "");
  const [endDate, setEndDate] = useState(event?.end_date ?? initialTemplate?.endDate ?? initialTemplate?.startDate ?? "");
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? initialTemplate?.startTime ?? "");
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? initialTemplate?.endTime ?? "");
  const [allDay, setAllDay] = useState(event?.is_all_day ?? initialTemplate?.isAllDay ?? true);
  const [location, setLocation] = useState(event?.location ?? "");
  const [eventColor, setEventColor] = useState(event?.color_key ?? initialTemplate?.colorKey ?? (initialTemplate?.area === "personal" ? "lavender" : initialTemplate?.area === "schoolSchedule" ? "yellow" : "mint"));
  const [memo, setMemo] = useState(initialItem?.memo ?? initialTemplate?.memo ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimated_minutes?.toString() ?? initialTemplate?.estimatedMinutes?.toString() ?? "");
  const [checklist, setChecklist] = useState<ChecklistDraft[]>(checklistItems.length
    ? checklistItems.map((item) => ({ title: item.title, isCompleted: item.is_completed }))
    : initialTemplate?.checklist.map((item) => ({ title: item, isCompleted: false })) ?? []);
  const [linkDrafts, setLinkDrafts] = useState<LinkDraft[]>(links.map((item) => ({ title: item.title, url: item.url })));
  const [reminderDrafts, setReminderDrafts] = useState<ReminderDraft[]>(reminders.length
    ? reminders.map((item) => ({ offsetMinutes: item.offset_minutes, referenceType: "reference_type" in item ? item.reference_type : "scheduled" }))
    : initialTemplate?.reminderOffsets?.map((offsetMinutes) => ({ offsetMinutes, referenceType: "scheduled" })) ?? []);
  const [quickText, setQuickText] = useState("");
  const [quickPreview, setQuickPreview] = useState<QuickInputResult | null>(null);
  const [state, action, pending] = useActionState(saveWorkItemAction, initialActionState);
  const availableAreas = kind === "task" || area === "exercise" ? taskAreas : eventAreas;

  useEffect(() => { if (state.status === "success") onSaved?.(); }, [onSaved, state.status]);
  const formKey = initialItem?.id ?? "create";
  const checklistJson = useMemo(() => JSON.stringify(checklist.filter((item) => item.title.trim())), [checklist]);
  const linksJson = useMemo(() => JSON.stringify(linkDrafts.filter((item) => item.title.trim() || item.url.trim())), [linkDrafts]);
  const remindersJson = useMemo(() => JSON.stringify(reminderDrafts), [reminderDrafts]);

  function applyQuickPreview() {
    if (!quickPreview) return;
    setKind(quickPreview.kind);
    setTitle(quickPreview.title);
    setCategory(quickPreview.category);
    setPriority(quickPreview.priority);
    setRecurrence(quickPreview.recurrenceFrequency ?? "");
    if (quickPreview.scheduledDate) setScheduledDate(quickPreview.scheduledDate);
    if (quickPreview.startDate) {
      setStartDate(quickPreview.startDate);
      setEndDate(quickPreview.startDate);
    }
    setStartTime(quickPreview.startTime ?? "");
    setEndTime(quickPreview.startTime ? `${String(Math.min(23, Number(quickPreview.startTime.slice(0, 2)) + 1)).padStart(2, "0")}:${quickPreview.startTime.slice(3, 5)}` : "");
    setAllDay(quickPreview.isAllDay);
  }

  function updateChecklist(index: number, value: string) {
    setChecklist((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, title: value } : item));
  }

  function moveChecklist(index: number, direction: -1 | 1) {
    setChecklist((items) => {
      const nextIndex = index + direction;
      const currentItem = items[index];
      const targetItem = items[nextIndex];
      if (!currentItem || !targetItem) return items;
      const next = [...items];
      next[index] = targetItem;
      next[nextIndex] = currentItem;
      return next;
    });
  }

  function applyPersonalPreset(preset: (typeof PERSONAL_EVENT_PRESETS)[number]) {
    setKind("event");
    setArea("personal");
    setTitle(preset.title);
    setEventColor(preset.colorKey);
  }

  return (
    <form action={action} className="work-item-form" id={initialItem ? `edit-${initialItem.id}` : "create-work-item-form"}>
      <input name="id" type="hidden" value={initialItem?.id ?? ""} />
      <input name="checklist" type="hidden" value={checklistJson} />
      <input name="links" type="hidden" value={linksJson} />
      <input name="reminders" type="hidden" value={remindersJson} />
      {initialTemplate?.aiDraftId && <input name="aiDraftId" type="hidden" value={initialTemplate.aiDraftId} />}
      {initialTemplate?.requiredDate && <input name="requiredDate" type="hidden" value="true" />}

      {!initialItem && (
        <section className="quick-input-box" aria-labelledby="quick-input-title">
          <div className="quick-input-box__heading"><div><Sparkles aria-hidden="true" size={17} /><strong id="quick-input-title">한국어 빠른 입력</strong></div><AssistantTrigger label="AI로 초안" surface="quick_add" /></div>
          <textarea onChange={(e) => setQuickText(e.target.value)} placeholder="예: 내일 오후 2시 보건교육" value={quickText} />
          <button className="button button--secondary" onClick={() => setQuickPreview(parseKoreanQuickInput(quickText))} disabled={!quickText.trim()} type="button">입력 해석</button>
          {quickPreview && <div className="quick-preview"><span>{quickPreview.kind === "task" ? "업무" : "일정"}</span><strong>{quickPreview.title}</strong><small>{quickPreview.scheduledDate ?? quickPreview.startDate ?? "날짜 미정"}{quickPreview.startTime ? ` ${quickPreview.startTime}` : ""}</small><button onClick={applyQuickPreview} type="button">폼에 반영</button></div>}
        </section>
      )}

      <div className="field"><label className="field-label" htmlFor={`${formKey}-kind`}>항목 종류</label>{initialItem && <input name="kind" type="hidden" value={kind} />}<select disabled={Boolean(initialItem)} id={`${formKey}-kind`} name={initialItem ? undefined : "kind"} onChange={(e) => setKind(e.target.value === "event" ? "event" : "task")} value={kind}><option value="task">업무</option><option value="event">일정</option></select></div>
      <div className="field"><label className="field-label" htmlFor={`${formKey}-title`}>제목</label><input id={`${formKey}-title`} maxLength={120} name="title" onChange={(e) => setTitle(e.target.value)} placeholder="업무 또는 일정 제목" ref={titleRef} required value={title} /></div>
      <div className="field"><label className="field-label" htmlFor={`${formKey}-description`}>설명</label><textarea id={`${formKey}-description`} name="description" onChange={(e) => setDescription(e.target.value)} placeholder="업무 단위의 설명을 기록하세요." value={description} /></div>
      <div className="field"><label className="field-label" htmlFor={`${formKey}-area`}>영역</label><select id={`${formKey}-area`} name="area" onChange={(e) => setArea(e.target.value as typeof area)} value={area}>{availableAreas.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>

      {kind === "event" && area === "personal" && !initialItem && <section className="personal-event-presets" aria-label="개인 일정 빠른 항목"><strong>빠른 항목</strong><div>{PERSONAL_EVENT_PRESETS.map((preset) => <button aria-pressed={title === preset.title && eventColor === preset.colorKey} key={preset.key} onClick={() => applyPersonalPreset(preset)} type="button">{preset.title}</button>)}</div><small>제목과 색상만 채워집니다. 날짜와 시간을 확인한 뒤 저장하세요.</small></section>}

      {kind === "task" ? <div className="form-grid">
        <div className="field"><label className="field-label" htmlFor={`${formKey}-category`}>업무 카테고리</label><select id={`${formKey}-category`} name="category" onChange={(e) => setCategory(e.target.value as typeof category)} value={category}>{TASK_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-status`}>상태</label><select id={`${formKey}-status`} name="status" onChange={(e) => setStatus(e.target.value as typeof status)} value={status}><option value="planned">예정</option><option value="inProgress">진행 중</option><option value="waitingForReply">회신 대기</option><option value="needsCheck">확인 필요</option><option value="onHold">보류</option><option value="completed">완료</option></select></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-priority`}>우선순위</label><select id={`${formKey}-priority`} name="priority" onChange={(e) => setPriority(e.target.value as typeof priority)} value={priority}><option value="high">높음</option><option value="normal">보통</option><option value="low">낮음</option></select></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-estimate`}>예상 소요 시간(분)</label><input id={`${formKey}-estimate`} max={1440} min={1} name="estimatedMinutes" onChange={(e) => setEstimatedMinutes(e.target.value)} type="number" value={estimatedMinutes} /></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-recurrence`}>반복</label><select id={`${formKey}-recurrence`} name="recurrenceFrequency" onChange={(e) => setRecurrence(e.target.value)} value={recurrence}><option value="">반복 안 함</option><option value="daily">매일</option><option value="weekly">매주</option><option value="monthly">매월</option><option value="yearly">매년</option></select></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-scheduled`}>수행일</label><CalendarDateInput id={`${formKey}-scheduled`} name="scheduledDate" onValueChange={setScheduledDate} required={Boolean(recurrence) || initialTemplate?.requiredDate === true} value={scheduledDate} />{recurrence && <small className="field-help">반복 생성의 기준일입니다.</small>}</div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-due`}>마감일</label><CalendarDateInput defaultValue={task?.due_date ?? initialTemplate?.dueDate ?? ""} id={`${formKey}-due`} name="dueDate" /></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-followup`}>후속 확인일</label><CalendarDateInput defaultValue={task?.follow_up_date ?? ""} id={`${formKey}-followup`} name="followUpDate" /></div>
      </div> : <div className="form-grid">
        <div className="field"><label className="field-label" htmlFor={`${formKey}-start`}>시작일</label><CalendarDateInput id={`${formKey}-start`} name="startDate" onValueChange={(value) => { setStartDate(value); if (!endDate) setEndDate(value); }} required value={startDate} /></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-end`}>종료일</label><CalendarDateInput id={`${formKey}-end`} name="endDate" onValueChange={setEndDate} required value={endDate} /></div>
        <label className="checkbox-field"><input checked={allDay} name="isAllDay" onChange={(e) => setAllDay(e.target.checked)} type="checkbox" />종일 일정</label>
        {!allDay && <><div className="field"><label className="field-label" htmlFor={`${formKey}-start-time`}>시작 시간</label><input id={`${formKey}-start-time`} name="startTime" onChange={(e) => setStartTime(e.target.value)} required type="time" value={startTime} /></div><div className="field"><label className="field-label" htmlFor={`${formKey}-end-time`}>종료 시간</label><input id={`${formKey}-end-time`} min={startTime} name="endTime" onChange={(e) => setEndTime(e.target.value)} required type="time" value={endTime} /></div></>}
        <div className="field"><label className="field-label" htmlFor={`${formKey}-location`}>장소</label><input id={`${formKey}-location`} maxLength={120} name="location" onChange={(e) => setLocation(e.target.value)} placeholder="선택 입력" value={location} /></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-event-recurrence`}>반복</label><select id={`${formKey}-event-recurrence`} name="recurrenceFrequency" onChange={(e) => setRecurrence(e.target.value)} value={recurrence}><option value="">반복 안 함</option><option value="daily">매일</option><option value="weekly">매주</option><option value="monthly">매월</option><option value="yearly">매년</option></select></div>
        <div className="field"><label className="field-label" htmlFor={`${formKey}-event-color`}>색상</label><select id={`${formKey}-event-color`} name="colorKey" onChange={(e) => setEventColor(e.target.value as typeof eventColor)} value={eventColor}>{EVENT_COLOR_KEYS.map((color) => <option key={color} value={color}>{({ mint: "민트", blue: "블루", yellow: "옐로", coral: "코랄", lavender: "라벤더", pink: "핑크" } as const)[color]}</option>)}</select></div>
      </div>}

      {kind === "task" && <section className="form-collection"><div className="form-collection__heading"><div><strong>체크리스트</strong><span>{checklist.length}개 항목</span></div><button onClick={() => setChecklist((items) => [...items, { title: "", isCompleted: false }])} type="button"><Plus size={15} />추가</button></div>{checklist.map((item, index) => <div className="collection-row" key={index}><input aria-label={`체크리스트 ${index + 1}`} onChange={(e) => updateChecklist(index, e.target.value)} placeholder="세부 업무" value={item.title} /><button aria-label="위로 이동" disabled={index === 0} onClick={() => moveChecklist(index, -1)} type="button"><ArrowUp size={14} /></button><button aria-label="아래로 이동" disabled={index === checklist.length - 1} onClick={() => moveChecklist(index, 1)} type="button"><ArrowDown size={14} /></button><button aria-label="삭제" onClick={() => setChecklist((items) => items.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={14} /></button></div>)}</section>}

      <section className="form-collection"><div className="form-collection__heading"><div><strong>관련 링크</strong><span>HTTP 또는 HTTPS 주소</span></div><button onClick={() => setLinkDrafts((items) => [...items, { title: "", url: "" }])} type="button"><Link2 size={15} />추가</button></div>{linkDrafts.map((link, index) => <div className="link-row" key={index}><input aria-label={`링크 제목 ${index + 1}`} onChange={(e) => setLinkDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))} placeholder="링크 제목" value={link.title} /><input aria-label={`링크 주소 ${index + 1}`} onChange={(e) => setLinkDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, url: e.target.value } : item))} placeholder="https://" type="url" value={link.url} /><button aria-label="링크 삭제" onClick={() => setLinkDrafts((items) => items.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={14} /></button></div>)}</section>

      <section className="form-collection"><div className="form-collection__heading"><div><strong>알림 준비</strong><span>0분=당일, 1440분=1일 전, 4320분=3일 전, 10080분=1주 전</span></div><button onClick={() => setReminderDrafts((items) => [...items, { offsetMinutes: 1440, referenceType: kind === "task" ? "due" : "scheduled" }])} type="button"><Plus size={15} />추가</button></div>{reminderDrafts.map((reminder, index) => <div className="reminder-row" key={index}>{kind === "task" && <select aria-label={`알림 기준 ${index + 1}`} onChange={(e) => setReminderDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, referenceType: e.target.value === "scheduled" ? "scheduled" : "due" } : item))} value={reminder.referenceType}><option value="due">마감일</option><option value="scheduled">수행일</option></select>}<input aria-label={`알림 시점(분) ${index + 1}`} max={525600} min={0} onChange={(e) => setReminderDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, offsetMinutes: Number(e.target.value) } : item))} type="number" value={reminder.offsetMinutes} /><span>분 전</span><button aria-label="알림 삭제" onClick={() => setReminderDrafts((items) => items.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={14} /></button></div>)}</section>

      <div className="field"><label className="field-label" htmlFor={`${formKey}-memo`}>메모</label><textarea id={`${formKey}-memo`} name="memo" onChange={(e) => setMemo(e.target.value)} placeholder="비식별 업무 상태만 기록하세요." value={memo} /></div>
      {initialTemplate && <p className="template-applied">{initialTemplate.name} 템플릿의 기본값을 적용했습니다. {initialTemplate.suggestedYear && initialTemplate.suggestedMonth ? `${initialTemplate.suggestedYear}년 ${initialTemplate.suggestedMonth}월 중 실제 날짜를 선택해 주세요.` : "날짜를 확인해 주세요."}</p>}
      {!scheduledDate && recurrence && <button className="text-action" onClick={() => setScheduledDate(today())} type="button">반복 시작일을 오늘로 설정</button>}
      <div className="privacy-notice"><ShieldCheck aria-hidden="true" size={17} /><span>개인을 식별하거나 건강 상태를 드러내는 민감정보를 입력하지 마세요.</span></div>
      {state.message && <p aria-live="polite" className={state.status === "error" ? "form-message form-message--error" : "form-message"}>{state.message}</p>}
      {initialItem && <button className="button button--primary" disabled={pending} type="submit">{pending ? "저장 중" : "변경 저장"}</button>}
    </form>
  );
}
