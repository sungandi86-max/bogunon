"use client";

import {
  CalendarPlus,
  CheckSquare2,
  Dumbbell,
  FileUp,
  MapPinned,
  NotebookPen,
  TicketPlus,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { projectEventTemplate } from "@/lib/projects/domain";
import {
  workspaceEmptyActionsFor,
  workspaceProjectType,
  workspaceQuickActionsFor,
} from "@/lib/projects/workspace-navigation";
import type { WorkspaceAction } from "@/lib/projects/workspace-navigation";
import type { ProjectRow } from "@/types/database";

const actionDetails: Readonly<Record<WorkspaceAction, {
  readonly hash?: string;
  readonly label: string;
}>> = {
  budget: { hash: "budget", label: "예산 설정" },
  checklist: { hash: "checklist", label: "체크리스트 추가" },
  files: { hash: "files", label: "파일 추가" },
  map: { hash: "map", label: "지도에 장소 추가" },
  notes: { hash: "notes", label: "노트 작성" },
  reservations: { hash: "reservations", label: "예약 추가" },
  schedule: { label: "일정 추가" },
  workout: { label: "운동/대회" },
};

function ActionIcon({ action }: { readonly action: WorkspaceAction }) {
  if (action === "budget") return <WalletCards aria-hidden="true" size={17} />;
  if (action === "checklist") return <CheckSquare2 aria-hidden="true" size={17} />;
  if (action === "files") return <FileUp aria-hidden="true" size={17} />;
  if (action === "map") return <MapPinned aria-hidden="true" size={17} />;
  if (action === "notes") return <NotebookPen aria-hidden="true" size={17} />;
  if (action === "reservations") return <TicketPlus aria-hidden="true" size={17} />;
  if (action === "workout") return <Dumbbell aria-hidden="true" size={17} />;
  return <CalendarPlus aria-hidden="true" size={17} />;
}

export function ProjectWorkspaceEmptyActions({
  compact = false,
  project,
}: {
  readonly compact?: boolean;
  readonly project: ProjectRow;
}) {
  const { openCreate } = useAppShellCreate();
  const projectType = workspaceProjectType(project);
  const actions = compact ? workspaceQuickActionsFor(projectType) : workspaceEmptyActionsFor(projectType);

  return (
    <section
      aria-label={compact ? "프로젝트 빠른 작업" : undefined}
      aria-labelledby={compact ? undefined : "project-empty-actions-title"}
      className={`project-workspace-empty-actions${compact ? " project-workspace-empty-actions--compact" : ""}`}
    >
      {!compact && (
        <div>
          <h2 id="project-empty-actions-title">아직 연결된 항목이 없습니다.</h2>
          <p>이 프로젝트에서 자주 쓰는 항목부터 시작해보세요. 같은 데이터가 연결된 화면에 함께 표시됩니다.</p>
        </div>
      )}
      <div className="project-workspace-empty-actions__commands">
        {actions.map((action) => {
          const details = actionDetails[action];
          if (details.hash) {
            return <Link href={`#${details.hash}`} key={action}><ActionIcon action={action} />{details.label}</Link>;
          }
          const template = action === "workout"
            ? { ...projectEventTemplate(project.id, project.name), eventType: "workout" as const }
            : projectEventTemplate(project.id, project.name);
          return (
            <button
              key={action}
              onClick={(event) => openCreate(event.currentTarget, "event", template)}
              type="button"
            >
              <ActionIcon action={action} />{details.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
