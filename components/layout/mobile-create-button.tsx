"use client";

import { Plus } from "lucide-react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { Button } from "@/components/ui/button";

export function MobileCreateButton({ kind = "task" }: { readonly kind?: "task" | "event" }) {
  const { openCreate } = useAppShellCreate();
  return (
    <Button
      className="mobile-create-button"
      onClick={(event) => openCreate(event.currentTarget, kind)}
    >
      <Plus aria-hidden="true" size={18} />새로 만들기
    </Button>
  );
}
