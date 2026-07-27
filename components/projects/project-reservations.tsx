"use client";

import { CalendarCheck, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteReservationAction } from "@/app/(app)/projects/reservation-actions";
import { ProjectReservationCard } from "@/components/projects/project-reservation-card";
import { ProjectReservationForm } from "@/components/projects/project-reservation-form";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { Button } from "@/components/ui/button";
import type { ProjectReservationRow } from "@/types/database";

const formId = "project-reservation-form";

export function ProjectReservations({
  projectId,
  reservations,
}: {
  readonly projectId: string;
  readonly reservations: readonly ProjectReservationRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProjectReservationRow | "new">();
  const [deleting, setDeleting] = useState<ProjectReservationRow>();
  const [busy, setBusy] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const closeForm = useCallback(() => setEditing(undefined), []);
  const saved = useCallback(() => {
    setMessage(editing === "new" ? "예약을 추가했습니다." : "예약을 수정했습니다.");
    setError(false);
    setEditing(undefined);
    router.refresh();
  }, [editing, router]);

  async function remove(deleteLinkedEvent: boolean): Promise<void> {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      const result = await deleteReservationAction({
        deleteLinkedEvent,
        projectId,
        reservationId: deleting.id,
      });
      setError(result.status === "error");
      setMessage(result.message);
      if (result.status === "success") {
        setDeleting(undefined);
        router.refresh();
      }
    } catch {
      setError(true);
      setMessage("네트워크 연결을 확인해 주세요.");
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
        <Button onClick={() => setEditing("new")}><Plus aria-hidden="true" size={17} />예약 추가</Button>
      </div>
      {message && <p className={`project-reservations__message${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{message}</p>}
      {reservations.length ? (
        <div className="project-reservations__grid">
          {reservations.map((reservation) => (
            <ProjectReservationCard
              key={reservation.id}
              onDelete={() => setDeleting(reservation)}
              onEdit={() => setEditing(reservation)}
              reservation={reservation}
            />
          ))}
        </div>
      ) : (
        <div className="project-reservations__empty">
          <CalendarCheck aria-hidden="true" size={22} />
          <div><strong>등록된 예약이 없습니다.</strong><p>항공, 숙박, 강의실, 코트 등 필요한 예약을 추가하세요.</p></div>
        </div>
      )}
      <ResponsiveDetailPanel
        footer={<><Button disabled={formBusy} onClick={closeForm} variant="secondary">취소</Button><Button disabled={formBusy} form={formId} type="submit">{formBusy ? "저장 중" : "저장"}</Button></>}
        onClose={closeForm}
        open={Boolean(editing)}
        panelClassName="project-reservation-panel"
        title={editing === "new" ? "예약 추가" : "예약 수정"}
      >
        {editing && <ProjectReservationForm
          formId={formId}
          key={editing === "new" ? "new" : editing.id}
          onPendingChange={setFormBusy}
          onSaved={saved}
          projectId={projectId}
          {...(editing === "new" ? {} : { reservation: editing })}
        />}
      </ResponsiveDetailPanel>
      <ResponsiveDetailPanel
        footer={deleting?.linked_event_id
          ? <>
              <Button disabled={busy} onClick={() => setDeleting(undefined)} variant="secondary">취소</Button>
              <Button disabled={busy} onClick={() => void remove(false)} variant="secondary">예약만 삭제</Button>
              <Button disabled={busy} onClick={() => void remove(true)} variant="danger">일정과 함께 삭제</Button>
            </>
          : <>
              <Button disabled={busy} onClick={() => setDeleting(undefined)} variant="secondary">취소</Button>
              <Button disabled={busy} onClick={() => void remove(false)} variant="danger">예약 삭제</Button>
            </>}
        onClose={() => setDeleting(undefined)}
        open={Boolean(deleting)}
        panelClassName="project-reservation-delete-panel"
        title="예약 삭제"
      >
        <p className="project-reservation-delete-copy">
          <strong>{deleting?.title}</strong> 예약을 삭제합니다.
          {deleting?.linked_event_id && " 연결된 캘린더 일정을 함께 삭제할지 선택해 주세요."}
        </p>
      </ResponsiveDetailPanel>
    </section>
  );
}
