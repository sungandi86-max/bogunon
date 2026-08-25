"use client";

import { CalendarDays, CalendarPlus, ChevronDown, ClipboardList, Dumbbell, FilePenLine, FileSpreadsheet, FolderKanban, Home, LayoutGrid, ListPlus, Package, Plus, Settings, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BogunonBrand } from "@/components/brand/bogunon-brand";
import { SidebarOtter } from "@/components/layout/sidebar-otter";
import type { Notice } from "@/lib/notices/model";

const navigationGroups = [
  { label: "일정", links: [
    ["오늘", "/briefing", Home],
    ["캘린더", "/calendar", CalendarDays],
    ["연간 계획", "/annual", LayoutGrid],
    ["실무 일정", "/practical-schedules", ClipboardList],
    ["프로젝트", "/projects", FolderKanban],
  ] },
  { label: "기록", links: [
    ["운동 기록", "/exercise", Dumbbell],
    ["보건지원강사 관리", "/health-support-instructors", UsersRound],
    ["의약품 관리", "/medications", Package],
  ] },
  { label: "도구", links: [
    ["생기부 도우미", "/ai-writer", FilePenLine],
  ] },
] as const;

const settingsGroup = { label: "설정", links: [["설정", "/settings", Settings]] } as const;

interface GlobalNavigationProps {
  readonly notices?: readonly Notice[];
  readonly onAcademicImport: (trigger: HTMLButtonElement) => void;
  readonly onCreate: (trigger: HTMLButtonElement, kind?: "task" | "event") => void;
}

export function GlobalNavigation({ notices = [], onAcademicImport, onCreate }: GlobalNavigationProps) {
  const pathname = usePathname();

  return (
    <aside aria-label="데스크톱 앱 메뉴" className="global-navigation">
      <div className="global-navigation__inner">
        <BogunonBrand className="wordmark" priority />
        <details className="sidebar-create-menu">
          <summary className="button button--primary sidebar-create" role="button"><Plus aria-hidden="true" size={18} />새로 만들기<ChevronDown aria-hidden="true" className="sidebar-create__chevron" size={15} /></summary>
          <div className="sidebar-create-popover">
            <button aria-label="일정 만들기" onClick={(event) => onCreate(event.currentTarget, "event")} type="button"><CalendarPlus aria-hidden="true" size={17} /><span><strong>일정 만들기</strong><small>시간이 정해진 일정을 등록합니다.</small></span></button>
            <button aria-label="학사일정 가져오기" onClick={(event) => onAcademicImport(event.currentTarget)} type="button"><FileSpreadsheet aria-hidden="true" size={17} /><span><strong>학사일정 가져오기</strong><small>NEIS 또는 엑셀·CSV로 등록합니다.</small></span></button>
            <button aria-label="빠른 입력" onClick={(event) => onCreate(event.currentTarget, "task")} type="button"><ListPlus aria-hidden="true" size={17} /><span><strong>빠른 입력</strong><small>문장으로 업무를 정리합니다.</small></span></button>
          </div>
        </details>
        <nav className="desktop-navigation" aria-label="주요 메뉴">
          {navigationGroups.map((group) => <div className="navigation-group" key={group.label}><p>{group.label}</p>{group.links.map(([label, href, Icon]) => <Link aria-current={pathname.startsWith(href) ? "page" : undefined} href={href} key={href}><Icon aria-hidden="true" size={18} />{label}</Link>)}</div>)}
        </nav>
        <div className="global-navigation__footer">
          <div className="navigation-group"><p>{settingsGroup.label}</p>{settingsGroup.links.map(([label, href, Icon]) => <Link aria-current={pathname.startsWith(href) ? "page" : undefined} href={href} key={href}><Icon aria-hidden="true" size={18} />{label}</Link>)}</div>
          <SidebarOtter notices={notices} />
        </div>
      </div>
    </aside>
  );
}
