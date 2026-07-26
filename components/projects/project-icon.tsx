import { CalendarDays, Flag, Folder, GraduationCap, HeartPulse, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ProjectIcon as ProjectIconKey } from "@/types/database";

const icons: Readonly<Record<ProjectIconKey, LucideIcon>> = {
  folder: Folder,
  calendar: CalendarDays,
  school: GraduationCap,
  heart: HeartPulse,
  flag: Flag,
  star: Star,
};

export function ProjectIcon({ icon, size = 20 }: { readonly icon: ProjectIconKey; readonly size?: number }) {
  const Icon = icons[icon];
  return <Icon aria-hidden="true" size={size} />;
}
