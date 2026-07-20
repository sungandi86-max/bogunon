"use client";

import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { AuthProfile } from "@/lib/auth/profile";

export function UserMenu({ profile }: { readonly profile: AuthProfile }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [open]);

  return <div className="profile-menu" ref={menuRef}>
    <button aria-expanded={open} aria-haspopup="menu" aria-label={`${profile.email} 사용자 메뉴`} className="profile-button" onClick={() => setOpen((current) => !current)} type="button">
      <span className="profile-button__avatar" aria-hidden="true"><UserRound size={17} /></span>
      <span className="profile-button__label">{profile.email}</span>
      <ChevronDown aria-hidden="true" size={15} />
    </button>
    {open && <div className="profile-popover" role="menu">
      <p><strong>Google 계정</strong><span>{profile.email}</span></p>
      <Link href="/settings" role="menuitem"><Settings aria-hidden="true" size={16} />설정</Link>
      <form action="/auth/logout" method="post"><button role="menuitem" type="submit"><LogOut aria-hidden="true" size={16} />로그아웃</button></form>
    </div>}
  </div>;
}
