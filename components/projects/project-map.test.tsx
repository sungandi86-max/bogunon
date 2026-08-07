import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectMap } from "@/components/projects/project-map";

vi.mock("@/components/projects/project-place-map", () => ({
  ProjectPlaceMap: ({ places }: { readonly places: readonly { readonly name: string }[] }) => <div data-testid="map">{places.map((place) => place.name).join(",")}</div>,
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
    expect(screen.getByTestId("map")).toHaveTextContent("제주공항,MJ Resort");
    fireEvent.click(screen.getByRole("button", { name: "8월 5일" }));
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
  });
});
