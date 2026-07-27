import { ArrowLeft, Edit3, Eye, FileText, Pin, Save, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";

import { ProjectNotePreview } from "@/components/projects/project-note-preview";

export type ProjectNoteDraft = {
  readonly content: string;
  readonly isPinned: boolean;
  readonly noteId: string | null;
  readonly title: string;
};

type ProjectNoteEditorProps = {
  readonly busy: boolean;
  readonly draft: ProjectNoteDraft | undefined;
  readonly message: string;
  readonly messageIsError: boolean;
  readonly mode: "edit" | "preview";
  readonly onCancel: () => void;
  readonly onChange: (draft: ProjectNoteDraft) => void;
  readonly onDelete: () => void;
  readonly onModeChange: (mode: "edit" | "preview") => void;
  readonly onSave: () => void;
};

export function ProjectNoteEditor({
  busy,
  draft,
  message,
  messageIsError,
  mode,
  onCancel,
  onChange,
  onDelete,
  onModeChange,
  onSave,
}: ProjectNoteEditorProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    const saveFromTitle = event.currentTarget instanceof HTMLInputElement && event.key === "Enter";
    const saveFromBody = event.currentTarget instanceof HTMLTextAreaElement
      && event.key === "Enter"
      && (event.ctrlKey || event.metaKey);
    if (!saveFromTitle && !saveFromBody) return;
    event.preventDefault();
    onSave();
  }

  if (!draft) {
    return (
      <section className="project-note-editor project-note-editor--empty">
        <button aria-label="노트 목록으로" className="project-note-editor__back" onClick={onCancel} type="button">
          <ArrowLeft aria-hidden="true" size={18} />
          목록
        </button>
        <FileText aria-hidden="true" size={30} />
        <strong>노트를 선택하세요.</strong>
        <p>왼쪽 목록에서 노트를 선택하거나 새 노트를 만드세요.</p>
      </section>
    );
  }

  return (
    <section aria-label="노트 편집" className="project-note-editor">
      <header className="project-note-editor__toolbar">
        <button aria-label="노트 목록으로" className="project-note-editor__back" onClick={onCancel} type="button">
          <ArrowLeft aria-hidden="true" size={18} />
          목록
        </button>
        <div>
          <button
            aria-label={draft.isPinned ? "노트 고정 해제" : "노트 고정"}
            aria-pressed={draft.isPinned}
            disabled={busy}
            onClick={() => onChange({ ...draft, isPinned: !draft.isPinned })}
            type="button"
          >
            <Pin aria-hidden="true" fill={draft.isPinned ? "currentColor" : "none"} size={17} />
          </button>
          <button
            aria-label={mode === "edit" ? "미리보기" : "편집"}
            disabled={busy}
            onClick={() => onModeChange(mode === "edit" ? "preview" : "edit")}
            type="button"
          >
            {mode === "edit"
              ? <Eye aria-hidden="true" size={17} />
              : <Edit3 aria-hidden="true" size={17} />}
          </button>
          {draft.noteId && (
            <button aria-label="노트 삭제" className="danger-text" disabled={busy} onClick={onDelete} type="button">
              <Trash2 aria-hidden="true" size={17} />
            </button>
          )}
          <button
            aria-label="노트 저장"
            className="button button--primary"
            disabled={busy || !draft.title.trim()}
            onClick={onSave}
            type="button"
          >
            <Save aria-hidden="true" size={16} />
            저장
          </button>
        </div>
      </header>
      <label className="project-note-editor__title">
        <span className="sr-only">노트 제목</span>
        <input
          aria-label="노트 제목"
          disabled={busy}
          maxLength={200}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="노트 제목"
          value={draft.title}
        />
      </label>
      {mode === "edit" ? (
        <label className="project-note-editor__content">
          <span className="sr-only">노트 본문</span>
          <textarea
            aria-label="노트 본문"
            disabled={busy}
            maxLength={100_000}
            onChange={(event) => onChange({ ...draft, content: event.target.value })}
            onKeyDown={handleKeyDown}
            placeholder={"아이디어와 기록을 작성하세요.\n# 제목\n- 목록\n- [ ] 체크 항목"}
            value={draft.content}
          />
        </label>
      ) : <ProjectNotePreview content={draft.content} />}
      {message && (
        <p className={`project-note-editor__message${messageIsError ? " is-error" : ""}`} role={messageIsError ? "alert" : "status"}>
          {message}
        </p>
      )}
    </section>
  );
}
