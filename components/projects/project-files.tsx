"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  cancelProjectFileUploadAction,
  deleteProjectFileAction,
  finalizeProjectFileUploadAction,
  loadProjectFilesAction,
  prepareProjectFileUploadAction,
  type FileUploadTarget,
} from "@/app/(app)/projects/file-actions";
import { ProjectFilePreview } from "@/components/projects/project-file-preview";
import { ProjectFilesList } from "@/components/projects/project-files-list";
import { uploadProjectFileToSignedUrl } from "@/lib/projects/file-upload-client";
import {
  filterProjectFiles,
  parseProjectFileCandidate,
  sortProjectFiles,
  type ProjectFileSort,
} from "@/lib/projects/files";
import type { ProjectFileRow, ProjectReservationRow } from "@/types/database";

type ProjectFilesProps = {
  readonly initialFiles?: readonly ProjectFileRow[];
  readonly projectId: string;
  readonly reservations?: readonly ProjectReservationRow[];
};

export function ProjectFiles({ initialFiles, projectId, reservations = [] }: ProjectFilesProps) {
  const [files, setFiles] = useState<readonly ProjectFileRow[]>(initialFiles ?? []);
  const [selected, setSelected] = useState<ProjectFileRow>();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProjectFileSort>("recent");
  const [uploadReservationId, setUploadReservationId] = useState("");
  const [loading, setLoading] = useState(initialFiles === undefined);
  const [busy, setBusy] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  useEffect(() => {
    if (initialFiles !== undefined) return;
    let active = true;
    void loadProjectFilesAction({ projectId })
      .then((result) => {
        if (!active) return;
        if (result.status === "error") {
          setMessage(result.message);
          setMessageIsError(true);
          return;
        }
        setFiles(result.files ?? []);
      })
      .catch(() => {
        if (!active) return;
        setMessage("파일을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setMessageIsError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialFiles, projectId]);

  const visibleFiles = useMemo(
    () => sortProjectFiles(filterProjectFiles(files, query), sort),
    [files, query, sort],
  );

  function selectFile(file: ProjectFileRow): void {
    setSelected(file);
    setMessage("");
    setMobilePreviewOpen(true);
  }

  async function uploadOne(file: File): Promise<ProjectFileRow> {
    const parsed = parseProjectFileCandidate(file);
    const prepared = await prepareProjectFileUploadAction({
      name: parsed.name,
      projectId,
      size: parsed.size,
      type: parsed.mimeType,
    });
    if (prepared.status === "error" || !prepared.upload) throw new Error(prepared.message);
    const upload: FileUploadTarget = prepared.upload;
    try {
      await uploadProjectFileToSignedUrl(file, upload);
      const finalized = await finalizeProjectFileUploadAction({
        fileId: upload.fileId,
        filename: upload.filename,
        mimeType: parsed.mimeType,
        originalFilename: parsed.name,
        projectId,
        reservationId: uploadReservationId || null,
        sizeBytes: parsed.size,
        storagePath: upload.path,
      });
      if (finalized.status === "error" || !finalized.file) throw new Error(finalized.message);
      return finalized.file;
    } catch (error) {
      await cancelProjectFileUploadAction({ path: upload.path, projectId });
      throw error;
    }
  }

  async function uploadFiles(selectedFiles: readonly File[]): Promise<void> {
    if (busy || !selectedFiles.length) return;
    setBusy(true);
    setMessage("");
    const uploaded: ProjectFileRow[] = [];
    let failure = "";
    for (const file of selectedFiles) {
      try {
        uploaded.push(await uploadOne(file));
      } catch (error) {
        failure = error instanceof Error ? error.message : "파일을 업로드하지 못했습니다.";
      }
    }
    if (uploaded.length) {
      setFiles((current) => [
        ...uploaded,
        ...current.filter((file) => !uploaded.some((item) => item.id === file.id)),
      ]);
      setSelected(uploaded.at(-1));
    }
    setMessage(failure || `${uploaded.length}개 파일을 업로드했습니다.`);
    setMessageIsError(Boolean(failure));
    setBusy(false);
  }

  async function deleteFile(file: ProjectFileRow): Promise<void> {
    if (busy || !window.confirm(`"${file.original_filename}" 파일을 삭제할까요?`)) return;
    setBusy(true);
    const result = await deleteProjectFileAction({ fileId: file.id, projectId });
    if (result.status === "error") {
      setMessage(result.message);
      setMessageIsError(true);
      setBusy(false);
      return;
    }
    setFiles((current) => current.filter((item) => item.id !== file.id));
    setSelected(undefined);
    setMobilePreviewOpen(false);
    setMessage(result.message);
    setMessageIsError(false);
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="project-files-loading" role="status">
        <LoaderCircle aria-hidden="true" size={20} />
        파일을 불러오는 중입니다.
      </div>
    );
  }

  return (
    <section
      aria-label="프로젝트 파일"
      className={`project-files${mobilePreviewOpen ? " is-mobile-previewing" : ""}`}
    >
      <ProjectFilesList
        busy={busy}
        files={visibleFiles}
        onFiles={(items) => void uploadFiles(items)}
        onQueryChange={setQuery}
        onReservationChange={setUploadReservationId}
        onSelect={selectFile}
        onSortChange={setSort}
        query={query}
        reservationId={uploadReservationId}
        reservations={reservations}
        selectedId={selected?.id}
        sort={sort}
        totalCount={files.length}
      />
      <ProjectFilePreview
        busy={busy}
        file={selected}
        key={selected?.id ?? "empty"}
        onBack={() => setMobilePreviewOpen(false)}
        onDelete={(file) => void deleteFile(file)}
      />
      {message && (
        <p className={`project-files__message${messageIsError ? " is-error" : ""}`} role={messageIsError ? "alert" : "status"}>
          {message}
        </p>
      )}
    </section>
  );
}
