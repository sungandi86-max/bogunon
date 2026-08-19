"use client";

import { useEffect, useState } from "react";
import { Plus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HealthSupportCalendarContext } from "@/components/health-support-instructors/calendar-context";
import { InstructorSettingsForm } from "@/components/health-support-instructors/instructor-settings-form";
import { Dashboard, SettlementPanel } from "@/components/health-support-instructors/health-support-instructor-status-pane";
import { deleteHealthSupportWorkLogAction, type HealthSupportActionState } from "@/app/(app)/health-support-instructors/actions";
import { calculateHealthSupportInstructorManager } from "@/lib/health-support-instructors/domain";
import { createHealthSupportWorkLogImportPlan, parseHealthSupportWorkLogImport, type HealthSupportWorkLogImportPreview } from "@/lib/health-support-instructors/import/work-log-import";
import type { HealthSupportInstructor, HealthSupportWorkLog } from "@/lib/health-support-instructors/repository";
import { createHealthSupportSettlementDocuments } from "@/lib/health-support-instructors/settlement/documents";
import type { HealthSupportSettlementDocuments } from "@/lib/health-support-instructors/settlement/documents";
import type { EventRow } from "@/types/database";

const tabs = ["대시보드", "근무기록", "월별 정산", "지급명세서·출력", "설정"] as const;
type WorkspaceTab = (typeof tabs)[number];
type SaveInstructor = (state: HealthSupportActionState, formData: FormData) => Promise<HealthSupportActionState>;
type SaveWorkLog = (state: HealthSupportActionState, formData: FormData) => Promise<HealthSupportActionState>;
type DeleteWorkLog = (formData: FormData) => Promise<void>;
type PrintableDocument = "work-detail" | "payment-statement";

interface HealthSupportInstructorWorkspaceProps {
  readonly calendarEvents?: readonly EventRow[];
  readonly deleteWorkLog?: DeleteWorkLog;
  readonly instructors: readonly HealthSupportInstructor[];
  readonly saveInstructor?: SaveInstructor;
  readonly saveWorkLog?: SaveWorkLog;
  readonly workLogs: readonly HealthSupportWorkLog[];
}

function hoursFor(log: HealthSupportWorkLog): number {
  const [startHourText, startMinuteText] = log.startTime.split(":");
  const [endHourText, endMinuteText] = log.endTime.split(":");
  const startHour = Number(startHourText ?? "0");
  const startMinute = Number(startMinuteText ?? "0");
  const endHour = Number(endHourText ?? "0");
  const endMinute = Number(endMinuteText ?? "0");
  return ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60;
}

function won(value: number): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
}

function localIsoDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function settlementMonthFor(instructor: HealthSupportInstructor | undefined, workLogs: readonly HealthSupportWorkLog[]): string {
  const latestLog = workLogs.find((log) => log.instructorId === instructor?.id);
  return latestLog?.date.slice(0, 7) ?? instructor?.operationStartDate.slice(0, 7) ?? "";
}

