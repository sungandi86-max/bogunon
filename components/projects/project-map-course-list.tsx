"use client";

import { ArrowDown, ArrowUp, Check, ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { groupProjectPlacesByDay, PLACE_CATEGORY_LABELS, type ProjectMapDay } from "@/lib/projects/places";
import type { ProjectPlaceRow } from "@/types/database";

function dateLabel(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  return `${value.getMonth() + 1}월 ${value.getDate()}일`;
}

function routeUrl(place: ProjectPlaceRow): string {
  if (place.latitude !== null && place.longitude !== null) return `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
  return `https://map.kakao.com/?q=${encodeURIComponent(place.address || place.name)}`;
}

export type ProjectMapCourseListProps = {
  readonly days: readonly ProjectMapDay[];
  readonly onDelete: (place: ProjectPlaceRow) => void;
  readonly onEdit: (place: ProjectPlaceRow) => void;
  readonly onMove: (placeId: string, date: string | null, targetIndex: number) => void;
  readonly onSelect: (placeId: string) => void;
  readonly onToggleVisited: (place: ProjectPlaceRow) => void;
  readonly places: readonly ProjectPlaceRow[];
  readonly selectedId?: string;
};

export function ProjectMapCourseList({ days, onDelete, onEdit, onMove, onSelect, onToggleVisited, places, selectedId }: ProjectMapCourseListProps) {
  const [draggedId, setDraggedId] = useState<string>();
  const dayNumbers = new Map(days.map((day) => [day.date, day.dayNumber]));
  const groups = groupProjectPlacesByDay(places);

  useEffect(() => {
    if (!selectedId) return;
    const selectedElement = document.getElementById(`project-map-place-${selectedId}`);
    if (typeof selectedElement?.scrollIntoView === "function") selectedElement.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <div aria-label="이번 여행 코스" className="project-map-course">
      <div className="project-map-course__heading"><strong>이번 여행 코스</strong><span>{places.length}곳</span></div>
      {groups.length === 0 && <p className="project-map-course__empty">선택한 조건에 해당하는 장소가 없습니다.</p>}
      {groups.map((group) => (
        <section className="project-map-day" key={group.date ?? "undated"}>
          <h3>{group.date ? <><b>DAY {dayNumbers.get(group.date) ?? 1}</b><span>{dateLabel(group.date)}</span></> : <span>날짜 미정</span>}</h3>
          <ol className="project-map-list">
            {group.places.map((place, index) => (
              <li
                aria-label={`${place.name} 코스`}
                className={selectedId === place.id ? "is-selected" : ""}
                draggable
                id={`project-map-place-${place.id}`}
                key={place.id}
                onDragEnd={() => setDraggedId(undefined)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggedId(place.id)}
                onDrop={() => { if (draggedId && draggedId !== place.id) onMove(draggedId, group.date, index); }}
              >
                <button aria-pressed={selectedId === place.id} className="project-map-list__main" onClick={() => onSelect(place.id)} type="button">
                  <span className="project-map-list__number">{index + 1}</span>
                  <span>
                    <strong>{place.name}</strong>
                    <small>{place.visited_time ? place.visited_time.slice(0, 5) : null}{place.visited_time ? " · " : null}{PLACE_CATEGORY_LABELS[place.category]} · {place.is_visited ? "방문 완료" : "방문 예정"}</small>
                    {place.address && <small>{place.address}</small>}
                  </span>
                </button>
                <span aria-hidden="true" className="project-map-list__handle"><GripVertical size={17} /></span>
                <div className="project-map-list__actions">
                  <a aria-label={`${place.name} 길찾기`} href={routeUrl(place)} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" size={16} /></a>
                  <button aria-label={place.is_visited ? "방문 예정으로 변경" : "방문 완료"} onClick={() => onToggleVisited(place)} type="button"><Check aria-hidden="true" size={16} /></button>
                  <button aria-label={`${place.name} 수정`} onClick={() => onEdit(place)} type="button"><Pencil aria-hidden="true" size={16} /></button>
                  <button aria-label={`${place.name} 삭제`} onClick={() => onDelete(place)} type="button"><Trash2 aria-hidden="true" size={16} /></button>
                </div>
                <div className="project-map-list__move">
                  <button aria-label={`${place.name} 위로`} disabled={index === 0} onClick={() => onMove(place.id, group.date, index - 1)} type="button"><ArrowUp aria-hidden="true" size={16} /></button>
                  <button aria-label={`${place.name} 아래로`} disabled={index === group.places.length - 1} onClick={() => onMove(place.id, group.date, index + 1)} type="button"><ArrowDown aria-hidden="true" size={16} /></button>
                </div>
                {place.memo && <p>{place.memo}</p>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
