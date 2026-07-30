"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { saveProjectAction } from "@/app/(app)/projects/actions";
import type { ProjectActionState } from "@/app/(app)/projects/actions";
import { ProjectIcon } from "@/components/projects/project-icon";
import {
  PROJECT_COLORS,
  PROJECT_ICONS,
  PROJECT_QUICK_TEMPLATES,
  PROJECT_TYPES,
  projectTypeForIcon,
} from "@/lib/projects/domain";
import type { ProjectType } from "@/lib/projects/domain";
import type { ProjectRow } from "@/types/database";

const initialState: ProjectActionState = { status: "idle" };

export function ProjectForm({
  onSaved,
  project,
}: {
  readonly onSaved: (projectId?: string) => void;
  readonly project?: ProjectRow;
}) {
  const [state, action, pending] = useActionState(saveProjectAction, initialState);
  const key = project?.id ?? "create";
  const [projectType, setProjectType] = useState<ProjectType>(
    project ? projectTypeForIcon(project.icon) : "other",
  );
  const [name, setName] = useState(project?.name ?? "");
  const [icon, setIcon] = useState(project?.icon ?? "folder");
  const [color, setColor] = useState(project?.color ?? "mint");
  const [description, setDescription] = useState(project?.description ?? "");
  const [detailsOpen, setDetailsOpen] = useState(
    Boolean(project?.start_date || project?.end_date || project?.description),
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.status === "success") onSaved(state.projectId);
  }, [onSaved, state.projectId, state.status]);

  useEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [description]);

  function selectType(type: ProjectType): void {
    const option = PROJECT_TYPES.find((item) => item.value === type);
    if (!option) return;
    setProjectType(type);
    setIcon(option.icon);
    setColor(option.color);
  }

  function applyTemplate(template: (typeof PROJECT_QUICK_TEMPLATES)[number]): void {
    const option = PROJECT_TYPES.find((item) => item.value === template.type);
    if (!option) return;
    setProjectType(template.type);
    setName(template.name);
    setIcon(option.icon);
    setColor(option.color);
    setDescription("");
    nameRef.current?.focus();
  }

  return (
    <form action={action} autoComplete="off" className="project-form" id="project-form">
      <input name="id" type="hidden" value={project?.id ?? ""} />
      {!project && (
        <fieldset className="project-form__templates">
          <legend>빠른 시작</legend>
          <div>
            {PROJECT_QUICK_TEMPLATES.map((template) => {
              const templateType = PROJECT_TYPES.find((option) => option.value === template.type);
              return (
                <button key={template.key} onClick={() => applyTemplate(template)} type="button">
                  <ProjectIcon icon={templateType?.icon ?? "folder"} size={17} />
                  {template.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="field">
        <label className="field-label" htmlFor={`${key}-project-name`}>프로젝트 이름</label>
        <input
          autoComplete="off"
          id={`${key}-project-name`}
          maxLength={120}
          name="name"
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder="예: 2학기 보건교육 준비"
          ref={nameRef}
          required
          value={name}
        />
      </div>
      <fieldset className="project-form__types">
        <legend>프로젝트 유형</legend>
        <div>
          {PROJECT_TYPES.map((option) => (
            <button
              aria-pressed={projectType === option.value}
              key={option.value}
              onClick={() => selectType(option.value)}
              type="button"
            >
              <ProjectIcon icon={option.icon} size={18} />
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="project-form__customize">
        <fieldset className="project-form__icons">
          <legend>대표 아이콘</legend>
          <input name="icon" type="hidden" value={icon} />
          <div>
            {PROJECT_ICONS.map((option) => (
              <button
                aria-label={`${option.label} 아이콘`}
                aria-pressed={icon === option.value}
                key={option.value}
                onClick={() => setIcon(option.value)}
                title={option.label}
                type="button"
              >
                <ProjectIcon icon={option.value} size={18} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="project-form__colors">
          <legend>색상</legend>
          <input name="color" type="hidden" value={color} />
          <div>
            {PROJECT_COLORS.map((option) => (
              <button
                aria-label={`${option.label} 색상`}
                aria-pressed={color === option.value}
                className={`project-form__color project-form__color--${option.value}`}
                key={option.value}
                onClick={() => setColor(option.value)}
                title={option.label}
                type="button"
              >
                <span />
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <details
        className="project-form__details"
        onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
        open={detailsOpen}
      >
        <summary>상세 설정</summary>
        <div className="project-form__details-body">
          <div className="form-grid">
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
            <label className="field-label" htmlFor={`${key}-project-description`}>설명 <span className="field-label__optional">선택</span></label>
            <textarea
              id={`${key}-project-description`}
              maxLength={1000}
              name="description"
              onChange={(event) => setDescription(event.currentTarget.value)}
              placeholder="프로젝트의 목적이나 범위를 간단히 기록하세요."
              ref={descriptionRef}
              rows={2}
              value={description}
            />
          </div>
        </div>
      </details>
      {state.message && <p aria-live="polite" className={state.status === "error" ? "form-message form-message--error" : "form-message"}>{state.message}</p>}
      <button className="button button--primary project-form__submit" disabled={pending} type="submit">
        {pending ? "저장 중" : project ? "변경 저장" : "프로젝트 생성"}
      </button>
    </form>
  );
}
