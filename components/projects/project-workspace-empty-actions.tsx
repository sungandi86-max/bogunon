"use client";

import { CalendarPlus, CheckSquare2, TicketPlus, WalletCards } from "lucide-react";
import Link from "next/link";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { projectEventTemplate } from "@/lib/projects/domain";
import type { ProjectRow } from "@/types/database";

export function ProjectWorkspaceEmptyActions({ project }: { readonly project: ProjectRow }) {
  const { openCreate } = useAppShellCreate();

  return (
    <section aria-labelledby="project-empty-actions-title" className="project-workspace-empty-actions">
      <div>
        <h2 id="project-empty-actions-title">아직 연결된 일정이 없습니다.</h2>
        <p>필요한 항목부터 추가하면 같은 데이터가 캘린더와 Project Workspace에 함께 표시됩니다.</p>
      </div>
      <div className="project-workspace-empty-actions__commands">
        <button onClick={(event) => openCreate(event.currentTarget, "event", projectEventTemplate(project.id, project.name))} type="button">
          <CalendarPlus aria-hidden="true" size={17} />일정 추가
        </button>
        <Link href="#reservations"><TicketPlus aria-hidden="true" size={17} />예약 추가</Link>
        <Link href="#checklist"><CheckSquare2 aria-hidden="true" size={17} />체크리스트 추가</Link>
        <Link href="#budget"><WalletCards aria-hidden="true" size={17} />예산 설정</Link>
      </div>
    </section>
  );
}
