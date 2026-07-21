"use client";

import { CalendarDays, CalendarPlus, ClipboardList, Dumbbell, Home, Plus, Settings, Sticker, StickyNote } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import type { TemplateDefinition } from "@/lib/work-items/workflow";

const links = [
  ["오늘", "/briefing", Home],
  ["연간", "/annual", ClipboardList],
  ["일정", "/calendar", CalendarDays],
  ["운동", "/exercise", Dumbbell],
  ["설정", "/settings", Settings],
] as const;

interface MobileBottomNavigationProps {
  readonly onCreate: (trigger: HTMLButtonElement, kind: "task" | "event", template?: TemplateDefinition) => void;
}

const mobileScheduleTemplate = {
  key: "mobile-schedule",
  name: "모바일 일정",
  kind: "event",
  area: "schoolSchedule",
  category: "event",
  title: "",
  description: "",
  priority: "normal",
  estimatedMinutes: 30,
  recommendedTiming: "선택한 날짜",
  recurrenceFrequency: null,
  checklist: [],
  memo: "",
  isAllDay: false,
} as const satisfies TemplateDefinition;

const mobileQuickMemoTemplate = {
  ...mobileScheduleTemplate,
  key: "mobile-quick-memo",
  name: "빠른 메모",
  area: "personal",
  isAllDay: true,
} as const satisfies TemplateDefinition;

export function MobileBottomNavigation({ onCreate }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  function chooseCreate(trigger: HTMLButtonElement, kind: "task" | "event", template?: TemplateDefinition): void {
    setCreateMenuOpen(false);
    onCreate(launcherRef.current ?? trigger, kind, template);
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
          <button onClick={(event) => chooseCreate(event.currentTarget, "event", mobileScheduleTemplate)} type="button"><CalendarPlus aria-hidden="true" size={20} /><span><strong>일정 추가</strong><small>학교 일정 또는 개인 일정을 등록합니다.</small></span></button>
          <Link href="/exercise?create=sticker" onClick={() => setCreateMenuOpen(false)}><Dumbbell aria-hidden="true" size={20} /><span><strong>운동 기록</strong><small>운동, 레슨, 대회 기록을 남깁니다.</small></span></Link>
          <Link href="/calendar?create=sticker" onClick={() => setCreateMenuOpen(false)}><Sticker aria-hidden="true" size={20} /><span><strong>날짜 스티커 붙이기</strong><small>학교 일정이나 개인 약속을 날짜에 간단히 표시합니다.</small></span></Link>
          <button onClick={(event) => chooseCreate(event.currentTarget, "event", mobileQuickMemoTemplate)} type="button"><StickyNote aria-hidden="true" size={20} /><span><strong>빠른 메모</strong><small>떠오른 내용을 간단히 기록합니다.</small></span></button>
        </div>
      </ResponsiveDetailPanel>
    </>
  );
}
