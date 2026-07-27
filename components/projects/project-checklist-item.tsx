"use client";

import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { checklistDueStatus } from "@/lib/projects/checklist";
import type { ProjectChecklistItemRow } from "@/types/database";

const dueLabels = {
  overdue: "지남",
  today: "오늘 마감",
  upcoming: "예정",
} as const;

interface Props {
  readonly busy: boolean;
  readonly desktopDragEnabled: boolean;
  readonly dragging: boolean;
  readonly first: boolean;
  readonly item: ProjectChecklistItemRow;
  readonly last: boolean;
  readonly onDelete: () => Promise<void>;
  readonly onDragStart: () => void;
  readonly onDrop: () => void;
  readonly onMove: (offset: -1 | 1) => void;
  readonly onUpdate: (
    changes: { readonly title?: string; readonly isCompleted?: boolean; readonly dueDate?: string | null },
  ) => Promise<boolean>;
  readonly today: string;
}

export function ProjectChecklistItem({
  busy,
  desktopDragEnabled,
  dragging,
  first,
  item,
  last,
  onDelete,
  onDragStart,
  onDrop,
  onMove,
  onUpdate,
  today,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [dueDate, setDueDate] = useState(item.due_date ?? "");
  const dueStatus = checklistDueStatus(item.due_date, today);

  async function saveEdit(): Promise<void> {
    const saved = await onUpdate({ title, dueDate: dueDate || null });
    if (saved) setEditing(false);
  }

  return (
    <li
      className={`project-checklist-item${item.is_completed ? " is-completed" : ""}${dragging ? " is-dragging" : ""}`}
      draggable={desktopDragEnabled && !busy && !editing}
      onDragEnd={() => onDrop()}
      onDragOver={(event) => {
        if (desktopDragEnabled) event.preventDefault();
      }}
      onDragStart={onDragStart}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      <span className="project-checklist-item__drag" title="끌어서 순서 변경">
        <GripVertical aria-hidden="true" size={17} />
      </span>
      <label className="project-checklist-item__check">
        <input
          aria-label={`${item.title} 완료`}
          checked={item.is_completed}
          disabled={busy}
          onChange={() => void onUpdate({ isCompleted: !item.is_completed })}
          type="checkbox"
        />
        <span aria-hidden="true"><Check size={14} /></span>
      </label>
      {editing ? (
        <div className="project-checklist-item__edit">
          <label>
            <span className="sr-only">체크리스트 제목 수정</span>
            <input
              aria-label="체크리스트 제목 수정"
              disabled={busy}
              maxLength={300}
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </label>
          <label className="project-checklist-item__date-input">
            <CalendarClock aria-hidden="true" size={15} />
            <span className="sr-only">마감일 수정</span>
            <input
              aria-label="마감일 수정"
              disabled={busy}
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              value={dueDate}
            />
          </label>
          <button className="button button--primary" disabled={busy || !title.trim()} onClick={() => void saveEdit()} type="button">수정 저장</button>
          <button
            aria-label="수정 취소"
            className="icon-button"
            disabled={busy}
            onClick={() => {
              setTitle(item.title);
              setDueDate(item.due_date ?? "");
              setEditing(false);
            }}
            type="button"
          ><X aria-hidden="true" size={16} /></button>
        </div>
      ) : (
        <>
          <div className="project-checklist-item__content">
            <span>{item.title}</span>
            {item.due_date && (
              <small className={`project-checklist-item__due is-${dueStatus}`}>
                <CalendarClock aria-hidden="true" size={13} />
                <time dateTime={item.due_date}>{item.due_date.slice(5).replace("-", ".")}</time>
                {dueStatus !== "none" && <strong>{dueLabels[dueStatus]}</strong>}
              </small>
            )}
          </div>
          <div className="project-checklist-item__mobile-order">
            <button aria-label={`${item.title} 위로 이동`} disabled={busy || first} onClick={() => onMove(-1)} type="button"><ChevronUp aria-hidden="true" size={16} /></button>
            <button aria-label={`${item.title} 아래로 이동`} disabled={busy || last} onClick={() => onMove(1)} type="button"><ChevronDown aria-hidden="true" size={16} /></button>
          </div>
          <div className="project-checklist-item__actions">
            <button aria-label={`${item.title} 수정`} disabled={busy} onClick={() => setEditing(true)} type="button"><Pencil aria-hidden="true" size={16} /></button>
            <button aria-label={`${item.title} 삭제`} className="danger-text" disabled={busy} onClick={() => void onDelete()} type="button"><Trash2 aria-hidden="true" size={16} /></button>
          </div>
        </>
      )}
    </li>
  );
}
