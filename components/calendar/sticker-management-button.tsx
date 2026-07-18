"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, type MouseEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { removeCalendarStickerAction } from "@/app/(app)/calendar-sticker-actions";
import { removeExerciseStickerAction } from "@/app/(app)/exercise-sticker-actions";

type StickerRecordType = "calendar" | "exercise";
type StickerPanelStyle = CSSProperties & {
  "--sticker-popover-left": string;
  "--sticker-popover-top": string;
};

interface StickerManagementButtonProps {
  readonly children: ReactNode;
  readonly date: string;
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

export function StickerManagementButton({ children, date, label, recordId, recordType }: StickerManagementButtonProps) {
  const router = useRouter();
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
    formData.set(recordType === "calendar" ? "stickerId" : "logId", recordId);
    setPending(true);
    try {
      const result = recordType === "calendar"
        ? await removeCalendarStickerAction(idleState, formData)
        : await removeExerciseStickerAction(idleState, formData);
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
      onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }}
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
          {message && <p aria-live="polite" className="form-message">{message}</p>}
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
