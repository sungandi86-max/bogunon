"use client";

import { CalendarPlus, Check, FilePenLine, Plus, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { convertQuickNoteToEventAction, createQuickNoteAction, deleteQuickNoteAction, toggleQuickNoteAction } from "@/app/(app)/briefing/operations-rail-actions";
import type { TaskRow } from "@/types/database";

function SaveButton() {
  const { pending } = useFormStatus();
  return <button aria-label="메모 저장" disabled={pending} type="submit"><Plus aria-hidden="true" size={17} />{pending ? "저장 중" : "저장"}</button>;
}

export function QuickMemoCard({ notes, today }: { readonly notes: readonly TaskRow[]; readonly today: string }) {
  return <section className="quick-note school-daily-card" id="quick-note" aria-labelledby="quick-note-title">
    <div className="rail-heading"><div><span className="rail-kicker">바로 기록</span><h2 id="quick-note-title">빠른 메모</h2></div><FilePenLine aria-hidden="true" size={17} /></div>
    <p>떠오른 내용을 바로 기록하세요.</p>
    <form action={createQuickNoteAction} className="quick-memo-form"><input aria-label="빠른 메모 내용" autoComplete="off" maxLength={120} name="title" placeholder="메모를 입력하세요" required /><SaveButton /></form>
    {notes.length > 0 ? <ul className="quick-memo-list">{notes.slice(0, 3).map((note) => <li key={note.id}><span className={note.status === "completed" ? "is-completed" : undefined}>{note.title}</span><div><form action={toggleQuickNoteAction}><input name="id" type="hidden" value={note.id} /><button aria-label={`${note.title} ${note.status === "completed" ? "완료 취소" : "완료"}`} type="submit"><Check aria-hidden="true" size={14} /></button></form><form action={convertQuickNoteToEventAction}><input name="id" type="hidden" value={note.id} /><input name="date" type="hidden" value={today} /><button aria-label={`${note.title} 일정으로 전환`} type="submit"><CalendarPlus aria-hidden="true" size={14} /></button></form><form action={deleteQuickNoteAction}><input name="id" type="hidden" value={note.id} /><button aria-label={`${note.title} 삭제`} type="submit"><Trash2 aria-hidden="true" size={14} /></button></form></div></li>)}</ul> : <p className="rail-empty">아직 작성한 메모가 없습니다.</p>}
  </section>;
}
