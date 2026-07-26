"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { ProjectRow } from "@/types/database";

const ProjectContext = createContext<readonly ProjectRow[]>([]);

export function ProjectProvider({
  children,
  projects,
}: {
  readonly children: ReactNode;
  readonly projects: readonly ProjectRow[];
}) {
  return <ProjectContext value={projects}>{children}</ProjectContext>;
}

export function useProjects(): readonly ProjectRow[] {
  return useContext(ProjectContext);
}
