"use client";

import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Link2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";

import { ProjectReservationIcon } from "@/components/projects/project-reservation-icon";
import { RESERVATION_TYPES } from "@/lib/projects/reservations";
import type { ProjectReservationRow } from "@/types/database";

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function displayTime(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null;
  const start = startTime.slice(0, 5);
  return endTime ? `${start} ~ ${endTime.slice(0, 5)}` : start;
}

export function ProjectReservationCard({
  onDelete,
  onEdit,
  reservation,
}: {
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly reservation: ProjectReservationRow;
}) {
  const typeLabel = RESERVATION_TYPES.find((item) => item.value === reservation.type)?.label ?? "기타";
  const time = displayTime(reservation.start_time, reservation.end_time);

  return (
    <article className="project-reservation-card">
      <div className="project-reservation-card__icon">
        <ProjectReservationIcon type={reservation.type} />
      </div>
      <div className="project-reservation-card__content">
        <span className="project-reservation-card__type">{typeLabel}</span>
        <h3>{reservation.title}</h3>
        <div className="project-reservation-card__schedule">
          <span><CalendarDays aria-hidden="true" size={14} />{displayDate(reservation.reservation_date)}</span>
          {time && <span><Clock3 aria-hidden="true" size={14} />{time}</span>}
        </div>
        {reservation.company && <p className="project-reservation-card__company">{reservation.company}</p>}
        <div className="project-reservation-card__meta">
          {reservation.confirmation_number && <span>예약번호 {reservation.confirmation_number}</span>}
          {reservation.location && <span><MapPin aria-hidden="true" size={13} />{reservation.location}</span>}
          {reservation.phone && <span><Phone aria-hidden="true" size={13} />{reservation.phone}</span>}
          {reservation.website && (
            <a href={reservation.website} rel="noreferrer" target="_blank">
              <ExternalLink aria-hidden="true" size={13} />웹사이트
            </a>
          )}
        </div>
        {reservation.memo && <p className="project-reservation-card__memo">{reservation.memo}</p>}
        {reservation.linked_event_id && <span className="project-reservation-card__linked"><Link2 aria-hidden="true" size={13} />캘린더 일정 연결됨</span>}
      </div>
      <details className="project-reservation-card__menu">
        <summary aria-label={`${reservation.title} 예약 메뉴`}><MoreHorizontal aria-hidden="true" size={18} /></summary>
        <div>
          <button onClick={onEdit} type="button"><Pencil aria-hidden="true" size={15} />수정</button>
          <button className="danger-text" onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={15} />삭제</button>
        </div>
      </details>
    </article>
  );
}
