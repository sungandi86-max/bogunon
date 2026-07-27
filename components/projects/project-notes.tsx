"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  deleteProjectNoteAction,
  loadProjectNotesAction,
  saveProjectNoteAction,
} from "@/app/(app)/projects/note-actions";
import {
  ProjectNoteEditor,
  type ProjectNoteDraft,
} from "@/components/projects/project-note-editor";
import { ProjectNotesList } from "@/components/projects/project-notes-list";
import { filterProjectNotes, sortProjectNotes } from "@/lib/projects/notes";
import type { ProjectNoteRow } from "@/types/database";

type ProjectNotesProps = {
  readonly projectId: string;
};

function draftFromNote(note: ProjectNoteRow): ProjectNoteDraft {
  return {
    content: note.content,
    isPinned: note.is_pinned,
    noteId: note.id,
    title: note.title,
  };
}

export function ProjectNotes({ projectId }: ProjectNotesProps) {
  const [notes, setNotes] = useState<readonly ProjectNoteRow[]>([]);
  const [draft, setDraft] = useState<ProjectNoteDraft>();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  useEffect(() => {
    let active = true;

    void loadProjectNotesAction({ projectId })
      .then((result) => {
        if (!active) return;
        if (result.status === "error") {
          setMessage(result.message);
          setMessageIsError(true);
          return;
        }
        const loaded = sortProjectNotes(result.notes ?? []);
        setNotes(loaded);
        setDraft(loaded[0] ? draftFromNote(loaded[0]) : undefined);
        setMessage("");
        setMessageIsError(false);
      })
      .catch(() => {
        if (!active) return;
        setMessage("노트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setMessageIsError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  const visibleNotes = useMemo(() => filterProjectNotes(notes, query), [notes, query]);

  function selectNote(note: ProjectNoteRow): void {
    setDraft(draftFromNote(note));
    setMode("edit");
    setMessage("");
    setMobileEditorOpen(true);
  }

  function createNote(): void {
    setDraft({ content: "", isPinned: false, noteId: null, title: "" });
    setMode("edit");
    setMessage("");
    setMobileEditorOpen(true);
  }

  function cancelEditing(): void {
    const selected = notes.find((note) => note.id === draft?.noteId) ?? notes[0];
    setDraft(selected ? draftFromNote(selected) : undefined);
    setMode("edit");
    setMessage("");
    setMobileEditorOpen(false);
  }

  async function saveNote(): Promise<void> {
    if (!draft?.title.trim() || busy) return;
    setBusy(true);
    try {
      const result = await saveProjectNoteAction({
        content: draft.content,
        isPinned: draft.isPinned,
        noteId: draft.noteId,
        projectId,
        title: draft.title,
      });
      if (result.status === "error" || !result.note) {
        setMessage(result.message);
        setMessageIsError(true);
        return;
      }
      const saved = result.note;
      setNotes((current) => sortProjectNotes([
        ...current.filter((note) => note.id !== saved.id),
        saved,
      ]));
      setDraft(draftFromNote(saved));
      setMessage(result.message);
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? "네트워크 연결을 확인해 주세요." : "노트를 저장하지 못했습니다.");
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  }

  async function deleteNote(): Promise<void> {
    if (!draft?.noteId || busy || !window.confirm(`"${draft.title}" 노트를 삭제할까요?`)) return;
    setBusy(true);
    try {
      const result = await deleteProjectNoteAction({ noteId: draft.noteId, projectId });
      if (result.status === "error") {
        setMessage(result.message);
        setMessageIsError(true);
        return;
      }
      const remaining = sortProjectNotes(notes.filter((note) => note.id !== draft.noteId));
      setNotes(remaining);
      setDraft(remaining[0] ? draftFromNote(remaining[0]) : undefined);
      setMessage(result.message);
      setMessageIsError(false);
      setMobileEditorOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? "네트워크 연결을 확인해 주세요." : "노트를 삭제하지 못했습니다.");
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="project-notes-loading" role="status">
        <LoaderCircle aria-hidden="true" size={20} />
        노트를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <section
      aria-label="프로젝트 노트"
      className={`project-notes${mobileEditorOpen ? " is-mobile-editing" : ""}`}
    >
      <ProjectNotesList
        notes={visibleNotes}
        onCreate={createNote}
        onQueryChange={setQuery}
        onSelect={selectNote}
        query={query}
        selectedId={draft?.noteId ?? undefined}
        totalCount={notes.length}
      />
      <ProjectNoteEditor
        busy={busy}
        draft={draft}
        message={message}
        messageIsError={messageIsError}
        mode={mode}
        onCancel={cancelEditing}
        onChange={setDraft}
        onDelete={() => void deleteNote()}
        onModeChange={setMode}
        onSave={() => void saveNote()}
      />
    </section>
  );
}
