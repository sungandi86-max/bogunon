"use client";

import { useActionState, useEffect } from "react";

import { saveProjectAction } from "@/app/(app)/projects/actions";
import type { ProjectActionState } from "@/app/(app)/projects/actions";
import { PROJECT_COLORS, PROJECT_ICONS } from "@/lib/projects/domain";
import type { ProjectRow } from "@/types/database";

const initialState: ProjectActionState = { status: "idle" };

export function ProjectForm({
  onSaved,
  project,
}: {
  readonly onSaved: () => void;
  readonly project?: ProjectRow;
}) {
  const [state, action, pending] = useActionState(saveProjectAction, initialState);
  const key = project?.id ?? "create";

  useEffect(() => {
    if (state.status === "success") onSaved();
  }, [onSaved, state.status]);

  return (
    <form action={action} className="project-form" id="project-form">
      <input name="id" type="hidden" value={project?.id ?? ""} />
      <div className="field">
        <label className="field-label" htmlFor={`${key}-project-name`}>프로젝트 이름</label>
        <input defaultValue={project?.name ?? ""} id={`${key}-project-name`} maxLength={120} name="name" placeholder="예: 2학기 보건교육 준비" required />
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor={`${key}-project-icon`}>아이콘</label>
          <select defaultValue={project?.icon ?? "folder"} id={`${key}-project-icon`} name="icon">
            {PROJECT_ICONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-project-color`}>색상</label>
          <select defaultValue={project?.color ?? "mint"} id={`${key}-project-color`} name="color">
            {PROJECT_COLORS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-project-start`}>시작일</label>
          <input defaultValue={project?.start_date ?? ""} id={`${key}-project-start`} name="startDate" type="date" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-project-end`}>종료일</label>
          <input defaultValue={project?.end_date ?? ""} id={`${key}-project-end`} name="endDate" type="date" />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${key}-project-description`}>설명</label>
        <textarea defaultValue={project?.description ?? ""} id={`${key}-project-description`} maxLength={1000} name="description" placeholder="프로젝트의 목적이나 범위를 간단히 기록하세요." />
      </div>
      {state.message && <p aria-live="polite" className={state.status === "error" ? "form-message form-message--error" : "form-message"}>{state.message}</p>}
      <button className="button button--primary project-form__submit" disabled={pending} type="submit">
        {pending ? "저장 중" : project ? "변경 저장" : "프로젝트 만들기"}
      </button>
    </form>
  );
}
