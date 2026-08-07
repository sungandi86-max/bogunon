import { describe, expect, it } from "vitest";

import { projectPlaceInputSchema, sortProjectPlaces } from "@/lib/projects/places";

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
});