export function HealthSupportInstructorWorkspace({ calendarEvents = [], deleteWorkLog = deleteHealthSupportWorkLogAction, instructors, saveInstructor, saveWorkLog, workLogs }: HealthSupportInstructorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("대시보드");
  const [instructorId, setInstructorId] = useState(instructors[0]?.id ?? "");
  const [editingLog, setEditingLog] = useState<HealthSupportWorkLog>();
  const [formError, setFormError] = useState<string>();
  const [formMessage, setFormMessage] = useState<string>();
  const [selectedMonth, setSelectedMonth] = useState(() => settlementMonthFor(instructors[0], workLogs));
  const [showWorkDetail, setShowWorkDetail] = useState(false);
  const [showPaymentStatement, setShowPaymentStatement] = useState(false);
  const [printDocument, setPrintDocument] = useState<PrintableDocument>();
  const instructor = instructors.find((candidate) => candidate.id === instructorId) ?? instructors[0];
  const selectedLogs = workLogs.filter((log) => log.instructorId === instructor?.id);
  const documents = instructor ? createHealthSupportSettlementDocuments({ instructor, month: selectedMonth, workLogs }) : null;
  const calculation = instructor ? calculateHealthSupportInstructorManager({
    budget: instructor.totalBudget,
    hourlyRate: instructor.hourlyRate,
    monthlyInsuranceRate: instructor.monthlyInsurance,
    monthlyLimitHours: instructor.monthlyHourLimit,
    weeklyLimitHours: instructor.weeklyHourLimit,
    workLogs: selectedLogs,
  }) : null;

  useEffect(() => {
    const clearPrintDocument = () => setPrintDocument(undefined);
    window.addEventListener("afterprint", clearPrintDocument);
    return () => window.removeEventListener("afterprint", clearPrintDocument);
  }, []);

  function printDocumentPreview(document: PrintableDocument): void {
    setPrintDocument(document);
    window.requestAnimationFrame(() => window.print());
  }

  function selectInstructor(nextInstructorId: string): void {
    const nextInstructor = instructors.find((candidate) => candidate.id === nextInstructorId);
    setInstructorId(nextInstructorId);
    setEditingLog(undefined);
    setFormError(undefined);
    if (nextInstructor) setSelectedMonth(settlementMonthFor(nextInstructor, workLogs));
  }

  async function submitWorkLog(formData: FormData): Promise<void> {
    const startTime = String(formData.get("startTime") ?? "");
    const endTime = String(formData.get("endTime") ?? "");
    if (!startTime || !endTime || startTime >= endTime) {
      setFormError("종료 시간은 시작 시간보다 늦어야 합니다.");
      setFormMessage(undefined);
      return;
    }
    if (!saveWorkLog) {
      setFormError(undefined);
      setFormMessage("저장 준비가 완료되었습니다. 저장은 명시적으로 요청될 때만 실행됩니다.");
      return;
    }
    const result = await saveWorkLog({ status: "idle" }, formData);
    if (result.status === "error") {
      setFormError(result.message ?? "근무 기록을 확인해 주세요.");
      return;
    }
    setFormError(undefined);
    setFormMessage(result.message ?? "근무 기록을 저장했습니다.");
    setEditingLog(undefined);
  }

  if (!instructor) {
    return <EmptyInstructorWorkspace activeTab={activeTab} onOpenSettings={() => setActiveTab("설정")} {...(saveInstructor ? { saveInstructor } : {})} />;
  }

  return <section className="health-support-workspace" aria-label="보건지원강사 관리 작업 공간" data-print-document={printDocument}>
    <div className="health-support-workspace__context">
      <div><p>보건지원강사 관리</p><h2>{instructor.name}</h2><span>{instructor.subject}</span></div>
      {instructors.length > 1 && <label>강사 선택<select aria-label="강사 선택" onChange={(event) => selectInstructor(event.target.value)} value={instructor.id}>{instructors.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.subject}</option>)}</select></label>}
    </div>
    <div aria-label="보건지원강사 관리 탭" className="health-support-workspace__tabs" role="tablist">
      {tabs.map((tab) => <button aria-controls={`health-support-${tab}`} aria-selected={activeTab === tab} id={`health-support-tab-${tab}`} key={tab} onClick={() => setActiveTab(tab)} role="tab" type="button">{tab}</button>)}
    </div>
    <div aria-labelledby={`health-support-tab-${activeTab}`} className="health-support-workspace__panel" id={`health-support-${activeTab}`} role="tabpanel">
      {activeTab === "대시보드" && documents && calculation && <Dashboard calculation={calculation} documents={documents} instructor={instructor} onOpenWorkLogs={() => setActiveTab("근무기록")} />}
      {activeTab === "근무기록" && calculation && <CalendarAwareWorkLogPanel {...(editingLog ? { editingLog } : {})} {...(formError ? { formError } : {})} {...(formMessage ? { formMessage } : {})} calculation={calculation} calendarEvents={calendarEvents} deleteWorkLog={deleteWorkLog} instructor={instructor} key={`${instructor.id}-${editingLog?.id ?? "new"}`} logs={selectedLogs} month={selectedMonth} onEdit={setEditingLog} onMonthChange={setSelectedMonth} onSubmit={submitWorkLog} />}
      {activeTab === "월별 정산" && documents && <SettlementPanel documents={documents} onMonthChange={setSelectedMonth} onPrint={() => printDocumentPreview("work-detail")} onToggleDetail={() => setShowWorkDetail(true)} printActive={printDocument === "work-detail"} selectedMonth={selectedMonth} showWorkDetail={showWorkDetail} />}
      {activeTab === "지급명세서·출력" && documents && <PaymentStatementPanel documents={documents} onPrint={() => printDocumentPreview("payment-statement")} onTogglePreview={() => setShowPaymentStatement(true)} printActive={printDocument === "payment-statement"} showPreview={showPaymentStatement} />}
      {activeTab === "설정" && <InstructorSettingsForm instructor={instructor} {...(saveInstructor ? { saveInstructor } : {})} />}
    </div>
  </section>;
}

