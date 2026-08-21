"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { markNoticeReadAction } from "@/app/(app)/notices/actions";
import { Button } from "@/components/ui/button";
import type { Notice } from "@/lib/notices/model";
import { NOTICE_CATEGORY_LABELS, noticeSummary, unreadBadge } from "@/lib/notices/model";

const focusableSelector = "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

export function SidebarOtter({ notices = [] }: { readonly notices?: readonly Notice[] }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const unread = notices.filter((notice) => !notice.isRead && !readIds.has(notice.id));
  const latest = unread[0];
  const closeDetail = useCallback(() => { setDetailOpen(false); setActiveNotice(null); }, []);
  const openDetail = () => {
    if (!latest) return;
    const selected = latest;
    setActiveNotice(selected);
    setDetailOpen(true);
    setReadIds((current) => new Set(current).add(selected.id));
    const data = new FormData();
    data.set("id", selected.id);
    void markNoticeReadAction(data).catch(() => {
      setReadIds((current) => {
        const next = new Set(current);
        next.delete(selected.id);
        return next;
      });
    });
  };

  useEffect(() => {
    if (!detailOpen) return;
    const trigger = triggerRef.current;
    document.body.classList.add("overlay-open");
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetail();
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
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("overlay-open");
      document.removeEventListener("keydown", closeOnEscape);
      trigger?.focus();
    };
  }, [closeDetail, detailOpen]);

  const modal = detailOpen && activeNotice ? createPortal(
    <div className="notice-detail-overlay" data-testid="notice-detail-overlay" onMouseDown={closeDetail} role="presentation">
      <section aria-labelledby={titleId} aria-modal="true" className="notice-detail-modal" onMouseDown={(event) => event.stopPropagation()} ref={panelRef} role="dialog">
        <header className="notice-detail-modal__header">
          <div>
            <span>{NOTICE_CATEGORY_LABELS[activeNotice.category]}{activeNotice.isImportant ? " · 중요 공지" : ""}</span>
            <h2 id={titleId}>{activeNotice.title}</h2>
          </div>
          <Button aria-label="공지 상세 닫기" iconOnly onClick={closeDetail} ref={closeRef} variant="ghost"><X aria-hidden="true" size={20} /></Button>
        </header>
        <div className="notice-detail-modal__body"><p>{activeNotice.content}</p></div>
        <footer className="notice-detail-modal__footer">
          <time dateTime={activeNotice.publishStartAt ?? activeNotice.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(activeNotice.publishStartAt ?? activeNotice.createdAt))}</time>
          <Button onClick={closeDetail} variant="secondary">확인</Button>
        </footer>
      </section>
    </div>,
    document.body,
  ) : null;

  return <section aria-label="수다리 공지" className="sidebar-otter">
    {latest ? <button aria-haspopup="dialog" aria-label={`${latest.title} 공지 상세 열기`} className="sidebar-otter__notice" onClick={openDetail} ref={triggerRef} type="button"><strong>{latest.title}</strong><p>{noticeSummary(latest)}</p><span aria-label={`읽지 않은 공지 ${unread.length}개`}>{unreadBadge(unread.length)}</span></button> : <div className="sidebar-otter__notice"><p>새로운 공지가 없습니다.</p></div>}
    <div className="sidebar-otter__mascot"><Image alt="수다리" height={1024} sizes="(max-width: 1023px) 64px, 390px" src="/images/sidebar-otter.png" width={1536} /></div>
    {modal}
  </section>;
}
