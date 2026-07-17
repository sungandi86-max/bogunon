"use client";

import { CalendarDays, ClipboardList, GitBranch, Home, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["브리핑", "/briefing", Home],
  ["업무함", "/tasks", ClipboardList],
  ["일정", "/calendar", CalendarDays],
  ["업무 절차", "/workflows", GitBranch],
  ["설정", "/settings", Settings],
] as const;

export function MobileBottomNavigation() {
  const pathname = usePathname();
  return (
    <nav className="mobile-navigation" aria-label="모바일 주요 메뉴">
      {links.map(([label, href, Icon]) => (
        <Link aria-current={pathname.startsWith(href) ? "page" : undefined} href={href} key={href}>
          <Icon aria-hidden="true" size={22} strokeWidth={1.9} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
