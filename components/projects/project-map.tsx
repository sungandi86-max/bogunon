"use client";

import { Map, MapPin, Plus, Route } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { deletePlaceAction, reorderPlacesAction, togglePlaceVisitedAction } from "@/app/(app)/projects/place-actions";
import { ProjectPlaceForm } from "@/components/projects/project-place-form";
import { ProjectPlaceMap } from "@/components/projects/project-place-map";
import { ProjectMapCourseList } from "@/components/projects/project-map-course-list";
import { ProjectMapSuggestions } from "@/components/projects/project-map-suggestions";
import {
  buildProjectMapDays,
  findProjectPlaceCandidates,
  inferProjectMapViewport,
  PLACE_CATEGORY_LABELS,
  sortProjectPlaces,
  type ProjectPlaceCandidate,
  type ProjectPlaceCategory,
} from "@/lib/projects/places";
import type { EventRow, ProjectPlaceRow, ProjectReservationRow, ProjectRow } from "@/types/database";

type VisitFilter = "all" | "planned" | "visited";

function dateLabel(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  return `${value.getMonth() + 1}월 ${value.getDate()}일`;
}

function dayLabel(date: string, dayNumber: number): string {
  const value = new Date(`${date}T00:00:00`);
  return `DAY ${dayNumber} · ${value.getMonth() + 1}/${value.getDate()}`;
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
  const [autoSearch, setAutoSearch] = useState(Boolean(seedEventId || seedReservationId));
  const [defaultCategory, setDefaultCategory] = useState<ProjectPlaceCategory>("other");
  const [message, setMessage] = useState("");

  const days = useMemo(() => buildProjectMapDays({
    placeDates: places.flatMap((place) => place.visited_date ? [place.visited_date] : []),
    projectEndDate: project.end_date,
    projectStartDate: project.start_date,
    relatedDates: [
      ...events.map((event) => event.start_date),
      ...reservations.map((reservation) => reservation.reservation_date),
    ],
  }), [events, places, project.end_date, project.start_date, reservations]);
  const fallbackViewport = useMemo(() => inferProjectMapViewport({
    locations: [
      ...events.flatMap((event) => event.location ? [event.location] : []),
      ...reservations.flatMap((reservation) => reservation.location ? [reservation.location] : []),
    ],
    projectName: project.name,
  }), [events, project.name, reservations]);
  const candidates = useMemo(() => findProjectPlaceCandidates({ events, places, reservations }), [events, places, reservations]);
  const filtered = useMemo(() => sortProjectPlaces(places.filter((place) => (date === "all" || place.visited_date === date)
    && (visitFilter === "all" || (visitFilter === "visited") === place.is_visited))), [date, places, visitFilter]);
  const selected = places.find((place) => place.id === selectedId);
  const visited = places.filter((place) => place.is_visited);

  const selectPlace = useCallback((placeId: string) => setSelectedId(placeId), []);

  function closeForm(): void {
    setFormOpen(false); setEditing(undefined); setSourceEvent(undefined); setSourceReservation(undefined); setAutoSearch(false); setDefaultCategory("other");
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

  function openDirectForm(): void {
    setEditing(undefined); setSourceEvent(undefined); setSourceReservation(undefined); setAutoSearch(false); setDefaultCategory("other"); setFormOpen(true);
  }

  function openCandidate(candidate: ProjectPlaceCandidate): void {
    setEditing(undefined);
    setSourceEvent(candidate.source === "event" ? events.find((event) => event.id === candidate.id) : undefined);
    setSourceReservation(candidate.source === "reservation" ? reservations.find((reservation) => reservation.id === candidate.id) : undefined);
    setDefaultCategory(candidate.category);
    setAutoSearch(true);
    setFormOpen(true);
  }

  async function moveTo(placeId: string, groupDate: string | null, target: number): Promise<void> {
    const group = sortProjectPlaces(places.filter((place) => place.visited_date === groupDate));
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
      {travelEnded && <div className="project-map-summary"><div><Route aria-hidden="true" size={20} /><span><strong>{project.name} 기록</strong><small>방문한 장소 {visited.length}곳 · 여행 기간 {projectDurationDays(project, days.map((day) => day.date))}일</small><small>여행 코스 {new Set(visited.flatMap((place) => place.visited_date ? [place.visited_date] : [])).size}일</small></span></div>{visited.length > 0 && <p>첫 장소 {sortProjectPlaces(visited)[0]?.name} · 마지막 장소 {sortProjectPlaces(visited).at(-1)?.name}</p>}<div className="project-map-summary__days">{days.map((day) => <span key={day.date}>DAY {day.dayNumber} · {places.filter((place) => place.visited_date === day.date && place.is_visited).length}곳</span>)}</div></div>}
      <div className="project-map-toolbar"><div><h2>{travelMode ? "여행 지도" : "프로젝트 지도"}</h2><p>저장한 장소를 DAY별 방문 순서와 코스로 확인합니다.</p></div><button className="button button--primary" onClick={openDirectForm} type="button"><Plus aria-hidden="true" size={17} />장소 추가</button></div>
      <div className="project-map-filters"><div aria-label="여행 DAY" className="project-map-date-filter"><button aria-pressed={date === "all"} onClick={() => setDate("all")} type="button">전체</button>{days.map((day) => <button aria-pressed={date === day.date} key={day.date} onClick={() => setDate(day.date)} type="button">{dayLabel(day.date, day.dayNumber)}</button>)}</div><div aria-label="방문 상태" className="project-map-visit-filter">{(["all", "planned", "visited"] as const).map((filter) => <button aria-pressed={visitFilter === filter} key={filter} onClick={() => setVisitFilter(filter)} type="button">{{ all: "전체 장소", planned: "방문 예정", visited: "방문 완료" }[filter]}</button>)}</div></div>
      <div aria-label="지도 보기 방식" className="project-map-view-switch"><button aria-pressed={view === "map"} onClick={() => setView("map")} type="button"><Map aria-hidden="true" size={16} />지도</button><button aria-pressed={view === "list"} onClick={() => setView("list")} type="button"><Route aria-hidden="true" size={16} />목록</button></div>
      {message && <p aria-live="polite" className="form-message">{message}</p>}
      <div className={`project-map-layout project-map-layout--${view}`}>
        <div className="project-map-canvas"><ProjectPlaceMap fallbackViewport={fallbackViewport} onSelect={selectPlace} places={filtered} {...(selectedId ? { selectedId } : {})} />{filtered.some((place) => place.latitude === null) && <p><MapPin aria-hidden="true" size={14} />좌표가 없는 장소는 목록에만 표시됩니다.</p>}</div>
        <ProjectMapCourseList days={days} onDelete={(place) => void removePlace(place)} onEdit={(place) => { setEditing(place); setAutoSearch(false); setFormOpen(true); }} onMove={(placeId, groupDate, target) => void moveTo(placeId, groupDate, target)} onSelect={selectPlace} onToggleVisited={(place) => void toggleVisited(place)} places={filtered} {...(selectedId ? { selectedId } : {})} />
      </div>
      {selected && <div className="project-map-selected"><div><strong>{selected.name}</strong><span>{selected.visited_date ? dateLabel(selected.visited_date) : "날짜 미정"}{selected.visited_time ? ` · ${selected.visited_time.slice(0, 5)}` : ""} · {PLACE_CATEGORY_LABELS[selected.category]}</span>{selected.memo && <p>{selected.memo}</p>}</div><div><span>{selected.is_visited ? "방문 완료" : "방문 예정"}</span><a href={routeUrl(selected)} rel="noreferrer" target="_blank">길찾기</a>{selected.event_id && <a href={`/calendar?date=${selected.visited_date ?? today}&highlight=${selected.event_id}`}>연결 일정 보기</a>}{selected.reservation_id && <a href="#reservations">연결 예약 보기</a>}<button onClick={() => void toggleVisited(selected)} type="button">{selected.is_visited ? "방문 예정으로 변경" : "방문 완료"}</button><button onClick={() => { setEditing(selected); setFormOpen(true); }} type="button">수정</button></div></div>}
      {places.length === 0 && !formOpen && <div className="empty-state project-map-empty"><MapPin aria-hidden="true" size={24} /><h3>아직 여행 지도에 장소가 없습니다.</h3><p>일정이나 예약에 등록한 장소를 여행 코스로 추가해보세요.</p><div><button className="button button--secondary" disabled={candidates.length === 0} onClick={() => document.getElementById("project-map-suggestions")?.scrollIntoView({ behavior: "smooth" })} type="button">일정·예약에서 장소 추가</button><button className="button button--primary" onClick={openDirectForm} type="button">직접 장소 검색</button></div></div>}
      <div id="project-map-suggestions"><ProjectMapSuggestions candidates={candidates} onAdd={openCandidate} /></div>
      {formOpen && <div className="project-place-form-shell"><ProjectPlaceForm autoSearch={autoSearch} defaultCategory={defaultCategory} {...(editing ? { place: editing } : {})} {...(sourceEvent ? { event: sourceEvent } : {})} {...(sourceReservation ? { reservation: sourceReservation } : {})} onClose={closeForm} onSaved={handleSaved} projectId={project.id} /></div>}
    </section>
  );
}
