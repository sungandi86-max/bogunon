"use client";

import { CalendarDays, MapPin, TicketCheck } from "lucide-react";

import type { ProjectPlaceCandidate } from "@/lib/projects/places";

function compactDate(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  return `${value.getMonth() + 1}/${value.getDate()}`;
}

export function ProjectMapSuggestions({ candidates, onAdd }: {
  readonly candidates: readonly ProjectPlaceCandidate[];
  readonly onAdd: (candidate: ProjectPlaceCandidate) => void;
}) {
  if (candidates.length === 0) return null;
  return (
    <section className="project-map-suggestions">
      <div><h3>지도에 추가할 수 있는 장소</h3><p>일정과 예약에 입력한 장소를 다시 입력하지 않아도 됩니다.</p></div>
      <div className="project-map-suggestions__list">
        {candidates.map((candidate) => (
          <article key={`${candidate.source}-${candidate.id}`}>
            <span className="project-map-suggestions__icon">{candidate.source === "event" ? <CalendarDays aria-hidden="true" size={17} /> : <TicketCheck aria-hidden="true" size={17} />}</span>
            <span><strong>{candidate.location}</strong><small>{candidate.title} · {candidate.sourceLabel} · {compactDate(candidate.date)}{candidate.time ? ` ${candidate.time.slice(0, 5)}` : ""}</small></span>
            <button className="button button--secondary" onClick={() => onAdd(candidate)} type="button"><MapPin aria-hidden="true" size={15} />지도에 추가</button>
          </article>
        ))}
      </div>
    </section>
  );
}