function EmptyInstructorWorkspace({ activeTab, onOpenSettings, saveInstructor }: { readonly activeTab: WorkspaceTab; readonly onOpenSettings: () => void; readonly saveInstructor?: SaveInstructor }) {
  if (activeTab !== "설정") {
    return <section className="health-support-workspace health-support-workspace--empty" aria-labelledby="health-support-empty-title">
      <UsersRound aria-hidden="true" size={28} />
      <h2 id="health-support-empty-title">등록된 보건지원강사가 없습니다.</h2>
      <p>설정 탭에서 강사 정보와 운영 기준을 먼저 등록해 주세요.</p>
      <Button onClick={onOpenSettings}><Plus aria-hidden="true" size={16} />강사 정보 등록</Button>
    </section>;
  }

  return <section className="health-support-workspace health-support-workspace--empty" aria-labelledby="health-support-instructor-settings-title">
    <InstructorRegistrationForm {...(saveInstructor ? { saveInstructor } : {})} />
  </section>;
}

function InstructorRegistrationForm({ saveInstructor }: { readonly saveInstructor?: SaveInstructor }) {
  const [formError, setFormError] = useState<string>();
  const [formMessage, setFormMessage] = useState<string>();
  const today = localIsoDate();

  async function submitInstructor(formData: FormData): Promise<void> {
    if (!saveInstructor) {
      setFormError("강사 정보 저장 기능을 준비할 수 없습니다.");
      setFormMessage(undefined);
      return;
    }
    const result = await saveInstructor({ status: "idle" }, formData);
    if (result.status === "error") {
      setFormError(result.message ?? "강사 정보를 확인해 주세요.");
      setFormMessage(undefined);
      return;
    }
    setFormError(undefined);
    setFormMessage(result.message ?? "강사 정보가 저장되었습니다.");
  }

  return <div className="health-support-placeholder"><UsersRound aria-hidden="true" size={22} /><div><h3 id="health-support-instructor-settings-title">강사 운영 설정</h3><p>강사 정보와 운영 기준을 등록해 주세요.</p></div><form aria-label="강사 정보 등록" className="health-support-worklog-form" noValidate onSubmit={(event) => { event.preventDefault(); void submitInstructor(new FormData(event.currentTarget)); }}><label>강사명<input name="name" required /></label><label>담당 업무<input name="subject" required /></label><label>주당 운영 시간<input defaultValue="15" min="0" name="weeklyHours" required step="0.01" type="number" /></label><label>시간당 단가<input defaultValue="20000" min="0" name="hourlyRate" required step="0.01" type="number" /></label><label>월 보험료<input defaultValue="0" min="0" name="monthlyInsurance" required step="0.01" type="number" /></label><label>월 최대 시간<input defaultValue="60" min="0.01" name="monthlyHourLimit" required step="0.01" type="number" /></label><label>주 최대 시간<input defaultValue="15" min="0.01" name="weeklyHourLimit" required step="0.01" type="number" /></label><label>총 예산<input defaultValue="0" min="0" name="totalBudget" required step="0.01" type="number" /></label><label>운영 시작일<input defaultValue={today} name="operationStartDate" required type="date" /></label><label>운영 종료일<input defaultValue={today} name="operationEndDate" required type="date" /></label>{formError && <p className="form-message is-error" role="alert">{formError}</p>}{formMessage && <p className="form-message" role="status">{formMessage}</p>}<div><Button type="submit">강사 정보 저장</Button></div></form></div>;
}

