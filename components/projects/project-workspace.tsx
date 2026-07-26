"use client";

import { CalendarRange, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { deleteProjectAction } from "@/app/(app)/projects/actions";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectIcon } from "@/components/projects/project-icon";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import type { ProjectRow } from "@/types/database";

function projectPeriod(project: ProjectRow): string {
  if (!project.start_date && !project.end_date) return "기간 미정";
  if (project.start_date && project.end_date) return `${project.start_date} ~ ${project.end_date}`;
  return project.start_date ? `${project.start_date}부터` : `${project.end_date}까지`;
}

export function ProjectWorkspace({ projects }: { readonly projects: readonly ProjectRow[] }) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow>();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setEditing(undefined);
    router.refresh();
  }, [router]);

  function openCreate(trigger: HTMLButtonElement): void {
    triggerRef.current = trigger;
    setEditing(undefined);
    setPanelOpen(true);
  }

  function openEdit(trigger: HTMLButtonElement, project: ProjectRow): void {
    triggerRef.current = trigger;
    setEditing(project);
    setPanelOpen(true);
  }

  return (
    <>
      <section className="project-toolbar" aria-label="프로젝트 도구">
        <p>일정을 목적별로 묶고, 연결된 일정만 한곳에서 확인합니다.</p>
        <button className="button button--primary" onClick={(event) => openCreate(event.currentTarget)} type="button">
          <Plus aria-hidden="true" size={17} />프로젝트 만들기
        </button>
      </section>
      {projects.length ? (
        <section aria-label="프로젝트 목록" className="project-grid">
          {projects.map((project) => (
            <article className={`project-card project-card--${project.color}`} key={project.id}>
              <Link className="project-card__main" href={`/projects/${project.id}`}>
                <span className="project-card__icon"><ProjectIcon icon={project.icon} /></span>
                <span>
                  <strong>{project.name}</strong>
                  <small><CalendarRange aria-hidden="true" size={14} />{projectPeriod(project)}</small>
                </span>
              </Link>
              <p>{project.description || "설명 없음"}</p>
              <details className="project-card__menu">
                <summary aria-label={`${project.name} 더보기`}><MoreHorizontal aria-hidden="true" size={20} /></summary>
                <div>
                  <button onClick={(event) => openEdit(event.currentTarget, project)} type="button"><Pencil aria-hidden="true" size={15} />수정</button>
                  <form action={deleteProjectAction}>
                    <input name="id" type="hidden" value={project.id} />
                    <button className="danger-text" onClick={(event) => {
                      if (!window.confirm("프로젝트를 삭제할까요? 연결된 일정은 삭제되지 않습니다.")) event.preventDefault();
                    }} type="submit"><Trash2 aria-hidden="true" size={15} />삭제</button>
                  </form>
                </div>
              </details>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state empty-state--featured project-empty-state">
          <span className="empty-state__icon"><CalendarRange aria-hidden="true" size={22} /></span>
          <div className="empty-state__content"><h3>아직 프로젝트가 없습니다.</h3><p>프로젝트를 만들면 관련 일정을 연결해 모아볼 수 있습니다.</p></div>
          <button className="button button--primary" onClick={(event) => openCreate(event.currentTarget)} type="button"><Plus aria-hidden="true" size={16} />첫 프로젝트 만들기</button>
        </section>
      )}
      <ResponsiveDetailPanel onClose={() => setPanelOpen(false)} open={panelOpen} returnFocusRef={triggerRef} title={editing ? "프로젝트 수정" : "새 프로젝트"}>
        <ProjectForm key={editing?.id ?? "create"} onSaved={closePanel} {...(editing ? { project: editing } : {})} />
      </ResponsiveDetailPanel>
    </>
  );
}
