import type { ProjectType } from "@/lib/projects/domain";
import type { ProjectRow } from "@/types/database";

export const WORKSPACE_TABS = [
  { key: "overview", label: "개요", mobileLabel: "개요" },
  { key: "schedule", label: "일정", mobileLabel: "일정" },
  { key: "checklist", label: "체크리스트", mobileLabel: "체크" },
  { key: "reservations", label: "예약", mobileLabel: "예약" },
  { key: "budget", label: "예산", mobileLabel: "예산" },
  { key: "notes", label: "노트", mobileLabel: "노트" },
  { key: "files", label: "파일", mobileLabel: "파일" },
  { key: "map", label: "지도", mobileLabel: "지도" },
] as const;

export type WorkspaceTab = (typeof WORKSPACE_TABS)[number]["key"];
export type WorkspaceAction =
  | "budget"
  | "checklist"
  | "files"
  | "map"
  | "notes"
  | "reservations"
  | "schedule"
  | "workout";

type WorkspaceNavigation = {
  readonly overflow: readonly WorkspaceTab[];
  readonly primary: readonly WorkspaceTab[];
};

const DEFAULT_TABS = [
  "overview",
  "schedule",
  "checklist",
  "reservations",
  "budget",
  "notes",
  "files",
  "map",
] as const satisfies readonly WorkspaceTab[];

const tabOrders: Readonly<Partial<Record<ProjectType, readonly WorkspaceTab[]>>> = {
  development: ["overview", "checklist", "notes", "files", "schedule", "budget", "reservations", "map"],
  publication: ["overview", "notes", "files", "checklist", "schedule", "budget", "reservations", "map"],
  school: ["overview", "schedule", "checklist", "notes", "files", "budget", "reservations", "map"],
  workout: ["overview", "schedule", "checklist", "map", "budget", "notes", "files", "reservations"],
};

const emptyActions: Readonly<Partial<Record<ProjectType, readonly WorkspaceAction[]>>> = {
  publication: ["notes", "files", "checklist", "schedule"],
  school: ["schedule", "checklist", "notes", "files"],
  travel: ["schedule", "reservations", "map", "checklist"],
  workout: ["schedule", "checklist", "map", "budget"],
};

const quickActions: Readonly<Partial<Record<ProjectType, readonly WorkspaceAction[]>>> = {
  publication: ["notes", "files", "checklist"],
  school: ["schedule", "checklist", "notes"],
  travel: ["schedule", "reservations", "map"],
  workout: ["schedule", "workout", "map"],
};

export function workspaceProjectType(project: Pick<ProjectRow, "color" | "icon">): ProjectType {
  if (project.icon === "travel") return "travel";
  if (project.icon === "school") return "school";
  if (project.icon === "star") return "publication";
  if (project.icon === "heart") return "workout";
  if (project.icon === "calendar") return "work";
  if (project.icon === "flag") return "personal";
  if (project.icon === "folder" && project.color === "blue") return "development";
  return "other";
}

export function workspaceNavigationFor(type: ProjectType): WorkspaceNavigation {
  if (type === "travel") {
    return {
      overflow: ["notes"],
      primary: ["overview", "schedule", "reservations", "map", "checklist", "budget", "files"],
    };
  }
  return { overflow: [], primary: tabOrders[type] ?? DEFAULT_TABS };
}

export function workspaceEmptyActionsFor(type: ProjectType): readonly WorkspaceAction[] {
  return emptyActions[type] ?? ["schedule", "reservations", "checklist", "budget"];
}

export function workspaceQuickActionsFor(type: ProjectType): readonly WorkspaceAction[] {
  return quickActions[type] ?? ["schedule", "checklist", "notes"];
}

export function workspaceTab(key: WorkspaceTab) {
  return WORKSPACE_TABS.find((tab) => tab.key === key);
}
