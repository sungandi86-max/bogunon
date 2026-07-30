"use client";

import { Eye, EyeOff, ListChecks, Plus, Trash2 } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";

import {
  createChecklistItemAction,
  deleteChecklistItemAction,
  deleteCompletedChecklistItemsAction,
  reorderProjectChecklistItemsAction,
  updateChecklistItemAction,
} from "@/app/(app)/projects/checklist-actions";
import { ProjectChecklistItem } from "@/components/projects/project-checklist-item";
import {
  normalizeChecklistOrder,
  placeChecklistItem,
} from "@/lib/projects/checklist";
import {
  checklistRecommendationsFor,
} from "@/lib/projects/workspace-presets";
import type { ProjectType } from "@/lib/projects/domain";
import { Button } from "@/components/ui/button";
import type { ProjectChecklistItemRow } from "@/types/database";

interface Props {
  readonly desktopDragEnabled?: boolean;
  readonly initialItems: readonly ProjectChecklistItemRow[];
  readonly projectId: string;
  readonly projectType?: ProjectType;
  readonly today: string;
}

export function ProjectChecklist({
  desktopDragEnabled: desktopOverride,
  initialItems,
  projectId,
  projectType,
  today,
}: Props) {
  const [items, setItems] = useState(() => normalizeChecklistOrder(initialItems));
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [draggedId, setDraggedId] = useState<string>();
  const [desktopDragEnabled, setDesktopDragEnabled] = useState(desktopOverride ?? false);
  const effectiveDesktopDragEnabled = desktopOverride ?? desktopDragEnabled;
  const recommendations = projectType ? checklistRecommendationsFor(projectType) : [];
  const completedCount = items.filter((item) => item.is_completed).length;
  const visibleItems = showCompleted ? items : items.filter((item) => !item.is_completed);

  useEffect(() => {
    if (desktopOverride !== undefined) return;
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setDesktopDragEnabled(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [desktopOverride]);

  function showResult(result: { readonly status: "success" | "error"; readonly message: string }): void {
    setError(result.status === "error");
    setMessage(result.message);
  }

  async function addItem(): Promise<void> {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const result = await createChecklistItemAction({
        dueDate: dueDate || null,
        projectId,
        title,
      });
      showResult(result);
      if (result.status === "success" && result.item) {
        const createdItem = result.item;
        setItems((current) => normalizeChecklistOrder([...current, createdItem]));
        setTitle("");
        setDueDate("");
      }
    } catch (actionError) {
      setError(true);
      setMessage(actionError instanceof Error ? "네트워크 연결을 확인해 주세요." : "항목을 추가하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function addRecommendations(): Promise<void> {
    if (busy || !recommendations.length) return;
    setBusy(true);
    const createdItems: ProjectChecklistItemRow[] = [];
    try {
      for (const recommendation of recommendations) {
        const result = await createChecklistItemAction({
          dueDate: null,
          projectId,
          title: recommendation,
        });
        if (result.status === "error" || !result.item) {
          if (createdItems.length) {
            setItems((current) => normalizeChecklistOrder([...current, ...createdItems]));
          }
          showResult(result);
          return;
        }
        createdItems.push(result.item);
      }
      setItems((current) => normalizeChecklistOrder([...current, ...createdItems]));
      showResult({ message: `추천 항목 ${createdItems.length}개를 추가했습니다.`, status: "success" });
    } catch (actionError) {
      if (createdItems.length) {
        setItems((current) => normalizeChecklistOrder([...current, ...createdItems]));
      }
      setError(true);
      setMessage(actionError instanceof Error ? "네트워크 연결을 확인해 주세요." : "추천 항목을 추가하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function updateItem(
    itemId: string,
    changes: { readonly title?: string; readonly isCompleted?: boolean; readonly dueDate?: string | null },
  ): Promise<boolean> {
    const previous = items;
    setItems((current) => current.map((item) => item.id === itemId ? {
      ...item,
      ...(changes.title !== undefined ? { title: changes.title.trim() } : {}),
      ...(changes.isCompleted !== undefined ? { is_completed: changes.isCompleted } : {}),
      ...(changes.dueDate !== undefined ? { due_date: changes.dueDate } : {}),
    } : item));
    setBusy(true);
    try {
      const result = await updateChecklistItemAction({ ...changes, itemId, projectId });
      showResult(result);
      if (result.status === "error") {
        setItems(previous);
        return false;
      }
      if (result.item) {
        const updatedItem = result.item;
        setItems((current) => current.map((item) => item.id === itemId ? updatedItem : item));
      }
      return true;
    } catch (actionError) {
      setItems(previous);
      setError(true);
      setMessage(actionError instanceof Error ? "네트워크 연결을 확인해 주세요." : "항목을 수정하지 못했습니다.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(itemId: string): Promise<void> {
    const previous = items;
    setItems((current) => normalizeChecklistOrder(current.filter((item) => item.id !== itemId)));
    setBusy(true);
    try {
      const result = await deleteChecklistItemAction({ itemId, projectId });
      showResult(result);
      if (result.status === "error") setItems(previous);
    } catch (actionError) {
      setItems(previous);
      setError(true);
      setMessage(actionError instanceof Error ? "네트워크 연결을 확인해 주세요." : "항목을 삭제하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function saveOrder(next: ProjectChecklistItemRow[], previous: ProjectChecklistItemRow[]): Promise<void> {
    if (next.map((item) => item.id).join() === previous.map((item) => item.id).join()) return;
    setItems(next);
    setBusy(true);
    try {
      const result = await reorderProjectChecklistItemsAction({
        itemIds: next.map((item) => item.id),
        projectId,
      });
      showResult(result);
      if (result.status === "error") setItems(previous);
    } catch (actionError) {
      setItems(previous);
      setError(true);
      setMessage(actionError instanceof Error ? "네트워크 연결을 확인해 주세요." : "순서를 저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCompleted(): Promise<void> {
    if (!completedCount || !window.confirm(`완료한 ${completedCount}개 항목을 모두 삭제할까요?`)) return;
    const previous = items;
    setItems((current) => normalizeChecklistOrder(current.filter((item) => !item.is_completed)));
    setBusy(true);
    try {
      const result = await deleteCompletedChecklistItemsAction({ projectId });
      showResult(result);
      if (result.status === "error") setItems(previous);
    } catch (actionError) {
      setItems(previous);
      setError(true);
      setMessage(actionError instanceof Error ? "네트워크 연결을 확인해 주세요." : "완료 항목을 삭제하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void addItem();
  }

  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void addItem();
  }

  return (
    <section aria-labelledby="project-checklist-title" className="project-checklist">
      <div className="project-checklist__heading">
        <div>
          <h2 id="project-checklist-title">체크리스트 <span>{completedCount}/{items.length}</span></h2>
          <p>프로젝트에서 빠뜨리지 말아야 할 일을 정리합니다.</p>
        </div>
        <div className="project-checklist__tools">
          <button
            aria-label={showCompleted ? "완료 항목 숨기기" : "완료 항목 보이기"}
            aria-pressed={!showCompleted}
            disabled={!completedCount}
            onClick={() => setShowCompleted((current) => !current)}
            type="button"
          >{showCompleted ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}{showCompleted ? "완료 숨기기" : "완료 보기"}</button>
          <button className="danger-text" disabled={!completedCount || busy} onClick={() => void deleteCompleted()} type="button"><Trash2 aria-hidden="true" size={16} />완료 항목 삭제</button>
        </div>
      </div>
      <form className="project-checklist__add" onSubmit={handleSubmit}>
        <label>
          <span className="sr-only">새 체크리스트 항목</span>
          <input
            aria-label="새 체크리스트 항목"
            disabled={busy}
            maxLength={300}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={handleTitleKeyDown}
            placeholder="새 항목 입력 후 Enter"
            value={title}
          />
        </label>
        <label className="project-checklist__due-input">
          <span>마감일</span>
          <input disabled={busy} onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
        </label>
        <button aria-label="체크리스트 항목 추가" className="button button--primary" disabled={busy || !title.trim()} type="submit"><Plus aria-hidden="true" size={17} />추가</button>
      </form>
      {message && <p className={`project-checklist__message${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{message}</p>}
      {!showCompleted && completedCount > 0 && <p className="project-checklist__hidden-note">완료 항목 {completedCount}개를 숨겼습니다.</p>}
      {!items.length && recommendations.length > 0 && (
        <div className="project-checklist__recommendations">
          <div>
            <span className="workspace-action-empty__icon"><ListChecks aria-hidden="true" size={20} /></span>
            <div><strong>추천 체크리스트</strong><p>프로젝트를 시작할 때 자주 필요한 항목입니다.</p></div>
          </div>
          <ul>
            {recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
          </ul>
          <Button
            aria-label="추천 항목 모두 추가"
            disabled={busy}
            onClick={() => void addRecommendations()}
            variant="secondary"
          >
            <Plus aria-hidden="true" size={17} />모두 추가
          </Button>
        </div>
      )}
      {visibleItems.length ? (
        <ul className="project-checklist__list">
          {visibleItems.map((item, index) => (
            <ProjectChecklistItem
              busy={busy}
              desktopDragEnabled={effectiveDesktopDragEnabled}
              dragging={draggedId === item.id}
              first={index === 0}
              item={item}
              key={item.id}
              last={index === visibleItems.length - 1}
              onDelete={() => removeItem(item.id)}
              onDragEnd={() => setDraggedId(undefined)}
              onDragStart={() => setDraggedId(item.id)}
              onDrop={() => {
                const currentDraggedId = draggedId;
                setDraggedId(undefined);
                if (currentDraggedId) void saveOrder(placeChecklistItem(items, currentDraggedId, item.id), items);
              }}
              onMove={(offset) => {
                const target = visibleItems[index + offset];
                if (target) void saveOrder(placeChecklistItem(items, item.id, target.id), items);
              }}
              onUpdate={(changes) => updateItem(item.id, changes)}
              today={today}
            />
          ))}
        </ul>
      ) : <div className="project-checklist__empty">{items.length ? "표시할 미완료 항목이 없습니다." : recommendations.length ? "추천을 한 번에 추가하거나 필요한 항목부터 입력하세요." : "첫 체크리스트 항목을 추가해 보세요."}</div>}
    </section>
  );
}
