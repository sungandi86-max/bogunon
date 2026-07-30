import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  EventRow,
  ProjectChecklistItemRow,
  ProjectExpenseRow,
  ProjectFileRow,
  ProjectReservationRow,
  ProjectRow,
} from "@/types/database";

const mocks = vi.hoisted(() => ({
  createFileAccess: vi.fn(),
  saveNote: vi.fn(),
}));

vi.mock("@/app/(app)/projects/file-actions", () => ({
  createProjectFileAccessAction: mocks.createFileAccess,
}));

vi.mock("@/app/(app)/projects/note-actions", () => ({
  saveProjectNoteAction: mocks.saveNote,
}));

import { preferredMapsUrl } from "@/components/projects/project-travel-actions";
import { ProjectTravelToday } from "@/components/projects/project-travel-today";

const project: ProjectRow = {
  color: "mint",
  created_at: "",
  description: "여행 중 필요한 정보를 모읍니다.",
  end_date: "2026-08-07",
  icon: "travel",
  id: "11111111-1111-4111-8111-111111111111",
  name: "제주 여행",
  start_date: "2026-08-04",
  updated_at: "",
  user_id: "user-1",
};

const reservations: readonly ProjectReservationRow[] = [{
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
  start_time: "07:10:00",
  title: "김포 → 제주",
  type: "flight",
  updated_at: "",
  user_id: "user-1",
  website: "https://example.com",
}];

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
];

const checklistItems: readonly ProjectChecklistItemRow[] = [{
  created_at: "",
  due_date: "2026-08-04",
  id: "check-today",
  is_completed: false,
  project_id: project.id,
  sort_order: 0,
  title: "운전면허 확인",
  updated_at: "",
  user_id: "user-1",
}];

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

const files: readonly ProjectFileRow[] = [{
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
}];

describe("project travel today", () => {
  it("prefers native mobile map schemes and keeps Google Maps on desktop", () => {
    expect(preferredMapsUrl("제주 공항", "Mozilla/5.0 (Linux; Android 16)")).toBe(
      "geo:0,0?q=%EC%A0%9C%EC%A3%BC%20%EA%B3%B5%ED%95%AD",
    );
    expect(preferredMapsUrl("제주 공항", "Mozilla/5.0 (iPhone)")).toBe(
      "maps://?q=%EC%A0%9C%EC%A3%BC%20%EA%B3%B5%ED%95%AD",
    );
    expect(preferredMapsUrl("제주 공항", "Mozilla/5.0 (Windows NT 10.0)")).toBe(
      "https://maps.google.com/?q=%EC%A0%9C%EC%A3%BC%20%EA%B3%B5%ED%95%AD",
    );
  });

  beforeEach(() => {
    mocks.createFileAccess.mockReset();
    mocks.saveNote.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("puts the trip status and time-ordered actions first", () => {
    render(
      <ProjectTravelToday
        checklistItems={checklistItems}
        events={events}
        expenses={expenses}
        files={files}
        project={project}
        reservations={reservations}
        today="2026-08-04"
      />,
    );

    expect(screen.getByRole("heading", { name: "제주 여행" })).toBeInTheDocument();
    expect(screen.getByText("여행 1일차")).toBeInTheDocument();
    const schedule = screen.getByLabelText("오늘 일정");
    expect(within(schedule).getAllByRole("article").map((item) => item.textContent)).toEqual([
      expect.stringContaining("07:10"),
      expect.stringContaining("16:00"),
    ]);
    expect(screen.getByRole("link", { name: "김포 출발 길찾기" })).toHaveAttribute(
      "href",
      expect.stringContaining("maps.google.com"),
    );
    expect(screen.getByRole("link", { name: "김포 출발 전화" })).toHaveAttribute(
      "href",
      "tel:1599-1500",
    );
    expect(screen.getByRole("link", { name: "김포 출발 예약 보기" })).toHaveAttribute(
      "href",
      `/projects/${project.id}#reservations`,
    );
    expect(screen.getByText("운전면허 확인")).toBeInTheDocument();
    expect(screen.getByText("85,000원")).toBeInTheDocument();
    expect(screen.getByText("120,000원")).toBeInTheDocument();
  });

  it("copies a reservation number and opens a linked file through a signed URL", async () => {
    const previewWindow = {
      close: vi.fn(),
      location: { href: "" },
      opener: window,
    } as unknown as Window;
    vi.mocked(window.open).mockReturnValue(previewWindow);
    mocks.createFileAccess.mockResolvedValue({
      message: "",
      signedUrl: "https://signed.example/ticket",
      status: "success",
    });
    render(
      <ProjectTravelToday
        checklistItems={checklistItems}
        events={events}
        expenses={expenses}
        files={files}
        project={project}
        reservations={reservations}
        today="2026-08-04"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "김포 → 제주 예약번호 복사" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ABC123"));
    expect(await screen.findByText("예약번호를 복사했습니다.")).toBeInTheDocument();

    fireEvent.click(within(screen.getByLabelText("오늘 필요한 파일")).getByRole("button", {
      name: "항공권.pdf 열기",
    }));
    await waitFor(() => expect(mocks.createFileAccess).toHaveBeenCalledWith({
      fileId: files[0]?.id,
      mode: "preview",
      projectId: project.id,
    }));
    expect(window.open).toHaveBeenCalledWith("about:blank", "_blank");
    expect(previewWindow.opener).toBeNull();
    expect(previewWindow.location.href).toBe("https://signed.example/ticket");
  });

  it("saves a one-field quick note to Workspace Notes", async () => {
    mocks.saveNote.mockResolvedValue({
      message: "노트를 저장했습니다.",
      note: {
        content: "카페 너무 좋았다.",
        created_at: "",
        id: "55555555-5555-4555-8555-555555555555",
        is_pinned: false,
        project_id: project.id,
        title: "여행 메모 · 8월 4일",
        updated_at: "",
        user_id: "user-1",
      },
      status: "success",
    });
    render(
      <ProjectTravelToday
        checklistItems={checklistItems}
        events={events}
        expenses={expenses}
        files={files}
        project={project}
        reservations={reservations}
        today="2026-08-04"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "여행 빠른 메모" }), {
      target: { value: "카페 너무 좋았다." },
    });
    fireEvent.click(screen.getByRole("button", { name: "빠른 메모 저장" }));

    await waitFor(() => expect(mocks.saveNote).toHaveBeenCalledWith({
      content: "카페 너무 좋았다.",
      isPinned: false,
      noteId: null,
      projectId: project.id,
      title: "여행 메모 · 8월 4일",
    }));
    expect(await screen.findByText("노트에 저장했습니다.")).toBeInTheDocument();
  });
});
