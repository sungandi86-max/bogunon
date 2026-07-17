"use client";

import { createContext, use } from "react";

interface AppShellCreateContextValue {
  readonly openCreate: (trigger: HTMLButtonElement, kind?: "task" | "event") => void;
}

export const AppShellCreateContext = createContext<AppShellCreateContextValue | null>(null);

export function useAppShellCreate() {
  const value = use(AppShellCreateContext);
  if (!value) throw new Error("AppShell 안에서 사용해야 합니다.");
  return value;
}
