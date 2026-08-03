"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, type MouseEvent, type ReactNode, use, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { removeCalendarStickerAction } from "@/app/(app)/calendar-sticker-actions";
import { removeExerciseStickerAction } from "@/app/(app)/exercise-sticker-actions";
import { deleteWorkItemAction } from "@/app/(app)/work-item-actions";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
import type { EventRow } from "@/types/database";

type StickerRecordType = "calendar" | "event" | "exercise";
type StickerPanelStyle = CSSProperties & {
  "--sticker-popover-left": string;
  "--sticker-popover-top": string;
};

interface StickerManagementButtonProps {
  readonly children: ReactNode;
  readonly date: string;
  readonly event?: EventRow;
  readonly label: string;
  readonly recordId: string;
  readonly recordType: StickerRecordType;
}

const idleState = { status: "idle" as const };
const focusableSelector = "button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])";

function dateLabel(date: string): string {
  const [, month = "", day = ""] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

function eventTimeLabel(event: EventRow | undefined): string | null {
  if (!event) return null;
  if (event.is_all_day || !event.start_time) return "종일";
  const start = event.start_time.slice(0, 5);
  return event.end_time ? `${start}–${event.end_time.slice(0, 5)}` : start;
}

export function StickerManagementButton({ children, date, event, label, recordId, recordType }: StickerManagementButtonProps) {
  const router = useRouter();
  const createContext = use(AppShellCreateContext);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const removeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const appliedDate = dateLabel(date);
  const appliedTime = eventTimeLabel(event);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const returnFocusTarget = triggerRef.current;
    const dateCell = returnFocusTarget?.closest(".full-calendar__cell, .smart-week__day, .exercise-calendar-day");
    const fallbackFocusTarget = dateCell?.querySelector<HTMLElement>(
      ".calendar-date-button, .smart-week__date, .exercise-calendar-day__date",
    );
    removeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (returnFocusTarget?.isConnected) returnFocusTarget.focus();
      else fallbackFocusTarget?.focus();
    };
  }, [close, open]);

  if (removed) return null;

  const openManagement = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const panelWidth = 288;
    const left = Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - panelWidth - 16));
    const top = rect.bottom + 8 + 250 > window.innerHeight ? Math.max(16, rect.top - 258) : rect.bottom + 8;
    setPosition({ left, top });
    setMessage("");
    setOpen(true);
  };

  const removeSticker = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const formData = new FormData();
    if (recordType === "calendar") formData.set("stickerId", recordId);
    else if (recordType === "exercise") formData.set("logId", recordId);
    else {
      formData.set("id", recordId);
      formData.set("kind", "event");
    }
    setPending(true);
    try {
      const result = recordType === "calendar"
        ? await removeCalendarStickerAction(idleState, formData)
        : recordType === "exercise"
          ? await removeExerciseStickerAction(idleState, formData)
          : (await deleteWorkItemAction(formData), { status: "success" as const });
      if (result.status === "error") {
        setMessage(result.message ?? "스티커를 제거하지 못했습니다.");
        return;
      }
      setRemoved(true);
      setOpen(false);
      router.refresh();
    } catch (error: unknown) {
      setMessage(error instanceof Error && error.message
        ? error.message
        : "스티커를 제거하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  };

  const panelStyle: StickerPanelStyle = {
    "--sticker-popover-left": `${position.left}px`,
    "--sticker-popover-top": `${position.top}px`,
  };

  return <>
    <button
      aria-haspopup="dialog"
      aria-label={`${appliedDate} ${label}${recordType === "exercise" ? " 운동" : ""} 스티커 관리`}
      className="calendar-sticker-management__trigger"
      onClick={openManagement}
      onDragStart={(event) => {
        if (recordType !== "event") {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      ref={triggerRef}
      type="button"
    >
      {children}
    </button>
    {open && createPortal(
      <div className="calendar-sticker-management__overlay" onMouseDown={close} role="presentation">
        <section
          aria-labelledby={titleId}
          aria-modal="true"
          className="calendar-sticker-management__panel"
          onMouseDown={(event) => event.stopPropagation()}
          ref={panelRef}
          role="dialog"
          style={panelStyle}
        >
          <header>
            <h2 id={titleId}>스티커 관리</h2>
            <button aria-label="스티커 관리 닫기" onClick={close} type="button"><X aria-hidden="true" size={18} /></button>
          </header>
          <div className="calendar-sticker-management__preview">{children}</div>
          <strong>{label}</strong>
          <time dateTime={date}>{appliedDate}</time>
          {appliedTime && <span className="calendar-sticker-management__time">{appliedTime}</span>}
          {message && <p aria-live="polite" className="form-message">{message}</p>}
          {recordType === "event" && event && createContext?.openEdit && <button className="button button--secondary" onClick={() => {
            const trigger = triggerRef.current;
            if (!trigger) return;
            close();
            createContext.openEdit?.(trigger, event);
          }} type="button">일정 수정</button>}
          <button className="calendar-sticker-management__remove" disabled={pending} onClick={removeSticker} ref={removeRef} type="button">
            {pending ? "제거 중…" : "스티커 제거"}
          </button>
          <button className="calendar-sticker-management__close" onClick={close} type="button">닫기</button>
        </section>
      </div>,
      document.body,
    )}
  </>;
}
