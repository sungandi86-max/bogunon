"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";

import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
import { CreateItemForm } from "@/components/layout/create-item-form";
import { GlobalNavigation } from "@/components/layout/global-navigation";
import { MobileBottomNavigation } from "@/components/layout/mobile-bottom-navigation";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { Button } from "@/components/ui/button";
import type { AuthProfile } from "@/lib/auth/profile";

interface AppShellProps {
  readonly children: ReactNode;
  readonly profile?: AuthProfile;
}

const fallbackProfile: AuthProfile = { email: "Google 계정", initial: "보" };

export function AppShell({ children, profile = fallbackProfile }: AppShellProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const openCreate = useCallback((trigger: HTMLButtonElement) => {
    createButtonRef.current = trigger;
    setCreateOpen(true);
  }, []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);

  return (
    <AppShellCreateContext value={{ openCreate }}>
      <div className="app-shell">
        <GlobalNavigation onCreate={openCreate} profile={profile} />
        {children}
        <MobileBottomNavigation />
        <ResponsiveDetailPanel
          footer={
            <>
              <Button onClick={closeCreate} variant="secondary">취소</Button>
              <Button aria-describedby="phase-one-save-note" disabled>저장</Button>
            </>
          }
          initialFocusRef={titleRef}
          onClose={closeCreate}
          open={createOpen}
          returnFocusRef={createButtonRef}
          title="새로 만들기"
        >
          <CreateItemForm titleRef={titleRef} />
        </ResponsiveDetailPanel>
      </div>
    </AppShellCreateContext>
  );
}
