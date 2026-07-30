import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ProjectExpenseRow, ProjectReservationRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  deleteReservationAction: vi.fn(),
  refresh: vi.fn(),
  saveReservationAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/app/(app)/projects/reservation-actions", () => ({
  deleteReservationAction: mocks.deleteReservationAction,
  saveReservationAction: mocks.saveReservationAction,
}));

import { ProjectReservations } from "@/components/projects/project-reservations";

const reservation: ProjectReservationRow = {
  id: "22222222-2222-4222-8222-222222222222",
  user_id: "user-1",
  project_id: "11111111-1111-4111-8111-111111111111",
  type: "flight",
  title: "김포 → 제주",
  reservation_date: "2026-08-04",
  start_time: "09:00:00",
  end_time: "10:10:00",
  company: "제주항공",
  confirmation_number: "ABC123",
  location: "김포공항",
  phone: null,
  website: null,
  memo: null,
  linked_event_id: "33333333-3333-4333-8333-333333333333",
  created_at: "",
  updated_at: "",
};
const linkedExpense: ProjectExpenseRow = {
  amount: 120_000,
  category: "transportation",
  created_at: "",
  expense_date: "2026-08-04",
  id: "44444444-4444-4444-8444-444444444444",
  memo: null,
  payment_status: "paid",
  project_id: reservation.project_id,
  reservation_id: reservation.id,
  title: reservation.title,
  updated_at: "",
  user_id: "user-1",
};

describe("project reservations", () => {
  it("opens the generic reservation form with calendar sync enabled", async () => {
    render(
      <ProjectReservations
        expenses={[]}
        projectId={reservation.project_id}
        projectName="제주 여행"
        reservations={[]}
      />,
    );

    expect(screen.getByText("등록된 예약이 없습니다.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "항공 예약 추가" }));

    expect(screen.getByRole("dialog", { name: "예약 추가" })).toBeInTheDocument();
    expect(screen.getByLabelText("예약 유형")).toHaveValue("flight");
    expect(screen.getByLabelText("출발일")).toBeInTheDocument();
    expect(screen.getByLabelText("출발 시간")).toBeInTheDocument();
    expect(screen.getByLabelText("도착 시간")).toBeInTheDocument();
    expect(screen.getByText("현재 프로젝트")).toBeInTheDocument();
    expect(screen.getByText("제주 여행")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /캘린더 일정 생성/ })).toBeChecked();
    expect(screen.getByRole("option", { name: "배드민턴" })).toBeInTheDocument();
  });

  it("prefills an empty-state reservation type and adapts labels without changing data fields", () => {
    render(
      <ProjectReservations
        expenses={[]}
        projectId={reservation.project_id}
        projectName="제주 여행"
        reservations={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "숙박 예약 추가" }));
    expect(screen.getByLabelText("예약 유형")).toHaveValue("hotel");
    expect(screen.getByLabelText("체크인 날짜")).toBeInTheDocument();
    expect(screen.getByLabelText("체크인 시간")).toBeInTheDocument();
    expect(screen.getByLabelText("체크아웃 시간")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("예약 유형"), { target: { value: "restaurant" } });
    expect(screen.getByLabelText("예약일")).toBeInTheDocument();
    expect(screen.getByLabelText("예약 시간")).toBeInTheDocument();
    expect(screen.queryByLabelText("종료 시간")).not.toBeInTheDocument();
  });

  it("shows reservation details and separates linked-event deletion choices", async () => {
    render(<ProjectReservations expenses={[linkedExpense]} projectId={reservation.project_id} reservations={[reservation]} />);

    expect(screen.getByRole("heading", { name: "김포 → 제주" })).toBeInTheDocument();
    expect(screen.getByText("제주항공")).toBeInTheDocument();
    expect(screen.getByText("예약번호 ABC123")).toBeInTheDocument();
    expect(screen.getByText("캘린더 일정 연결됨")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("김포 → 제주 예약 메뉴"));
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(screen.getByRole("dialog", { name: "예약 삭제" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "연결된 캘린더 일정도 함께 삭제" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "연결된 지출도 함께 삭제" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예약 삭제" })).toBeInTheDocument();
  });
});
