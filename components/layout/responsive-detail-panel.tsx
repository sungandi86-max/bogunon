"use client";

import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

interface ResponsiveDetailPanelProps {
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly open: boolean;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
  readonly title: string;
}

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function ResponsiveDetailPanel({
  children,
  footer,
  initialFocusRef,
  onClose,
  open,
  returnFocusRef,
  title,
}: ResponsiveDetailPanelProps) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("overlay-open");
    const returnFocusTarget = returnFocusRef?.current;
    const focusTarget = initialFocusRef?.current ?? panelRef.current;
    focusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
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
      document.body.classList.remove("overlay-open");
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusTarget?.focus();
    };
  }, [initialFocusRef, onClose, open, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <aside
        aria-labelledby="detail-panel-title"
        aria-modal="true"
        className="detail-panel"
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="detail-panel__header">
          <h2 id="detail-panel-title">{title}</h2>
          <Button aria-label="패널 닫기" iconOnly onClick={onClose} variant="ghost">
            <X aria-hidden="true" size={20} />
          </Button>
        </header>
        <div className="detail-panel__body">{children}</div>
        {footer && <footer className="detail-panel__footer">{footer}</footer>}
      </aside>
    </div>
  );
}
