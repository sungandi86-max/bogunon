import { describe, expect, it } from "vitest";

import {
  buildTravelToday,
  isTravelProject,
  projectTravelDayLabel,
} from "@/lib/projects/travel";
import type {
  EventRow,
  ProjectChecklistItemRow,
  ProjectExpenseRow,
  ProjectFileRow,
  ProjectReservationRow,
  ProjectRow,
} from "@/types/database";

const project: ProjectRow = {
  color: "mint",
  created_at: "",
  description: "제주에서 쉬는 여름 여행",
  end_date: "2026-08-07",
  icon: "travel",
  id: "11111111-1111-4111-8111-111111111111",
  name: "제주 여행",
  start_date: "2026-08-04",
  updated_at: "",
  user_id: "user-1",
};

const events: readonly EventRow[] = [
  {
    area: "project",
    created_at: "",
    description: null,
    end_date: "2026-08-04",
    end_time: null,
    id: "event-late",
    is_all_day: false,
    location: "제주공항",
    memo: null,
    project_id: project.id,
    start_date: "2026-08-04",
    start_time: "16:00:00",
    title: "렌터카 수령",
    updated_at: "",
    user_id: "user-1",
  },
  {
    area: "project",
    created_at: "",
    description: null,
    end_date: "2026-08-04",
    end_time: "08:20:00",
    id: "event-early",
    is_all_day: false,
    location: "김포공항",
    memo: null,
    project_id: project.id,
    start_date: "2026-08-04",
    start_time: "07:10:00",
    title: "김포 출발",
    updated_at: "",
    user_id: "user-1",
  },
  {
    area: "project",
    created_at: "",
    description: null,
    end_date: "2026-08-05",
    end_time: null,
    id: "event-next",
    is_all_day: true,
    location: null,
    memo: null,
    project_id: project.id,
    start_date: "2026-08-05",
    start_time: null,
    title: "MJ Resort 체크인",
    updated_at: "",
    user_id: "user-1",
  },
];

const reservations: readonly ProjectReservationRow[] = [
  {
    company: "제주항공",
    confirmation_number: "ABC123",
    created_at: "",
    end_time: "08:20:00",
    id: "22222222-2222-4222-8222-222222222222",
    linked_event_id: "event-early",
    location: "김포공항",
    memo: null,
    phone: "1599-1500",
    project_id: project.id,
    reservation_date: "2026-08-04",
    end_date: null,
    start_time: "07:10:00",
    title: "김포 → 제주",
    type: "flight",
    updated_at: "",
    user_id: "user-1",
    website: "https://example.com",
  },
  {
    company: "MJ",
    confirmation_number: null,
    created_at: "",
    end_time: null,
    id: "33333333-3333-4333-8333-333333333333",
    linked_event_id: "event-next",
    location: "서귀포",
    memo: null,
    phone: null,
    project_id: project.id,
    reservation_date: "2026-08-05",
    end_date: null,
    start_time: null,
    title: "MJ Resort",
    type: "hotel",
    updated_at: "",
    user_id: "user-1",
    website: null,
  },
];

const checklistItems: readonly ProjectChecklistItemRow[] = [
  {
    created_at: "",
    due_date: "2026-08-04",
    id: "check-today",
    is_completed: false,
    project_id: project.id,
    sort_order: 0,
    title: "운전면허 확인",
    updated_at: "",
    user_id: "user-1",
  },
  {
    created_at: "",
    due_date: "2026-08-05",
    id: "check-later",
    is_completed: false,
    project_id: project.id,
    sort_order: 1,
    title: "숙소 체크인",
    updated_at: "",
    user_id: "user-1",
  },
];

const expenses: readonly ProjectExpenseRow[] = [
  {
    amount: 120_000,
    category: "transportation",
    created_at: "",
    expense_date: "2026-08-04",
    id: "expense-paid",
    memo: null,
    payment_status: "paid",
    project_id: project.id,
    reservation_id: reservations[0]?.id ?? null,
    title: "항공권",
    updated_at: "",
    user_id: "user-1",
  },
  {
    amount: 85_000,
    category: "transportation",
    created_at: "",
    expense_date: "2026-08-04",
    id: "expense-planned",
    memo: null,
    payment_status: "planned",
    project_id: project.id,
    reservation_id: null,
    title: "렌터카",
    updated_at: "",
    user_id: "user-1",
  },
];

const files: readonly ProjectFileRow[] = [
  {
    filename: "ticket.pdf",
    id: "44444444-4444-4444-8444-444444444444",
    mime_type: "application/pdf",
    original_filename: "항공권.pdf",
    project_id: project.id,
    reservation_id: reservations[0]?.id ?? null,
    size_bytes: 1_024,
    storage_path: "user/project/ticket.pdf",
    updated_at: "",
    uploaded_at: "",
    user_id: "user-1",
  },
  {
    filename: "later.pdf",
    id: "55555555-5555-4555-8555-555555555555",
    mime_type: "application/pdf",
    original_filename: "숙소 확인서.pdf",
    project_id: project.id,
    reservation_id: reservations[1]?.id ?? null,
    size_bytes: 2_048,
    storage_path: "user/project/later.pdf",
    updated_at: "",
    uploaded_at: "",
    user_id: "user-1",
  },
];

describe("travel project workspace", () => {
  it("detects explicit and existing travel projects without a migration", () => {
    expect(isTravelProject(project, [])).toBe(true);
    expect(isTravelProject({ ...project, icon: "folder" }, [])).toBe(true);
    expect(isTravelProject(
      { ...project, description: null, icon: "folder", name: "여름 휴가" },
      reservations,
    )).toBe(true);
    expect(isTravelProject(
      { ...project, description: null, icon: "folder", name: "강의 준비" },
      [],
    )).toBe(false);
  });

  it("formats the project day relative to its travel period", () => {
    expect(projectTravelDayLabel(project, "2026-08-01")).toBe("D-3");
    expect(projectTravelDayLabel(project, "2026-08-04")).toBe("여행 1일차");
    expect(projectTravelDayLabel(project, "2026-08-07")).toBe("여행 4일차");
    expect(projectTravelDayLabel(project, "2026-08-08")).toBe("여행 종료");
  });

  it("builds a time-ordered today view from existing workspace data", () => {
    const today = buildTravelToday({
      checklistItems,
      events,
      expenses,
      files,
      project,
      reservations,
      today: "2026-08-04",
    });

    expect(today.events.map((event) => event.title)).toEqual([
      "김포 출발",
      "렌터카 수령",
    ]);
    expect(today.nextEvent?.title).toBe("MJ Resort 체크인");
    expect(today.checklistItems.map((item) => item.title)).toEqual(["운전면허 확인"]);
    expect(today.reservations.map((reservation) => reservation.title)).toEqual(["김포 → 제주"]);
    expect(today.files.map((file) => file.original_filename)).toEqual(["항공권.pdf"]);
    expect(today.plannedAmount).toBe(85_000);
    expect(today.paidAmount).toBe(120_000);
  });

  it("keeps a multi-day reservation visible throughout its stay", () => {
    const hotel = reservations[1];
    expect(hotel).toBeDefined();
    if (!hotel) return;

    const today = buildTravelToday({
      checklistItems: [],
      events: [],
      expenses: [],
      files: [],
      project,
      reservations: [{ ...hotel, end_date: "2026-08-07" }],
      today: "2026-08-06",
    });

    expect(today.reservations.map((reservation) => reservation.title)).toEqual(["MJ Resort"]);
  });
});
