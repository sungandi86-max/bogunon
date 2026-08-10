"use client";

import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { savePlaceAction, type PlaceActionResult } from "@/app/(app)/projects/place-actions";
import { PLACE_CATEGORIES, PLACE_CATEGORY_LABELS, type ProjectPlaceCategory } from "@/lib/projects/places";
import { placeSearchResultSchema, type PlaceSearchResult } from "@/lib/maps/types";
import type { EventRow, ProjectPlaceRow, ProjectReservationRow } from "@/types/database";

const initialState: PlaceActionResult = { status: "success", message: "" };
const searchResponseSchema = z.object({ results: z.array(placeSearchResultSchema) });

export function ProjectPlaceForm({ autoSearch = false, defaultCategory = "other", event, onClose, onSaved, place, projectId, reservation }: {
  readonly autoSearch?: boolean;
  readonly defaultCategory?: ProjectPlaceCategory;
  readonly event?: EventRow;
  readonly onClose: () => void;
  readonly onSaved: (place: ProjectPlaceRow, message: string) => void;
  readonly place?: ProjectPlaceRow;
  readonly projectId: string;
  readonly reservation?: ProjectReservationRow;
}) {
  const [state, formAction, pending] = useActionState(savePlaceAction, initialState);
  const [query, setQuery] = useState(place?.name ?? reservation?.location ?? event?.location ?? "");
  const [results, setResults] = useState<readonly PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState<PlaceSearchResult>();
  const autoSearchStarted = useRef(false);

  useEffect(() => {
    if (state.status === "success" && state.place) onSaved(state.place, state.message);
  }, [onSaved, state]);

  const search = useCallback(async (searchQuery: string): Promise<void> => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch(`/api/maps/places?q=${encodeURIComponent(searchQuery.trim())}`);
      const payload: unknown = await response.json();
      if (!response.ok) {
        const errorPayload = z.object({ error: z.string() }).safeParse(payload);
        setSearchError(errorPayload.success ? errorPayload.data.error : "장소를 검색하지 못했습니다.");
        return;
      }
      setResults(searchResponseSchema.parse(payload).results);
    } catch (error) {
      setSearchError(error instanceof Error ? "네트워크 연결을 확인해 주세요." : "장소를 검색하지 못했습니다.");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!autoSearch || autoSearchStarted.current || query.trim().length < 2) return;
    autoSearchStarted.current = true;
    void search(query);
  }, [autoSearch, query, search]);

  const initialName = place?.name ?? reservation?.title ?? event?.title ?? "";
  const initialDate = place?.visited_date ?? reservation?.reservation_date ?? event?.start_date ?? "";
  const initialTime = place?.visited_time?.slice(0, 5) ?? reservation?.start_time?.slice(0, 5) ?? event?.start_time?.slice(0, 5) ?? "";

  return (
    <form action={formAction} className="project-place-form">
      <div className="project-place-form__heading"><div><h3>{place ? "장소 수정" : "지도에 장소 추가"}</h3><p>검색 결과를 선택한 뒤 여행 정보를 확인하세요.</p></div><button aria-label="장소 입력 닫기" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button></div>
      <input name="placeId" type="hidden" value={place?.id ?? ""} />
      <input name="projectId" type="hidden" value={projectId} />
      <input name="eventId" type="hidden" value={place?.event_id ?? event?.id ?? ""} />
      <input name="reservationId" type="hidden" value={place?.reservation_id ?? reservation?.id ?? ""} />
      <div className="project-place-form__search"><label htmlFor="place-query">장소 검색</label><div><input id="place-query" onChange={(e) => setQuery(e.target.value)} placeholder="장소명 또는 주소" value={query} /><button disabled={searching || query.trim().length < 2} onClick={() => void search(query)} type="button">{searching ? <LoaderCircle aria-hidden="true" size={16} /> : <Search aria-hidden="true" size={16} />}검색</button></div></div>
      {searchError && <p className="form-message form-message--error" role="alert">{searchError}</p>}
      {results.length > 0 && <div aria-label="장소 검색 결과" className="project-place-form__results">{results.map((result) => <button aria-pressed={selected?.providerId === result.providerId} key={result.providerId} onClick={() => { setSelected(result); setQuery(result.name); }} type="button"><MapPin aria-hidden="true" size={16} /><span><strong>{result.name}</strong><small>{result.address}</small></span></button>)}</div>}
      <div className="project-place-form__grid">
        <label>장소명<input defaultValue={selected?.name ?? initialName} key={selected?.providerId ?? "name"} maxLength={160} name="name" required /></label>
        <label>카테고리<select defaultValue={place?.category ?? defaultCategory} name="category">{PLACE_CATEGORIES.map((category) => <option key={category} value={category}>{PLACE_CATEGORY_LABELS[category]}</option>)}</select></label>
        <label className="project-place-form__wide">주소<input defaultValue={selected?.address ?? place?.address ?? reservation?.location ?? event?.location ?? ""} key={`${selected?.providerId ?? "address"}-address`} maxLength={500} name="address" /></label>
        <label>방문 날짜<input defaultValue={initialDate} name="visitedDate" type="date" /></label>
        <label>방문 시간<input defaultValue={initialTime} name="visitedTime" type="time" /></label>
        <details className="project-place-form__coordinates"><summary>직접 좌표 입력</summary><div><label>위도<input defaultValue={selected?.latitude ?? place?.latitude ?? ""} key={`${selected?.providerId ?? "lat"}-lat`} name="latitude" step="any" type="number" /></label><label>경도<input defaultValue={selected?.longitude ?? place?.longitude ?? ""} key={`${selected?.providerId ?? "lng"}-lng`} name="longitude" step="any" type="number" /></label></div></details>
        <label className="project-place-form__wide">메모<textarea defaultValue={place?.memo ?? ""} maxLength={2000} name="memo" rows={3} /></label>
        <label className="project-place-form__visited"><input defaultChecked={place?.is_visited} name="isVisited" type="checkbox" />방문 완료</label>
      </div>
      {state.status === "error" && <p className="form-message form-message--error" role="alert">{state.message}</p>}
      <div className="project-place-form__actions"><button className="button button--secondary" onClick={onClose} type="button">취소</button><button className="button button--primary" disabled={pending} type="submit">{pending ? "저장 중" : "장소 저장"}</button></div>
    </form>
  );
}
