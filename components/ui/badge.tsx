import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone =
  | "health"
  | "school"
  | "exercise"
  | "personal"
  | "project"
  | "waiting"
  | "check"
  | "deadline"
  | "success"
  | "neutral";

interface BadgeProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly tone?: BadgeTone;
}

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return <span className={cn("badge", `badge--${tone}`, className)}>{children}</span>;
}
