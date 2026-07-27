import { FileText, Pin, Plus, Search } from "lucide-react";

import type { ProjectNoteRow } from "@/types/database";

type ProjectNotesListProps = {
  readonly notes: readonly ProjectNoteRow[];
  readonly onCreate: () => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSelect: (note: ProjectNoteRow) => void;
  readonly query: string;
  readonly selectedId: string | undefined;
  readonly totalCount: number;
};

function updatedLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "수정일 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function previewText(content: string): string {
  return content
    .replace(/^#{1,2}\s+/gm, "")
    .replace(/^-\s+\[[ xX]\]\s+/gm, "")
    .replace(/^[-\d.]+\s+/gm, "")
    .trim() || "본문 없음";
}

export function ProjectNotesList({
  notes,
  onCreate,
  onQueryChange,
  onSelect,
  query,
  selectedId,
  totalCount,
}: ProjectNotesListProps) {
  return (
    <aside className="project-notes-list">
      <div className="project-notes-list__heading">
        <div>
          <h2>노트</h2>
          <span>{totalCount}</span>
        </div>
        <button aria-label="새 노트" onClick={onCreate} type="button">
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
      <label className="project-notes-list__search">
        <Search aria-hidden="true" size={17} />
        <span className="sr-only">노트 검색</span>
        <input
          aria-label="노트 검색"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="노트 검색"
          type="search"
          value={query}
        />
      </label>
      {notes.length ? (
        <div aria-label="프로젝트 노트 목록" className="project-notes-list__items">
          {notes.map((note) => (
            <button
              aria-label={`${note.title}, ${updatedLabel(note.updated_at)}`}
              aria-pressed={selectedId === note.id}
              className="project-note-card"
              key={note.id}
              onClick={() => onSelect(note)}
              type="button"
            >
              <span className="project-note-card__title">
                {note.is_pinned
                  ? <Pin aria-label="고정 노트" fill="currentColor" size={14} />
                  : <FileText aria-hidden="true" size={14} />}
                <strong>{note.title}</strong>
              </span>
              <span className="project-note-card__preview">{previewText(note.content)}</span>
              <time dateTime={note.updated_at}>{updatedLabel(note.updated_at)}</time>
            </button>
          ))}
        </div>
      ) : (
        <div className="project-notes-list__empty">
          <FileText aria-hidden="true" size={24} />
          <strong>{totalCount ? "검색 결과가 없습니다." : "아직 작성된 노트가 없습니다."}</strong>
          <p>{totalCount ? "다른 검색어를 입력해 보세요." : "첫 번째 노트를 작성해보세요."}</p>
          {!totalCount && (
            <button className="button button--secondary" onClick={onCreate} type="button">
              <Plus aria-hidden="true" size={16} />
              새 노트
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
