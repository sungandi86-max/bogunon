"use client";

import { ArrowDown, ArrowUp, Check, ExternalLink, GripVertical, Map, MapPin, Pencil, Plus, Route, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { deletePlaceAction, reorderPlacesAction, togglePlaceVisitedAction } from "@/app/(app)/projects/place-actions";
import { ProjectPlaceForm } from "@/components/projects/project-place-form";
import { ProjectPlaceMap } from "@/components/projects/project-place-map";
import { PLACE_CATEGORY_LABELS, sortProjectPlaces } from "@/lib/projects/places";
import type { EventRow, ProjectPlaceRow, ProjectReservationRow, ProjectRow } from "@/types/database";

type VisitFilter = "all" | "planned" | "visited";

function dateLabel(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  return `${value.getMonth() + 1}월 ${value.getDate()}일`;
}

function routeUrl(place: ProjectPlaceRow): string {
  if (place.latitude !== null && place.longitude !== null) return `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
  return `https://map.kakao.com/?q=${encodeURIComponent(place.address || place.name)}`;
}

function projectDurationDays(project: ProjectRow, fallbackDates: readonly string[]): number {
  if (!project.start_date || !project.end_date) return fallbackDates.length;
  const start = Date.parse(`${project.start_date}T00:00:00Z`);
  const end = Date.parse(`${project.end_date}T00:00:00Z`);
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
}

export function ProjectMap({ events, initialPlaces, project, reservations, seedEventId, seedReservationId, today, travelMode }: {
  readonly events: readonly EventRow[];
  readonly initialPlaces: readonly ProjectPlaceRow[];
  readonly project: ProjectRow;
  readonly reservations: readonly ProjectReservationRow[];
  readonly seedEventId?: string;
  readonly seedReservationId?: string;
  readonly today: string;
  readonly travelMode: boolean;
}) {
  const travelEnded = travelMode && Boolean(project.end_date && project.end_date < today);
  const [places, setPlaces] = useState<readonly ProjectPlaceRow[]>(initialPlaces);
  const [date, setDate] = useState("all");
  const [visitFilter, setVisitFilter] = useState<VisitFilter>(travelEnded ? "visited" : "all");
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedId, setSelectedId] = useState<string>();
  const [editing, setEditing] = useState<ProjectPlaceRow>();
  const [sourceEvent, setSourceEvent] = useState<EventRow | undefined>(() => events.find((item) => item.id === seedEventId));
  const [sourceReservation, setSourceReservation] = useState<ProjectReservationRow | undefined>(() => reservations.find((item) => item.id === seedReservationId));
  const [formOpen, setFormOpen] = useState(Boolean(seedEventId || seedReservationId));
  const [message, setMessage] = useState("");
  const [draggedId, setDraggedId] = useState<string>();

  const dates = useMemo(() => [...new Set(places.flatMap((place) => place.visited_date ? [place.visited_date] : []))].sort(), [places]);
  const filtered = useMemo(() => sortProjectPlaces(places.filter((place) => (date === "all" || place.visited_date === date)
    && (visitFilter === "all" || (visitFilter === "visited") === place.is_visited))), [date, places, visitFilter]);
  const selected = places.find((place) => place.id === selectedId);
  const visited = places.filter((place) => place.is_visited);

  const selectPlace = useCallback((placeId: string) => setSelectedId(placeId), []);

  function closeForm(): void {
    setFormOpen(false); setEditing(undefined); setSourceEvent(undefined); setSourceReservation(undefined);
    const url = new URL(window.location.href); url.searchParams.delete("placeEvent"); url.searchParams.delete("placeReservation");
    window.history.replaceState(null, "", `${url.pathname}${url.search}#map`);
  }

  function handleSaved(place: ProjectPlaceRow, savedMessage: string): void {
    setPlaces((current) => current.some((item) => item.id === place.id)
      ? current.map((item) => item.id === place.id ? place : item)
      : [...current, place]);
    setSelectedId(place.id); setMessage(savedMessage); closeForm();
  }

  async function removePlace(place: ProjectPlaceRow): Promise<void> {
    if (!window.confirm(`"${place.name}" 장소를 삭제할까요?`)) return;
    const result = await deletePlaceAction({ projectId: project.id, placeId: place.id });
    setMessage(result.message);
    if (result.status === "success") setPlaces((current) => current.filter((item) => item.id !== place.id));
  }

  async function toggleVisited(place: ProjectPlaceRow): Promise<void> {
    const result = await togglePlaceVisitedAction({ projectId: project.id, placeId: place.id, isVisited: !place.is_visited });
    setMessage(result.message);
    if (result.status === "success" && result.place) setPlaces((current) => current.map((item) => item.id === place.id ? result.place ?? item : item));
  }

  async function moveTo(placeId: string, target: number): Promise<void> {
    const group = filtered;
    const index = group.findIndex((place) => place.id === placeId);
    if (index < 0 || target < 0 || target >= group.length) return;
    const orderedGroup = [...group];
    const [moved] = orderedGroup.splice(index, 1);
    if (!moved) return;
    orderedGroup.splice(target, 0, moved);
    const groupIds = new Set(group.map((place) => place.id));
    const queue = [...orderedGroup];
    const orderedAll = places.map((place) => groupIds.has(place.id) ? queue.shift() ?? place : place);
    const previous = places;
    const next = orderedAll.map((place, sortOrder) => ({ ...place, sort_order: sortOrder }));
    setPlaces(next);
    const result = await reorderPlacesAction({ projectId: project.id, placeIds: orderedAll.map((place) => place.id) });
    setMessage(result.message);
    if (result.status === "error") setPlaces(previous);
  }

  return (
    <section className="project-map-workspace">
      {travelEnded && <div className="project-map-summary"><div><Route aria-hidden="true" size={20} /><span><strong>{project.name} 기록</strong><small>방문한 장소 {visited.length}곳 · 여행 기간 {projectDurationDays(project, dates)}일</small></span></div>{visited.length > 0 && <p>첫 장소 {sortProjectPlaces(visited)[0]?.name} · 마지막 장소 {sortProjectPlaces(visited).at(-1)?.name}</p>}</div>}
      <div className="project-map-toolbar"><div><h2>프로젝트 지도</h2><p>직접 저장한 장소만 날짜별 코스로 연결합니다.</p></div><button className="button button--primary" onClick={() => { setEditing(undefined); setFormOpen(true); }} type="button"><Plus aria-hidden="true" size={17} />장소 추가</button></div>
      <div className="project-map-filters"><div aria-label="방문 날짜" className="project-map-date-filter"><button aria-pressed={date === "all"} onClick={() => setDate("all")} type="button">전체</button>{dates.map((item) => <button aria-pressed={date === item} key={item} onClick={() => setDate(item)} type="button">{dateLabel(item)}</button>)}</div><div aria-label="방문 상태" className="project-map-visit-filter">{(["all", "planned", "visited"] as const).map((filter) => <button aria-pressed={visitFilter === filter} key={filter} onClick={() => setVisitFilter(filter)} type="button">{{ all: "전체 장소", planned: "방문 예정", visited: "방문 완료" }[filter]}</button>)}</div></div>
      <div aria-label="지도 보기 방식" className="project-map-view-switch"><button aria-pressed={view === "map"} onClick={() => setView("map")} type="button"><Map aria-hidden="true" size={16} />지도</button><button aria-pressed={view === "list"} onClick={() => setView("list")} type="button"><Route aria-hidden="true" size={16} />목록</button></div>
      {message && <p aria-live="polite" className="form-message">{message}</p>}
      <div className={`project-map-layout project-map-layout--${view}`}>
        <div className="project-map-canvas"><ProjectPlaceMap onSelect={selectPlace} places={filtered} {...(selectedId ? { selectedId } : {})} />{filtered.some((place) => place.latitude === null) && <p><MapPin aria-hidden="true" size={14} />좌표가 없는 장소는 목록에만 표시됩니다.</p>}</div>
        <ol className="project-map-list">{filtered.map((place, index) => <li className={selectedId === place.id ? "is-selected" : ""} draggable onDragEnd={() => setDraggedId(undefined)} onDragOver={(event) => event.preventDefault()} onDragStart={() => setDraggedId(place.id)} onDrop={() => { if (draggedId && draggedId !== place.id) void moveTo(draggedId, index); }} key={place.id}>
          <button className="project-map-list__main" onClick={() => setSelectedId(place.id)} type="button"><span className="project-map-list__number">{index + 1}</span><span><strong>{place.name}</strong><small>{place.visited_date ? dateLabel(place.visited_date) : "날짜 미정"}{place.visited_time ? ` · ${place.visited_time.slice(0, 5)}` : ""} · {PLACE_CATEGORY_LABELS[place.category]}</small>{place.address && <small>{place.address}</small>}</span></button>
          <span className="project-map-list__handle"><GripVertical aria-hidden="true" size={17} /></span>
          <div className="project-map-list__actions"><a aria-label={`${place.name} 길찾기`} href={routeUrl(place)} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" size={16} /></a><button aria-label={place.is_visited ? "방문 예정으로 변경" : "방문 완료"} onClick={() => void toggleVisited(place)} type="button"><Check aria-hidden="true" size={16} /></button><button aria-label={`${place.name} 수정`} onClick={() => { setEditing(place); setFormOpen(true); }} type="button"><Pencil aria-hidden="true" size={16} /></button><button aria-label={`${place.name} 삭제`} onClick={() => void removePlace(place)} type="button"><Trash2 aria-hidden="true" size={16} /></button></div>
          <div className="project-map-list__move"><button aria-label={`${place.name} 위로`} disabled={index === 0} onClick={() => void moveTo(place.id, index - 1)} type="button"><ArrowUp aria-hidden="true" size={16} /></button><button aria-label={`${place.name} 아래로`} disabled={index === filtered.length - 1} onClick={() => void moveTo(place.id, index + 1)} type="button"><ArrowDown aria-hidden="true" size={16} /></button></div>
          {place.memo && <p>{place.memo}</p>}
        </li>)}</ol>
      </div>
      {selected && <div className="project-map-selected"><div><strong>{selected.name}</strong><span>{selected.visited_date ? dateLabel(selected.visited_date) : "날짜 미정"}{selected.visited_time ? ` · ${selected.visited_time.slice(0, 5)}` : ""} · {PLACE_CATEGORY_LABELS[selected.category]}</span>{selected.memo && <p>{selected.memo}</p>}</div><div><span>{selected.is_visited ? "방문 완료" : "방문 예정"}</span><a href={routeUrl(selected)} rel="noreferrer" target="_blank">길찾기</a>{selected.event_id && <a href={`/calendar?date=${selected.visited_date ?? today}&highlight=${selected.event_id}`}>연결 일정 보기</a>}{selected.reservation_id && <a href="#reservations">연결 예약 보기</a>}<button onClick={() => void toggleVisited(selected)} type="button">{selected.is_visited ? "방문 예정으로 변경" : "방문 완료"}</button><button onClick={() => { setEditing(selected); setFormOpen(true); }} type="button">수정</button></div></div>}
      {places.length === 0 && !formOpen && <div className="empty-state"><MapPin aria-hidden="true" size={24} /><h3>아직 저장한 장소가 없습니다.</h3><p>장소를 추가하면 날짜별 방문 순서와 코스를 지도에서 확인할 수 있습니다.</p></div>}
      {formOpen && <div className="project-place-form-shell"><ProjectPlaceForm {...(editing ? { place: editing } : {})} {...(sourceEvent ? { event: sourceEvent } : {})} {...(sourceReservation ? { reservation: sourceReservation } : {})} onClose={closeForm} onSaved={handleSaved} projectId={project.id} /></div>}
    </section>
  );
}
