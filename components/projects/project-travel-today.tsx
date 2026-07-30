"use client";

import {
  CalendarClock,
  CheckCircle2,
  FileText,
  MapPin,
  NotebookPen,
  Palmtree,
  Save,
  TicketCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { createProjectFileAccessAction } from "@/app/(app)/projects/file-actions";
import { saveProjectNoteAction } from "@/app/(app)/projects/note-actions";
import { ProjectReservationIcon } from "@/components/projects/project-reservation-icon";
import { ProjectTravelActions } from "@/components/projects/project-travel-actions";
import { formatWon } from "@/lib/projects/budget";
import { buildTravelToday } from "@/lib/projects/travel";
import type {
  EventRow,
  ProjectChecklistItemRow,
  ProjectExpenseRow,
  ProjectFileRow,
  ProjectReservationRow,
  ProjectRow,
} from "@/types/database";

type ProjectTravelTodayProps = {
  readonly checklistItems: readonly ProjectChecklistItemRow[];
  readonly events: readonly EventRow[];
  readonly expenses: readonly ProjectExpenseRow[];
  readonly files: readonly ProjectFileRow[];
  readonly project: ProjectRow;
  readonly reservations: readonly ProjectReservationRow[];
  readonly today: string;
};

function timeLabel(event: EventRow): string {
  if (event.is_all_day) return "종일";
  return event.start_time?.slice(0, 5) ?? "시간 미정";
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export function ProjectTravelToday(props: ProjectTravelTodayProps) {
  const snapshot = useMemo(() => buildTravelToday(props), [props]);
  const [note, setNote] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [fileMessage, setFileMessage] = useState("");

  async function saveQuickNote(): Promise<void> {
    const content = note.trim();
    if (!content || noteBusy) return;
    setNoteBusy(true);
    setNoteMessage("");
    try {
      const result = await saveProjectNoteAction({
        content,
        isPinned: false,
        noteId: null,
        projectId: props.project.id,
        title: `여행 메모 · ${dateLabel(props.today)}`,
      });
      if (result.status === "error") {
        setNoteMessage(result.message);
        return;
      }
      setNote("");
      setNoteMessage("노트에 저장했습니다.");
    } catch (error) {
      setNoteMessage(error instanceof Error ? "노트를 저장하지 못했습니다." : "네트워크 연결을 확인해 주세요.");
    } finally {
      setNoteBusy(false);
    }
  }

  async function openTodayFile(file: ProjectFileRow): Promise<void> {
    setFileMessage("");
    try {
      const result = await createProjectFileAccessAction({
        fileId: file.id,
        mode: "preview",
        projectId: props.project.id,
      });
      if (result.status === "error" || !result.signedUrl) {
        setFileMessage(result.message);
        return;
      }
      window.open(result.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setFileMessage(error instanceof Error ? "파일을 열지 못했습니다." : "네트워크 연결을 확인해 주세요.");
    }
  }

  return (
    <section aria-labelledby="travel-today-title" className="project-travel-today">
      <header className="project-travel-today__hero">
        <span className="project-travel-today__hero-icon"><Palmtree aria-hidden="true" size={24} /></span>
        <div>
          <p>Travel Today</p>
          <h2 id="travel-today-title">{props.project.name}</h2>
        </div>
        <strong>{snapshot.dayLabel}</strong>
      </header>

      <div className="project-travel-today__grid">
        <article aria-label="오늘 일정" className="travel-today-card travel-today-card--schedule">
          <header><CalendarClock aria-hidden="true" size={18} /><h3>오늘 일정</h3></header>
          {snapshot.events.length ? (
            <div className="travel-today-schedule">
              {snapshot.events.map((event) => {
                const reservation = props.reservations.find((item) => item.linked_event_id === event.id);
                const files = props.files.filter((file) => file.reservation_id === reservation?.id);
                return (
                  <article className="travel-today-schedule__item" key={event.id}>
                    <div className="travel-today-schedule__time">{timeLabel(event)}</div>
                    <div className="travel-today-schedule__body">
                      <Link href={`/calendar?date=${props.today}&highlight=${event.id}`}>
                        <strong>{event.title}</strong>
                      </Link>
                      {(event.location || reservation?.location) && (
                        <span><MapPin aria-hidden="true" size={13} />{event.location || reservation?.location}</span>
                      )}
                      <ProjectTravelActions
                        {...(reservation ? { reservation } : {})}
                        files={files}
                        label={event.title}
                        location={event.location ?? null}
                        projectId={props.project.id}
                        showReservationLink
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <p className="travel-today-card__empty">오늘은 자유 일정입니다.</p>}
          {snapshot.nextEvent && (
            <div className="travel-today-next">
              <span>다음 일정 · {dateLabel(snapshot.nextEvent.start_date)}</span>
              <strong>{snapshot.nextEvent.title}</strong>
            </div>
          )}
        </article>

        <article className="travel-today-card">
          <header><CheckCircle2 aria-hidden="true" size={18} /><h3>오늘 체크리스트</h3></header>
          {snapshot.checklistItems.length ? (
            <ul className="travel-today-checklist">
              {snapshot.checklistItems.map((item) => <li key={item.id}>{item.title}</li>)}
            </ul>
          ) : <p className="travel-today-card__empty">오늘 마감인 항목이 없습니다.</p>}
          <Link className="travel-today-card__footer-link" href={`/projects/${props.project.id}#checklist`}>전체 체크리스트</Link>
        </article>

        <article className="travel-today-card">
          <header><WalletCards aria-hidden="true" size={18} /><h3>오늘 예산</h3></header>
          <dl className="travel-today-budget">
            <div><dt>예상 사용금액</dt><dd>{formatWon(snapshot.plannedAmount)}</dd></div>
            <div><dt>이미 사용한 금액</dt><dd>{formatWon(snapshot.paidAmount)}</dd></div>
          </dl>
          <Link className="travel-today-card__footer-link" href={`/projects/${props.project.id}#budget`}>예산 보기</Link>
        </article>

        <article className="travel-today-card travel-today-card--reservations">
          <header><TicketCheck aria-hidden="true" size={18} /><h3>오늘 필요한 예약</h3></header>
          {snapshot.reservations.length ? (
            <div className="travel-today-reservations">
              {snapshot.reservations.map((reservation) => (
                <section className="travel-today-reservation" key={reservation.id}>
                  <span><ProjectReservationIcon type={reservation.type} /></span>
                  <div>
                    <strong>{reservation.title}</strong>
                    {reservation.company && <small>{reservation.company}</small>}
                    <ProjectTravelActions
                      files={props.files.filter((file) => file.reservation_id === reservation.id)}
                      label={reservation.title}
                      projectId={props.project.id}
                      reservation={reservation}
                    />
                  </div>
                </section>
              ))}
            </div>
          ) : <p className="travel-today-card__empty">오늘 확인할 예약이 없습니다.</p>}
        </article>

        <article aria-label="오늘 필요한 파일" className="travel-today-card">
          <header><FileText aria-hidden="true" size={18} /><h3>오늘 필요한 파일</h3></header>
          {snapshot.files.length ? (
            <div className="travel-today-files">
              {snapshot.files.map((file) => (
                <button
                  aria-label={`${file.original_filename} 열기`}
                  key={file.id}
                  onClick={() => void openTodayFile(file)}
                  type="button"
                >
                  <FileText aria-hidden="true" size={16} />
                  <span>{file.original_filename}</span>
                </button>
              ))}
            </div>
          ) : <p className="travel-today-card__empty">오늘 연결된 파일이 없습니다.</p>}
          {fileMessage && <p aria-live="polite" className="travel-today-message">{fileMessage}</p>}
        </article>

        <article className="travel-today-card">
          <header><NotebookPen aria-hidden="true" size={18} /><h3>여행 빠른 메모</h3></header>
          <label className="travel-today-note">
            <span className="sr-only">여행 빠른 메모</span>
            <textarea
              aria-label="여행 빠른 메모"
              disabled={noteBusy}
              maxLength={100_000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="지금 기억해둘 내용을 남기세요."
              value={note}
            />
          </label>
          <button
            aria-label="빠른 메모 저장"
            className="button button--primary travel-today-note__save"
            disabled={noteBusy || !note.trim()}
            onClick={() => void saveQuickNote()}
            type="button"
          >
            <Save aria-hidden="true" size={16} />
            {noteBusy ? "저장 중" : "노트에 저장"}
          </button>
          {noteMessage && <p aria-live="polite" className="travel-today-message">{noteMessage}</p>}
        </article>
      </div>
    </section>
  );
}
