"use client";

import { CalendarDays, ClipboardList, Dumbbell, FolderKanban, Home, LayoutGrid, LibraryBig, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AuthProfile } from "@/lib/auth/profile";

const links = [
  ["브리핑", "/briefing", Home],
  ["업무", "/tasks", ClipboardList],
  ["캘린더", "/calendar", CalendarDays],
  ["연간 업무", "/annual", LayoutGrid],
  ["템플릿", "/templates", LibraryBig],
  ["운동", "/exercise", Dumbbell],
  ["프로젝트", "/projects", FolderKanban],
  ["설정", "/settings", Settings],
] as const;

interface GlobalNavigationProps {
  readonly onCreate: (trigger: HTMLButtonElement) => void;
  readonly profile: AuthProfile;
}

export function GlobalNavigation({ onCreate, profile }: GlobalNavigationProps) {
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
        <Button className="sidebar-create" onClick={(event) => onCreate(event.currentTarget)}>
          <Plus aria-hidden="true" size={18} />새로 만들기
        </Button>
        <nav className="desktop-navigation" aria-label="주요 메뉴">
          {links.map(([label, href, Icon]) => (
            <Link aria-current={pathname.startsWith(href) ? "page" : undefined} href={href} key={href}>
              <Icon aria-hidden="true" size={18} />
              {label}
            </Link>
          ))}
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
