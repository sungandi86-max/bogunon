"use client";

import { CalendarDays, CalendarPlus, ChevronDown, ClipboardList, Dumbbell, FilePenLine, FolderKanban, GitBranch, Home, LayoutGrid, LibraryBig, ListPlus, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AuthProfile } from "@/lib/auth/profile";
import type { AssistantSurface } from "@/components/ai/assistant-context";

const navigationGroups = [
  { label: "보건업무", links: [
    ["오늘", "/briefing", Home],
    ["업무", "/tasks", ClipboardList],
    ["업무 절차", "/workflows", GitBranch],
    ["캘린더", "/calendar", CalendarDays],
    ["연간 계획", "/annual", LayoutGrid],
    ["업무 템플릿", "/templates", LibraryBig],
  ] },
  { label: "나의 기록", links: [
    ["운동", "/exercise", Dumbbell],
    ["프로젝트", "/projects", FolderKanban],
  ] },
  { label: "설정", links: [["설정", "/settings", Settings]] },
] as const;

interface GlobalNavigationProps {
  readonly onAssistant: (trigger: HTMLButtonElement, surface?: AssistantSurface) => void;
  readonly onCreate: (trigger: HTMLButtonElement, kind?: "task" | "event") => void;
  readonly profile: AuthProfile;
}

export function GlobalNavigation({ onAssistant, onCreate, profile }: GlobalNavigationProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [profileOpen]);

  return (
    <aside aria-label="데스크톱 앱 메뉴" className="global-navigation">
      <div className="global-navigation__inner">
        <Link className="wordmark" href="/briefing" aria-label="보건온 브리핑">
          <span className="wordmark__symbol" aria-hidden="true">온</span>
          보건온
        </Link>
        <details className="sidebar-create-menu">
          <summary className="button button--primary sidebar-create" role="button"><Plus aria-hidden="true" size={18} />새로 만들기<ChevronDown aria-hidden="true" className="sidebar-create__chevron" size={15} /></summary>
          <div className="sidebar-create-popover">
            <button aria-label="업무 만들기" onClick={(event) => onCreate(event.currentTarget, "task")} type="button"><ClipboardList aria-hidden="true" size={17} /><span><strong>업무 만들기</strong><small>업무와 마감일을 등록합니다.</small></span></button>
            <button aria-label="일정 만들기" onClick={(event) => onCreate(event.currentTarget, "event")} type="button"><CalendarPlus aria-hidden="true" size={17} /><span><strong>일정 만들기</strong><small>시간이 정해진 일정을 등록합니다.</small></span></button>
            <Link href="/workflows"><GitBranch aria-hidden="true" size={17} /><span><strong>업무 절차 시작</strong><small>단계가 있는 업무를 시작합니다.</small></span></Link>
            <button aria-label="빠른 입력" onClick={(event) => onCreate(event.currentTarget, "task")} type="button"><ListPlus aria-hidden="true" size={17} /><span><strong>빠른 입력</strong><small>문장으로 업무를 정리합니다.</small></span></button>
            <button aria-label="작성 도움" onClick={(event) => onAssistant(event.currentTarget, "global")} type="button"><FilePenLine aria-hidden="true" size={17} /><span><strong>작성 도움</strong><small>내용과 체크리스트를 제안받습니다.</small></span></button>
          </div>
        </details>
        <nav className="desktop-navigation" aria-label="주요 메뉴">
          {navigationGroups.map((group) => <div className="navigation-group" key={group.label}><p>{group.label}</p>{group.links.map(([label, href, Icon]) => <Link aria-current={pathname.startsWith(href) ? "page" : undefined} href={href} key={href}><Icon aria-hidden="true" size={18} />{label}</Link>)}</div>)}
        </nav>
        <div className="global-navigation__actions">
          <span className="sync-status"><span className="sync-status__dot" />동기화됨</span>
          <div className="profile-menu" ref={profileRef}>
            <button
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="프로필 메뉴"
              className="profile-button"
              onClick={() => setProfileOpen((current) => !current)}
              type="button"
            >{profile.initial}</button>
            {profileOpen && (
              <div className="profile-popover" role="menu">
                <p><strong>Google 계정</strong><span>{profile.email}</span></p>
                <Link href="/settings" role="menuitem">설정</Link>
                <form action="/auth/logout" method="post">
                  <button role="menuitem" type="submit">로그아웃</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
