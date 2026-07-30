import { Files, Search, Upload } from "lucide-react";
import type { DragEvent } from "react";
import { useState } from "react";

import { ProjectFileIcon } from "@/components/projects/project-file-icon";
import {
  PROJECT_FILE_ACCEPT,
  formatProjectFileSize,
  type ProjectFileSort,
} from "@/lib/projects/files";
import type { ProjectFileRow, ProjectReservationRow } from "@/types/database";

type ProjectFilesListProps = {
  readonly busy: boolean;
  readonly files: readonly ProjectFileRow[];
  readonly onFiles: (files: readonly File[]) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onReservationChange: (reservationId: string) => void;
  readonly onSelect: (file: ProjectFileRow) => void;
  readonly onSortChange: (sort: ProjectFileSort) => void;
  readonly query: string;
  readonly reservationId: string;
  readonly reservations: readonly ProjectReservationRow[];
  readonly selectedId: string | undefined;
  readonly sort: ProjectFileSort;
  readonly totalCount: number;
};

function uploadedLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "업로드일 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ProjectFilesList({
  busy,
  files,
  onFiles,
  onQueryChange,
  onReservationChange,
  onSelect,
  onSortChange,
  query,
  reservationId,
  reservations,
  selectedId,
  sort,
  totalCount,
}: ProjectFilesListProps) {
  const [dragging, setDragging] = useState(false);

  function receiveDrop(event: DragEvent<HTMLElement>): void {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files);
    if (dropped.length) onFiles(dropped);
  }

  return (
    <aside
      className={`project-files-list${dragging ? " is-dragging" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setDragging(false);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={receiveDrop}
    >
      <div className="project-files-list__heading">
        <div>
          <h2>파일</h2>
          <span>{totalCount}</span>
        </div>
        <label className="button button--primary project-files-list__upload">
          <Upload aria-hidden="true" size={16} />
          업로드
          <input
            accept={PROJECT_FILE_ACCEPT}
            aria-label="프로젝트 파일 선택"
            disabled={busy}
            multiple
            onChange={(event) => {
              const input = event.currentTarget;
              const selected = Array.from(input.files ?? []);
              if (selected.length) onFiles(selected);
              input.value = "";
            }}
            type="file"
          />
        </label>
      </div>
      <div className="project-files-list__controls">
        <label className="project-files-list__search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">파일 검색</span>
          <input
            aria-label="파일 검색"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="파일명 검색"
            type="search"
            value={query}
          />
        </label>
        <label className="project-files-list__sort">
          <span className="sr-only">파일 정렬</span>
          <select
            aria-label="파일 정렬"
            onChange={(event) => {
              const value = event.target.value;
              if (value === "recent" || value === "name" || value === "size") onSortChange(value);
            }}
            value={sort}
          >
            <option value="recent">최근 업로드</option>
            <option value="name">이름순</option>
            <option value="size">파일 크기순</option>
          </select>
        </label>
      </div>
      {reservations.length > 0 && (
        <label className="project-files-list__reservation">
          <span>업로드 파일 연결</span>
          <select
            aria-label="업로드 파일 예약 연결"
            disabled={busy}
            onChange={(event) => onReservationChange(event.target.value)}
            value={reservationId}
          >
            <option value="">예약 연결 안 함</option>
            {reservations.map((reservation) => (
              <option key={reservation.id} value={reservation.id}>
                {reservation.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {busy && <p className="project-files-list__progress" role="status">파일을 처리하는 중입니다.</p>}
      {files.length ? (
        <div aria-label="프로젝트 파일 목록" className="project-files-list__items">
          {files.map((file) => (
            <button
              aria-label={`${file.original_filename}, ${formatProjectFileSize(file.size_bytes)}`}
              aria-pressed={selectedId === file.id}
              className="project-file-card"
              key={file.id}
              onClick={() => onSelect(file)}
              type="button"
            >
              <span className="project-file-card__icon">
                <ProjectFileIcon mimeType={file.mime_type} />
              </span>
              <span className="project-file-card__copy">
                <strong>{file.original_filename}</strong>
                <span>{uploadedLabel(file.uploaded_at)} · {formatProjectFileSize(file.size_bytes)}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="project-files-list__empty">
          <Files aria-hidden="true" size={26} />
          <strong>{totalCount ? "검색 결과가 없습니다." : "아직 업로드된 파일이 없습니다."}</strong>
          <p>{totalCount ? "다른 검색어를 입력해 보세요." : "프로젝트와 관련된 문서를 추가해보세요."}</p>
        </div>
      )}
      <p className="project-files-list__hint">PDF, 이미지, DOCX, XLSX, PPTX, TXT · 파일당 최대 15MB</p>
    </aside>
  );
}