type PaymentStatementPanelProps = {
  readonly documents: HealthSupportSettlementDocuments;
  readonly onPrint: () => void;
  readonly onTogglePreview: () => void;
  readonly printActive: boolean;
  readonly showPreview: boolean;
};

function PaymentStatementPanel({ documents, onPrint, onTogglePreview, printActive, showPreview }: PaymentStatementPanelProps) {
  const { paymentStatement } = documents;
  return <section aria-label="Payment statement document" className="health-support-dashboard health-support-document health-support-document--payment-statement">
    <h3>지급명세</h3>
    <p>{paymentStatement.month} · {paymentStatement.hours.toFixed(1)}시간 × {won(paymentStatement.hourlyRate)}</p>
    <div className="health-support-document__actions"><Button aria-label="Preview payment statement" onClick={onTogglePreview} variant="secondary">지급명세 미리보기</Button><Button aria-label="Print payment statement" onClick={onPrint} variant="secondary">지급명세 출력</Button></div>
    {(showPreview || printActive) && <section aria-labelledby="payment-statement-preview-title" className="health-support-dashboard__summary"><h3 aria-label="Payment statement preview" id="payment-statement-preview-title">지급명세 미리보기</h3><div><span>근무 시간</span><strong>{paymentStatement.hours.toFixed(1)}시간</strong></div><div><span>지급 금액</span><strong>{won(paymentStatement.amount)}</strong></div></section>}
  </section>;
}

type WorkLogPanelProps = { readonly calculation: ReturnType<typeof calculateHealthSupportInstructorManager>; readonly calendarEvents: readonly EventRow[]; readonly deleteWorkLog: DeleteWorkLog; readonly editingLog?: HealthSupportWorkLog; readonly formError?: string; readonly formMessage?: string; readonly instructor: HealthSupportInstructor; readonly logs: readonly HealthSupportWorkLog[]; readonly month: string; readonly onEdit: (log: HealthSupportWorkLog | undefined) => void; readonly onMonthChange: (month: string) => void; readonly onSubmit: (formData: FormData) => Promise<void> };

function workLogDraft(log?: HealthSupportWorkLog) {
  return { date: log?.date ?? localIsoDate(), endTime: log?.endTime.slice(0, 5) ?? "12:00", note: log?.note ?? "", startTime: log?.startTime.slice(0, 5) ?? "09:00" };
}

