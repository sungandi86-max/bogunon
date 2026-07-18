"use client";

import { CircleDashed, Dumbbell, Plus } from "lucide-react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { Button } from "@/components/ui/button";
import type { TemplateDefinition } from "@/lib/work-items/workflow";

interface EmptyStateProps {
  readonly description: string;
  readonly title: string;
  readonly actionLabel?: string;
  readonly icon?: "default" | "exercise";
}

function emptyStateTemplate(icon: EmptyStateProps["icon"]): TemplateDefinition {
  const area = icon === "exercise" ? "exercise" : "healthWork";
  return { area, category: "other", checklist: [], description: "", estimatedMinutes: 30, key: `empty-${area}`, kind: "task", memo: "", name: area === "exercise" ? "운동 기록" : "업무", priority: "normal", recommendedTiming: "직접 입력", recurrenceFrequency: null, title: "" };
}

function EmptyStateAction({ icon, label }: { readonly icon: EmptyStateProps["icon"]; readonly label: string }) {
  const { openCreate } = useAppShellCreate();
  return <Button onClick={(event) => openCreate(event.currentTarget, "task", emptyStateTemplate(icon))}><Plus aria-hidden="true" size={16} />{label}</Button>;
}

export function EmptyState({ actionLabel, description, icon = "default", title }: EmptyStateProps) {
  const Icon = icon === "exercise" ? Dumbbell : CircleDashed;
  return (
    <div className={`empty-state${actionLabel ? " empty-state--featured" : ""}`}>
      <span className="empty-state__icon"><Icon aria-hidden="true" size={22} /></span>
      <div className="empty-state__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {actionLabel && <EmptyStateAction icon={icon} label={actionLabel} />}
    </div>
  );
}
