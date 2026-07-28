import { ArrowLeft, Download, ExternalLink, FileSearch, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { createProjectFileAccessAction } from "@/app/(app)/projects/file-actions";
import {
  ProjectFileIcon,
  projectFileTypeLabel,
} from "@/components/projects/project-file-icon";
import { loadSignedFilePreview } from "@/lib/projects/file-upload-client";
import { formatProjectFileSize, projectFileKind } from "@/lib/projects/files";
import type { ProjectFileRow } from "@/types/database";

type PreviewState =
  | { readonly kind: "empty" }
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly objectUrl?: string; readonly signedUrl: string; readonly text?: string }
  | { readonly kind: "error"; readonly message: string };

type ProjectFilePreviewProps = {
  readonly busy: boolean;
  readonly file: ProjectFileRow | undefined;
  readonly onBack: () => void;
  readonly onDelete: (file: ProjectFileRow) => void;
};

function uploadedLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "업로드일 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function ProjectFilePreview({ busy, file, onBack, onDelete }: ProjectFilePreviewProps) {
  const [preview, setPreview] = useState<PreviewState>(
    file ? { kind: "loading" } : { kind: "empty" },
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!file) return;
    let active = true;
    let objectUrl: string | undefined;
    void createProjectFileAccessAction({
      fileId: file.id,
      mode: "preview",
      projectId: file.project_id,
    }).then(async (result) => {
      if (!active) return;
      if (result.status === "error" || !result.signedUrl) {
        setPreview({ kind: "error", message: result.message });
        return;
      }
      const kind = projectFileKind(file);
      if (kind === "image" || kind === "text") {
        const loaded = await loadSignedFilePreview(result.signedUrl, file.mime_type);
        objectUrl = loaded.objectUrl;
        if (!active) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          return;
        }
        setPreview({ kind: "ready", signedUrl: result.signedUrl, ...loaded });
        return;
      }
      setPreview({ kind: "ready", signedUrl: result.signedUrl });
    }).catch(() => {
      if (active) setPreview({ kind: "error", message: "파일 미리보기를 불러오지 못했습니다." });
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  async function download(): Promise<void> {
    if (!file || busy) return;
    setMessage("");
    const result = await createProjectFileAccessAction({
      fileId: file.id,
      mode: "download",
      projectId: file.project_id,
    });
    if (result.status === "error" || !result.signedUrl) {
      setMessage(result.message);
      return;
    }
    window.open(result.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (!file) {
    return (
      <section className="project-file-preview project-file-preview--empty">
        <button aria-label="파일 목록으로" className="project-file-preview__back" onClick={onBack} type="button">
          <ArrowLeft aria-hidden="true" size={18} />
          목록
        </button>
        <FileSearch aria-hidden="true" size={30} />
        <strong>파일을 선택하세요.</strong>
        <p>왼쪽 목록에서 문서를 선택하면 정보와 미리보기를 확인할 수 있습니다.</p>
      </section>
    );
  }

  const typeLabel = projectFileTypeLabel(file.filename, file.mime_type);
  return (
    <section aria-label="파일 미리보기" className="project-file-preview">
      <header className="project-file-preview__toolbar">
        <button aria-label="파일 목록으로" className="project-file-preview__back" onClick={onBack} type="button">
          <ArrowLeft aria-hidden="true" size={18} />
          목록
        </button>
        <div>
          <button
            aria-label="파일 다운로드"
            className="button button--secondary"
            disabled={busy}
            onClick={() => void download()}
            type="button"
          >
            <Download aria-hidden="true" size={16} />
            <span>다운로드</span>
          </button>
          <button
            aria-label="파일 삭제"
            className="button button--danger"
            disabled={busy}
            onClick={() => onDelete(file)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            <span>삭제</span>
          </button>
        </div>
      </header>
      <div className="project-file-preview__title">
        <span><ProjectFileIcon mimeType={file.mime_type} size={24} /></span>
        <div>
          <h2>{file.original_filename}</h2>
          <p>{typeLabel} · {formatProjectFileSize(file.size_bytes)}</p>
        </div>
      </div>
      <div className="project-file-preview__canvas">
        {preview.kind === "loading" && (
          <p className="project-file-preview__loading" role="status">
            <LoaderCircle aria-hidden="true" size={20} />
            미리보기를 준비하는 중입니다.
          </p>
        )}
        {preview.kind === "error" && <p className="project-file-preview__error" role="alert">{preview.message}</p>}
        {preview.kind === "ready" && preview.objectUrl && (
          <Image
            alt={`${file.original_filename} 미리보기`}
            height={720}
            src={preview.objectUrl}
            unoptimized
            width={960}
          />
        )}
        {preview.kind === "ready" && preview.text !== undefined && (
          <pre>{preview.text || "텍스트 내용이 없습니다."}</pre>
        )}
        {preview.kind === "ready" && !preview.objectUrl && preview.text === undefined && (
          <div className="project-file-preview__document">
            <ProjectFileIcon mimeType={file.mime_type} size={42} />
            <strong>{typeLabel}</strong>
            <p>{file.mime_type === "application/pdf"
              ? "PDF는 새 탭에서 안전하게 확인할 수 있습니다."
              : "이 파일 형식은 다운로드 후 전용 앱에서 확인하세요."}</p>
            {file.mime_type === "application/pdf" && (
              <button
                className="button button--secondary"
                onClick={() => window.open(preview.signedUrl, "_blank", "noopener,noreferrer")}
                type="button"
              >
                <ExternalLink aria-hidden="true" size={16} />
                PDF 열기
              </button>
            )}
          </div>
        )}
      </div>
      <dl className="project-file-preview__meta">
        <div><dt>파일 형식</dt><dd>{typeLabel}</dd></div>
        <div><dt>파일 크기</dt><dd>{formatProjectFileSize(file.size_bytes)}</dd></div>
        <div><dt>업로드</dt><dd>{uploadedLabel(file.uploaded_at)}</dd></div>
      </dl>
      {message && <p className="project-file-preview__error" role="alert">{message}</p>}
    </section>
  );
}