function CalendarAwareWorkLogPanel({ calculation, calendarEvents, deleteWorkLog, editingLog, formError, formMessage, instructor, logs, month, onEdit, onMonthChange, onSubmit }: WorkLogPanelProps) {
  const [draft, setDraft] = useState(() => workLogDraft(editingLog));
  const [importMessage, setImportMessage] = useState<string>();
  const [importPreview, setImportPreview] = useState<HealthSupportWorkLogImportPreview>();
  const filteredLogs = logs.filter((log) => log.date.startsWith(month));
  const draftHours = hoursFor({ ...editingLog, ...draft, id: editingLog?.id ?? "draft", instructorId: instructor.id });
  const hasValidDraftInterval = draft.startTime < draft.endTime;
  const monthHours = filteredLogs.reduce((total, log) => total + hoursFor(log), 0);
  const selectedWeekKey = calculation.workLogs.find((log) => log.date === draft.date)?.isoWeek.key;
  const selectedWeekHours = calculation.weeklyTotals.find((total) => total.isoWeekKey === selectedWeekKey)?.hours ?? 0;

  async function deleteLog(log: HealthSupportWorkLog): Promise<void> {
    const formData = new FormData();
    formData.set("id", log.id);
    await deleteWorkLog(formData);
    if (editingLog?.id === log.id) onEdit(undefined);
  }

  async function previewImport(file: File | undefined): Promise<void> {
    if (!file) return;
    const preview = parseHealthSupportWorkLogImport(await file.arrayBuffer(), { instructorId: instructor.id, existingLogs: logs });
    setImportPreview(preview);
    setImportMessage(preview.error ? "Excel 파일을 확인하세요." : undefined);
  }

  async function importSelectedRows(): Promise<void> {
    if (!importPreview) return;
    const plan = createHealthSupportWorkLogImportPlan(importPreview, "add");
    for (const candidate of plan.candidates) {
      const formData = new FormData();
      formData.set("instructorId", candidate.instructorId);
      formData.set("date", candidate.date);
      formData.set("startTime", candidate.startTime);
      formData.set("endTime", candidate.endTime);
      formData.set("note", candidate.note ?? "");
      await onSubmit(formData);
    }
    setImportMessage(`${plan.candidates.length}건의 가져오기 요청을 완료했습니다.`);
  }

  const importPlan = importPreview ? createHealthSupportWorkLogImportPlan(importPreview, "add") : undefined;

  return <div className="health-support-records"><form aria-label="근무 기록 추가" className="health-support-worklog-form" noValidate onSubmit={(event) => { event.preventDefault(); void onSubmit(new FormData(event.currentTarget)); }}><input name="id" type="hidden" value={editingLog?.id ?? ""} /><input name="instructorId" type="hidden" value={instructor.id} /><label>근무 일자<input name="date" onChange={(event) => setDraft({ ...draft, date: event.target.value })} required type="date" value={draft.date} /></label><label>시작 시간<input name="startTime" onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} required type="time" value={draft.startTime} /></label><label>종료 시간<input aria-describedby={formError ? "work-log-error" : undefined} name="endTime" onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} required type="time" value={draft.endTime} /></label><output aria-label="Draft hours">{hasValidDraftInterval ? `${draftHours.toFixed(1)}시간` : "유효한 시간을 입력하세요"}</output><label className="health-support-worklog-form__note">메모<textarea name="note" onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="선택 입력" rows={2} value={draft.note} /></label><HealthSupportCalendarContext events={calendarEvents} note={draft.note} onNoteChange={(note) => setDraft({ ...draft, note })} onTimeChange={(time) => setDraft({ ...draft, ...time })} recentLogs={logs} selectedDate={draft.date} />{formError && <p className="form-message is-error" id="work-log-error" role="alert">{formError}</p>}{formMessage && <p className="form-message" role="status">{formMessage}</p>}<div><Button disabled={!hasValidDraftInterval} type="submit">{editingLog ? "근무 기록 수정" : "근무 기록 추가"}</Button>{editingLog && <Button onClick={() => onEdit(undefined)} variant="secondary">취소</Button>}</div></form><section aria-label="Work log summaries" className="health-support-record-list"><label>기록 월<input aria-label="Work log month" onChange={(event) => onMonthChange(event.target.value)} type="month" value={month} /></label><div><span>선택 월 합계</span><strong>{monthHours.toFixed(1)}시간</strong></div><div><span>선택 주 합계</span><strong>{selectedWeekHours.toFixed(1)}시간</strong></div><div><span>선택 월 기록</span><strong>{filteredLogs.length}건</strong></div></section><section aria-labelledby="recent-work-log-title" className="health-support-record-list"><div><h3 id="recent-work-log-title">최근 기록</h3><label className="button button--secondary">Excel 근무기록 가져오기<input accept=".xlsx,.xls" aria-label="Excel work log import" hidden onChange={(event) => { void previewImport(event.target.files?.[0]); }} type="file" /></label></div>{importPlan && <div role="status"><p>{importPlan.candidates.length}건을 가져올 수 있습니다.</p>{importPlan.candidates.length > 0 && <Button aria-label={`${importPlan.candidates.length}건 가져오기`} onClick={() => { void importSelectedRows(); }} type="button">{importPlan.candidates.length}건 가져오기</Button>}</div>}{importMessage && <p role="status">{importMessage}</p>}{filteredLogs.length === 0 ? <p>선택한 월의 근무기록이 없습니다.</p> : <ul>{filteredLogs.map((log) => <li key={log.id}><div><strong>{log.date}</strong><span>{log.startTime.slice(0, 5)}–{log.endTime.slice(0, 5)} · {hoursFor(log).toFixed(1)}시간</span></div><div><Button aria-label={`${log.date} 기록 수정`} onClick={() => onEdit(log)} variant="ghost">수정</Button><Button aria-label={`${log.date} 기록 삭제`} onClick={() => { void deleteLog(log); }} variant="ghost">삭제</Button></div></li>)}</ul>}</section></div>;
}
