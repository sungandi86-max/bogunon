"use client";

import { CalendarCheck, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteReservationAction } from "@/app/(app)/projects/reservation-actions";
import { ProjectReservationCard } from "@/components/projects/project-reservation-card";
import { ProjectReservationForm } from "@/components/projects/project-reservation-form";
import { ProjectReservationIcon } from "@/components/projects/project-reservation-icon";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { Button } from "@/components/ui/button";
import type { ProjectExpenseRow, ProjectFileRow, ProjectReservationRow } from "@/types/database";
import type { ReservationType } from "@/lib/projects/reservations";

const formId = "project-reservation-form";
const RESERVATION_SUGGESTIONS: readonly { readonly label: string; readonly type: ReservationType }[] = [
  { label: "숙박", type: "hotel" },
  { label: "항공", type: "flight" },
  { label: "렌터카", type: "rental_car" },
  { label: "식당", type: "restaurant" },
  { label: "운동", type: "badminton" },
];

type ReservationEditor = ProjectReservationRow | { readonly type: ReservationType };

function isExistingReservation(editor: ReservationEditor): editor is ProjectReservationRow {
  return "id" in editor;
}

export function ProjectReservations({
  expenses,
  files = [],
  projectId,
  projectName,
  reservations,
}: {
  readonly expenses: readonly ProjectExpenseRow[];
  readonly files?: readonly ProjectFileRow[];
  readonly projectId: string;
  readonly projectName?: string;
  readonly reservations: readonly ProjectReservationRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ReservationEditor>();
  const [deleting, setDeleting] = useState<ProjectReservationRow>();
  const [busy, setBusy] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [deleteLinkedEvent, setDeleteLinkedEvent] = useState(false);
  const [deleteLinkedExpense, setDeleteLinkedExpense] = useState(false);

  const closeForm = useCallback(() => setEditing(undefined), []);
  const saved = useCallback(() => {
    setMessage(editing && isExistingReservation(editing) ? "예약을 수정했습니다." : "예약을 추가했습니다.");
    setError(false);
    setEditing(undefined);
    router.refresh();
  }, [editing, router]);

  function startCreate(type: ReservationType): void {
    setEditing({ type });
  }

  function requestDelete(reservation: ProjectReservationRow): void {
    setDeleteLinkedEvent(false);
    setDeleteLinkedExpense(false);
    setDeleting(reservation);
  }

  async function remove(): Promise<void> {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      const result = await deleteReservationAction({
        deleteLinkedEvent,
        deleteLinkedExpense,
        projectId,
        reservationId: deleting.id,
      });
      setError(result.status === "error");
      setMessage(result.message);
      if (result.status === "success") {
        setDeleting(undefined);
        router.refresh();
      }
    } catch (caught) {
      setError(true);
      setMessage(
        caught instanceof Error
          ? "예약을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요."
          : "네트워크 연결을 확인해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="project-reservations-title" className="project-reservations">
      <div className="project-reservations__heading">
        <div>
          <h2 id="project-reservations-title">예약 <span>{reservations.length}</span></h2>
          <p>프로젝트와 관련된 예약 정보를 한곳에서 관리합니다.</p>
        </div>
        <Button onClick={() => startCreate("flight")}><Plus aria-hidden="true" size={17} />예약 추가</Button>
      </div>
      {message && <p className={`project-reservations__message${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{message}</p>}
      {reservations.length ? (
        <div className="project-reservations__grid">
          {reservations.map((reservation) => (
            <ProjectReservationCard
              key={reservation.id}
              files={files.filter((file) => file.reservation_id === reservation.id)}
              onDelete={() => requestDelete(reservation)}
              onEdit={() => setEditing(reservation)}
              reservation={reservation}
            />
          ))}
        </div>
      ) : (
        <div className="workspace-action-empty project-reservations__empty">
          <div className="workspace-action-empty__intro">
            <span className="workspace-action-empty__icon"><CalendarCheck aria-hidden="true" size={22} /></span>
            <div><h3>등록된 예약이 없습니다.</h3><p>필요한 예약 유형부터 바로 추가하세요.</p></div>
          </div>
          <div className="project-reservations__suggestions">
            {RESERVATION_SUGGESTIONS.map((suggestion) => (
              <button
                aria-label={`${suggestion.label} 예약 추가`}
                key={suggestion.type}
                onClick={() => startCreate(suggestion.type)}
                type="button"
              >
                <ProjectReservationIcon type={suggestion.type} />
                <span>{suggestion.label}</span>
                <Plus aria-hidden="true" size={15} />
              </button>
            ))}
          </div>
        </div>
      )}
      <ResponsiveDetailPanel
        footer={<><Button disabled={formBusy} onClick={closeForm} variant="secondary">취소</Button><Button disabled={formBusy} form={formId} type="submit">{formBusy ? "저장 중" : "저장"}</Button></>}
        onClose={closeForm}
        open={Boolean(editing)}
        panelClassName="project-reservation-panel"
        title={editing && isExistingReservation(editing) ? "예약 수정" : "예약 추가"}
      >
        {editing && <ProjectReservationForm
          formId={formId}
          key={isExistingReservation(editing) ? editing.id : `new-${editing.type}`}
          {...(isExistingReservation(editing)
            ? {
                linkedExpense: expenses.find((expense) => expense.reservation_id === editing.id),
                reservation: editing,
              }
            : {
                initialType: editing.type,
              })}
          onPendingChange={setFormBusy}
          onSaved={saved}
          projectId={projectId}
          {...(projectName ? { projectName } : {})}
        />}
      </ResponsiveDetailPanel>
      <ResponsiveDetailPanel
        footer={<>
          <Button disabled={busy} onClick={() => setDeleting(undefined)} variant="secondary">취소</Button>
          <Button disabled={busy} onClick={() => void remove()} variant="danger">예약 삭제</Button>
        </>}
        onClose={() => setDeleting(undefined)}
        open={Boolean(deleting)}
        panelClassName="project-reservation-delete-panel"
        title="예약 삭제"
      >
        <p className="project-reservation-delete-copy">
          <strong>{deleting?.title}</strong> 예약을 삭제합니다.
        </p>
        {deleting?.linked_event_id && (
          <label className="project-reservation-delete-option">
            <input
              checked={deleteLinkedEvent}
              onChange={(event) => setDeleteLinkedEvent(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>연결된 캘린더 일정도 함께 삭제</span>
          </label>
        )}
        {deleting && expenses.some((expense) => expense.reservation_id === deleting.id) && (
          <label className="project-reservation-delete-option">
            <input
              checked={deleteLinkedExpense}
              onChange={(event) => setDeleteLinkedExpense(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>연결된 지출도 함께 삭제</span>
          </label>
        )}
        {(deleting?.linked_event_id || (deleting && expenses.some((expense) => expense.reservation_id === deleting.id))) && (
          <p className="project-reservation-form__sync-note">선택하지 않은 연결 항목은 그대로 유지됩니다.</p>
        )}
      </ResponsiveDetailPanel>
    </section>
  );
}
