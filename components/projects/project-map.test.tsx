import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { savePlaceAction } from "@/app/(app)/projects/place-actions";
import { ProjectMap } from "@/components/projects/project-map";

vi.mock("@/components/projects/project-place-map", () => ({
  ProjectPlaceMap: ({ onSelect, places }: { readonly onSelect: (id: string) => void; readonly places: readonly { readonly id: string; readonly name: string }[] }) => (
    <div data-testid="map">{places.map((place) => <button key={place.id} onClick={() => onSelect(place.id)} type="button">핀 {place.name}</button>)}</div>
  ),
}));

vi.mock("@/app/(app)/projects/place-actions", () => ({
  deletePlaceAction: vi.fn(),
  reorderPlacesAction: vi.fn(async () => ({ status: "success", message: "순서 저장" })),
  togglePlaceVisitedAction: vi.fn(),
  savePlaceAction: vi.fn(),
}));

const project = {
  id: "11111111-1111-4111-8111-111111111111", user_id: "user-1", name: "제주 여행",
  icon: "travel" as const, color: "mint" as const, description: null,
  start_date: "2026-08-04", end_date: "2026-08-06", created_at: "", updated_at: "",
};

const places = [
  {
    id: "21111111-1111-4111-8111-111111111111", user_id: "user-1", project_id: project.id,
    event_id: null, reservation_id: null, name: "제주공항", address: "제주 공항로",
    latitude: 33.51, longitude: 126.49, visited_date: "2026-08-04", visited_time: "09:00:00",
    sort_order: 0, category: "airport" as const, memo: null, is_visited: true, qa_run_id: null,
    created_at: "2026-08-01", updated_at: "",
  },
  {
    id: "31111111-1111-4111-8111-111111111111", user_id: "user-1", project_id: project.id,
    event_id: null, reservation_id: null, name: "MJ Resort", address: null,
    latitude: null, longitude: null, visited_date: "2026-08-05", visited_time: null,
    sort_order: 1, category: "accommodation" as const, memo: null, is_visited: false, qa_run_id: null,
    created_at: "2026-08-02", updated_at: "",
  },
];

describe("project map workspace", () => {
  beforeEach(() => window.history.replaceState(null, "", `/projects/${project.id}#map`));

  it("keeps numbered map and list order aligned by date", () => {
    render(<ProjectMap events={[]} initialPlaces={places} project={project} reservations={[]} today="2026-08-05" travelMode />);
    expect(within(screen.getByTestId("map")).getByRole("button", { name: "핀 제주공항" })).toBeInTheDocument();
    expect(within(screen.getByTestId("map")).getByRole("button", { name: "핀 MJ Resort" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "DAY 2 · 8/5" }));
    expect(screen.getByTestId("map")).toHaveTextContent("MJ Resort");
    expect(screen.queryByText("제주공항")).not.toBeInTheDocument();
    expect(screen.getByText("좌표가 없는 장소는 목록에만 표시됩니다.")).toBeInTheDocument();
  });

  it("filters visited places and offers a mobile-safe list mode", () => {
    render(<ProjectMap events={[]} initialPlaces={places} project={project} reservations={[]} today="2026-08-05" travelMode />);
    fireEvent.click(within(screen.getByLabelText("방문 상태")).getByRole("button", { name: "방문 완료" }));
    expect(screen.getByTestId("map")).toHaveTextContent("제주공항");
    expect(screen.queryByText("MJ Resort")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "목록" }));
    expect(within(screen.getByRole("list")).getByRole("button", { name: /^1제주공항/ })).toBeInTheDocument();
  });

  it("defaults a completed trip to visited places and uses the project period", () => {
    render(<ProjectMap events={[]} initialPlaces={places} project={project} reservations={[]} today="2026-08-08" travelMode />);
    expect(screen.getByTestId("map")).toHaveTextContent("제주공항");
    expect(screen.getByTestId("map")).not.toHaveTextContent("MJ Resort");
    expect(screen.getByText("방문한 장소 1곳 · 여행 기간 3일")).toBeInTheDocument();
    expect(screen.getByText("DAY 1 · 1곳")).toBeInTheDocument();
  });

  it("searches an explicit suggestion without creating a place before confirmation", async () => {
    const events = [{
      id: "event-1", user_id: "user-1", project_id: project.id, title: "제주공항 도착", area: "personal" as const,
      event_type: "personal" as const, start_date: "2026-08-04", end_date: "2026-08-04", is_all_day: false,
      start_time: "21:30:00", end_time: null, location: "제주공항", memo: null, description: null, created_at: "", updated_at: "",
    }];
    const reservations = [{
      id: "reservation-1", user_id: "user-1", project_id: project.id, type: "rental_car" as const, title: "렌터카",
      reservation_date: "2026-08-04", end_date: "2026-08-06", start_time: "22:00:00", end_time: "18:00:00",
      company: null, confirmation_number: null, location: "제주OK렌터카", phone: null, website: null, memo: null,
      linked_event_id: null, created_at: "", updated_at: "",
    }];

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [{
      providerId: "kakao-jeju-airport",
      name: "제주국제공항",
      address: "제주특별자치도 제주시 공항로 2",
      latitude: 33.5104,
      longitude: 126.4913,
      category: "여행 > 교통시설 > 공항",
    }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ProjectMap events={events} initialPlaces={[]} project={project} reservations={reservations} today="2026-08-05" travelMode />);

    expect(screen.getByRole("heading", { name: "지도에 추가할 수 있는 장소" })).toBeInTheDocument();
    expect(screen.getByText("제주공항")).toBeInTheDocument();
    expect(screen.getByText("제주OK렌터카")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "장소 저장" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "지도에 추가" })[0]!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/maps/places?q=%EC%A0%9C%EC%A3%BC%EA%B3%B5%ED%95%AD"));
    fireEvent.click(await screen.findByRole("button", { name: /제주국제공항/ }));
    expect(screen.getByLabelText("장소명")).toHaveValue("제주국제공항");
    expect(screen.getByLabelText("주소")).toHaveValue("제주특별자치도 제주시 공항로 2");
    expect(vi.mocked(savePlaceAction)).not.toHaveBeenCalled();
  });

  it("keeps map pin and course selection synchronized", () => {
    render(<ProjectMap events={[]} initialPlaces={places} project={project} reservations={[]} today="2026-08-05" travelMode />);
    fireEvent.click(screen.getByRole("button", { name: "핀 제주공항" }));
    expect(screen.getByRole("listitem", { name: "제주공항 코스" })).toHaveClass("is-selected");
  });
});
