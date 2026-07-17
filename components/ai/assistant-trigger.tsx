"use client";

import { WandSparkles } from "lucide-react";

import { useOptionalAssistant } from "@/components/ai/assistant-context";
import type { AssistantSurface } from "@/components/ai/assistant-context";
import { Button } from "@/components/ui/button";

export function AssistantTrigger({ entityId, label = "AI Assistant", surface = "global" }: {
  readonly entityId?: string;
  readonly label?: string;
  readonly surface?: AssistantSurface;
}) {
  const assistant = useOptionalAssistant();
  if (!assistant) return null;
  const { openAssistant } = assistant;
  return <Button className="assistant-trigger" onClick={(event) => openAssistant(event.currentTarget, surface, entityId)} variant="secondary"><WandSparkles aria-hidden="true" size={17} />{label}</Button>;
}
