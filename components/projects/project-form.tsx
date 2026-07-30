"use client";

import { Check, ChevronDown } from "lucide-react";
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
import type { ProjectIcon as ProjectIconKey, ProjectRow } from "@/types/database";

const initialState: ProjectActionState = { status: "idle" };
const primaryProjectIcons = ["folder", "travel", "school", "calendar", "heart", "flag"] as const satisfies readonly ProjectIconKey[];

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
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [iconsExpanded, setIconsExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(
    Boolean(project?.start_date || project?.end_date || project?.description),
  );
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const selectedType = PROJECT_TYPES.find((option) => option.value === projectType);
  const selectedColor = PROJECT_COLORS.find((option) => option.value === color);
  const visibleIcons = iconsExpanded
    ? PROJECT_ICONS
    : PROJECT_ICONS.filter(
      (option) => primaryProjectIcons.some((value) => value === option.value) || option.value === icon,
    );

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
    setSelectedTemplateKey(null);
    setProjectType(type);
    setIcon(option.icon);
    setColor(option.color);
  }

  function applyTemplate(template: (typeof PROJECT_QUICK_TEMPLATES)[number]): void {
    const option = PROJECT_TYPES.find((item) => item.value === template.type);
    if (!option) return;
    setSelectedTemplateKey(template.key);
    setProjectType(template.type);
    setName((currentName) => currentName.trim() ? currentName : template.name);
    setIcon(option.icon);
    setColor(option.color);
  }

  return (
    <form action={action} autoComplete="off" className="project-form" id="project-form">
      <input name="id" type="hidden" value={project?.id ?? ""} />
      <div className="field project-form__name">
        <label className="field-label" htmlFor={`${key}-project-name`}>프로젝트 이름</label>
        <input
          autoComplete="off"
          id={`${key}-project-name`}
          maxLength={120}
          name="name"
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder="예: 제주 여행"
          required
          value={name}
        />
      </div>
      {!project && (
        <fieldset className="project-form__templates">
          <legend>빠른 시작</legend>
          <div>
            {PROJECT_QUICK_TEMPLATES.map((template) => {
              const templateType = PROJECT_TYPES.find((option) => option.value === template.type);
              const selected = selectedTemplateKey === template.key;
              return (
                <button
                  aria-pressed={selected}
                  key={template.key}
                  onClick={() => applyTemplate(template)}
                  type="button"
                >
                  <span className="project-form__template-icon">
                    <ProjectIcon icon={templateType?.icon ?? "folder"} size={18} />
                  </span>
                  <span className="project-form__template-copy">
                    <strong>{template.label}</strong>
                    <small>{template.description}</small>
                  </span>
                  <Check aria-hidden="true" className="project-form__selection-check" size={16} />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
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
            {visibleIcons.map((option) => (
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
            <button
              aria-expanded={iconsExpanded}
              aria-label={iconsExpanded ? "대표 아이콘 접기" : "대표 아이콘 더보기"}
              className="project-form__icon-more"
              onClick={() => setIconsExpanded((expanded) => !expanded)}
              type="button"
            >
              <ChevronDown aria-hidden="true" className={iconsExpanded ? "is-expanded" : ""} size={17} />
              <span>{iconsExpanded ? "접기" : "더보기"}</span>
            </button>
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
                <span className="project-form__color-swatch" />
                <Check aria-hidden="true" className="project-form__color-check" size={15} />
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <section
        aria-label="프로젝트 미리보기"
        className={`project-form__preview project-form__preview--${color}`}
      >
        <span className="project-form__preview-icon">
          <ProjectIcon icon={icon} size={21} />
        </span>
        <span className="project-form__preview-copy">
          <small>미리보기</small>
          <strong>{name.trim() || "프로젝트 이름"}</strong>
          <span>
            {selectedType?.label ?? "기타"}
            <span aria-hidden="true">·</span>
            {selectedColor?.label ?? "민트"}
          </span>
        </span>
      </section>
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
        {pending ? "저장 중" : project ? "변경 저장" : "새 프로젝트 시작"}
      </button>
    </form>
  );
}
