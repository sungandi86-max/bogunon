import { describe, expect, it } from "vitest";

import {
  buildProjectMapDays,
  findProjectPlaceCandidates,
  groupProjectPlacesByDay,
  inferProjectMapViewport,
  projectPlaceInputSchema,
  sortProjectPlaces,
} from "@/lib/projects/places";

const base = {
  placeId: "",
  projectId: "11111111-1111-4111-8111-111111111111",
  eventId: "",
  reservationId: "",
  name: "제주공항",
  address: "제주 제주시 공항로 2",
  latitude: "33.5104",
  longitude: "126.4913",
  visitedDate: "2026-08-04",
  visitedTime: "09:00",
  category: "airport",
  memo: "",
  isVisited: false,
};

describe("project places", () => {
  it("parses a linked place without creating a location automatically", () => {
    expect(projectPlaceInputSchema.parse(base)).toMatchObject({
      name: "제주공항", latitude: 33.5104, longitude: 126.4913, category: "airport",
    });
  });

  it("requires latitude and longitude as a pair", () => {
    expect(() => projectPlaceInputSchema.parse({ ...base, longitude: "" })).toThrow("위도와 경도를 함께");
  });

  it("sorts the saved user order before visit time", () => {
    const places = sortProjectPlaces([
      { sort_order: 1, visited_time: "08:00:00", created_at: "2026-01-01" },
      { sort_order: 0, visited_time: "18:00:00", created_at: "2026-01-02" },
    ]);
    expect(places.map((place) => place.sort_order)).toEqual([0, 1]);
  });

  it("builds DAY labels from the project start date", () => {
    expect(buildProjectMapDays({
      projectStartDate: "2026-08-04",
      projectEndDate: "2026-08-06",
      placeDates: [],
      relatedDates: [],
    })).toEqual([
      { date: "2026-08-04", dayNumber: 1 },
      { date: "2026-08-05", dayNumber: 2 },
      { date: "2026-08-06", dayNumber: 3 },
    ]);
  });

  it("falls back to related dates when the project has no period", () => {
    expect(buildProjectMapDays({
      projectStartDate: null,
      projectEndDate: null,
      placeDates: ["2026-08-05"],
      relatedDates: ["2026-08-04", "2026-08-06"],
    })).toEqual([
      { date: "2026-08-04", dayNumber: 1 },
      { date: "2026-08-05", dayNumber: 2 },
      { date: "2026-08-06", dayNumber: 3 },
    ]);
  });

  it("infers a 제주 viewport without calling a provider", () => {
    expect(inferProjectMapViewport({
      projectName: "2026 곰도리랑 제주 여행",
      locations: [],
    })).toEqual({ center: [33.38, 126.55], zoom: 10 });
  });

  it("recommends unlinked event and reservation locations only", () => {
    const candidates = findProjectPlaceCandidates({
      events: [
        { id: "event-1", title: "공항 도착", location: "제주공항", start_date: "2026-08-04", start_time: "21:30:00", event_type: "personal" },
        { id: "event-2", title: "숙소 이동", location: "MJ Resort", start_date: "2026-08-04", start_time: null, event_type: "personal" },
      ],
      reservations: [
        { id: "reservation-1", title: "렌터카", location: "제주OK렌터카", reservation_date: "2026-08-04", start_time: "22:00:00", type: "rental_car" },
      ],
      places: [{ event_id: "event-2", reservation_id: null }],
    });

    expect(candidates.map((candidate) => candidate.id)).toEqual(["event-1", "reservation-1"]);
    expect(candidates[1]).toMatchObject({ category: "transportation", source: "reservation" });
  });

  it("keeps each date in a separate ordered route", () => {
    const groups = groupProjectPlacesByDay([
      { id: "day-2", visited_date: "2026-08-05", visited_time: "09:00:00", sort_order: 0, created_at: "2026-08-01" },
      { id: "day-1-second", visited_date: "2026-08-04", visited_time: "12:00:00", sort_order: 1, created_at: "2026-08-01" },
      { id: "day-1-first", visited_date: "2026-08-04", visited_time: "10:00:00", sort_order: 0, created_at: "2026-08-01" },
    ]);

    expect(groups.map((group) => [group.date, group.places.map((place) => place.id)])).toEqual([
      ["2026-08-04", ["day-1-first", "day-1-second"]],
      ["2026-08-05", ["day-2"]],
    ]);
  });
});
