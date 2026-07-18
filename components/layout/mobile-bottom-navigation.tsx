"use client";

import { CalendarDays, CalendarPlus, ClipboardList, Dumbbell, FilePenLine, GitBranch, Home, Plus, Settings, StickyNote } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";

const links = [
  ["오늘", "/briefing", Home],
  ["업무", "/tasks", ClipboardList],
  ["일정", "/calendar", CalendarDays],
  ["업무 절차", "/workflows", GitBranch],
  ["설정", "/settings", Settings],
] as const;

interface MobileBottomNavigationProps {
  readonly onAssistant: (trigger: HTMLButtonElement) => void;
  readonly onCreate: (trigger: HTMLButtonElement, kind: "task" | "event") => void;
}

export function MobileBottomNavigation({ onAssistant, onCreate }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  function chooseCreate(trigger: HTMLButtonElement, kind: "task" | "event"): void {
    setCreateMenuOpen(false);
    onCreate(launcherRef.current ?? trigger, kind);
  }

  function chooseAssistant(trigger: HTMLButtonElement): void {
    setCreateMenuOpen(false);
    onAssistant(launcherRef.current ?? trigger);
  }

  return (
    <>
      <nav className="mobile-navigation" aria-label="모바일 주요 메뉴">
        <div className="mobile-navigation__links">
          {links.map(([label, href, Icon]) => (
            <Link aria-current={pathname.startsWith(href) ? "page" : undefined} href={href} key={href}>
              <Icon aria-hidden="true" size={22} strokeWidth={1.9} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
        <button
          aria-expanded={createMenuOpen}
          aria-haspopup="dialog"
          aria-label="빠른 새로 만들기"
          className="mobile-create-fab"
          onClick={() => setCreateMenuOpen(true)}
          ref={launcherRef}
          type="button"
        >
          <Plus aria-hidden="true" size={25} strokeWidth={2.1} />
        </button>
      </nav>
      <ResponsiveDetailPanel
        onClose={() => setCreateMenuOpen(false)}
        open={createMenuOpen}
        returnFocusRef={launcherRef}
        title="새로 만들기"
      >
        <div className="mobile-create-menu">
          <button onClick={(event) => chooseCreate(event.currentTarget, "task")} type="button"><ClipboardList aria-hidden="true" size={20} /><span><strong>업무 추가</strong><small>할 일과 마감일을 정리합니다.</small></span></button>
          <button onClick={(event) => chooseCreate(event.currentTarget, "event")} type="button"><CalendarPlus aria-hidden="true" size={20} /><span><strong>일정 추가</strong><small>날짜와 시간이 있는 일정을 등록합니다.</small></span></button>
          <Link href="/exercise?create=sticker" onClick={() => setCreateMenuOpen(false)}><Dumbbell aria-hidden="true" size={20} /><span><strong>운동 스티커 붙이기</strong><small>오늘 한 운동을 한 번의 탭으로 남깁니다.</small></span></Link>
          <Link href="/workflows" onClick={() => setCreateMenuOpen(false)}><GitBranch aria-hidden="true" size={20} /><span><strong>업무 절차 시작</strong><small>단계가 있는 보건업무를 시작합니다.</small></span></Link>
          <Link href="/briefing#quick-note" onClick={() => setCreateMenuOpen(false)}><StickyNote aria-hidden="true" size={20} /><span><strong>빠른 메모</strong><small>떠오른 내용을 바로 정리합니다.</small></span></Link>
          <button onClick={(event) => chooseAssistant(event.currentTarget)} type="button"><FilePenLine aria-hidden="true" size={20} /><span><strong>작성 도움</strong><small>내용과 체크리스트 제안을 확인합니다.</small></span></button>
        </div>
      </ResponsiveDetailPanel>
    </>
  );
}
