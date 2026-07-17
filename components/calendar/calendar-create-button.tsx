"use client";

import { Plus } from "lucide-react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { Button } from "@/components/ui/button";

export function CalendarCreateButton() {
  const { openCreate } = useAppShellCreate();

  return (
    <Button
      className="calendar-desktop-add"
      onClick={(event) => openCreate(event.currentTarget, "event")}
    >
      <Plus aria-hidden="true" size={18} />일정 추가
    </Button>
  );
}
