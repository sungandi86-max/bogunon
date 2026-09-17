import { Building2, FolderOpen, Globe2, HeartPulse, Sheet, Wrench, type LucideIcon } from "lucide-react";

import type { PracticalToolIconKey } from "@/types/database";

const icons: Record<PracticalToolIconKey, LucideIcon> = {
  online_health: HeartPulse,
  spreadsheet: Sheet,
  drive: FolderOpen,
  school_system: Building2,
  website: Globe2,
  other: Wrench,
};

export function PracticalToolIcon({ iconKey, size = 18 }: { readonly iconKey: PracticalToolIconKey; readonly size?: number }) {
  const Icon = icons[iconKey];
  return <Icon aria-hidden="true" size={size} strokeWidth={1.8} />;
}
