"use client";

import {
  CalendarDays,
  ExternalLink,
  Link2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";

import { ProjectReservationIcon } from "@/components/projects/project-reservation-icon";
import { ProjectTravelActions } from "@/components/projects/project-travel-actions";
import {
  formatReservationPeriod,
  RESERVATION_TYPES,
} from "@/lib/projects/reservations";
import type { ProjectFileRow, ProjectReservationRow } from "@/types/database";

export function ProjectReservationCard({
  files = [],
  onDelete,
  onEdit,
  reservation,
}: {
  readonly files?: readonly ProjectFileRow[];
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly reservation: ProjectReservationRow;
}) {
  const typeLabel = RESERVATION_TYPES.find((item) => item.value === reservation.type)?.label ?? "기타";

  return (
    <article className="project-reservation-card">
      <div className="project-reservation-card__icon">
        <ProjectReservationIcon type={reservation.type} />
      </div>
      <div className="project-reservation-card__content">
        <span className="project-reservation-card__type">{typeLabel}</span>
        <h3>{reservation.title}</h3>
        <div className="project-reservation-card__schedule">
          <span>
            <CalendarDays aria-hidden="true" size={14} />
            {formatReservationPeriod(reservation)}
          </span>
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
        <ProjectTravelActions
          files={files}
          label={reservation.title}
          projectId={reservation.project_id}
          reservation={reservation}
        />
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
