"use client";

import { createContext, useContext } from "react";

export type AssistantSurface = "dashboard" | "quick_add" | "task" | "workflow" | "annual" | "global";

interface AssistantContextValue {
  readonly openAssistant: (trigger: HTMLButtonElement, surface?: AssistantSurface, entityId?: string) => void;
}

export const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("AI Assistant는 앱 셸 안에서 사용해야 합니다.");
  return context;
}

export function useOptionalAssistant() {
  return useContext(AssistantContext);
}
