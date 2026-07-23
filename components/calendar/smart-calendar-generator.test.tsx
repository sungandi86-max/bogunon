import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SmartCalendarGenerator } from "@/components/calendar/smart-calendar-generator";
import {
  generateSmartCalendarPreviewAction,
  saveSmartCalendarAction,
} from "@/app/(app)/calendar/generator/actions";
import type { SmartCalendarPreview } from "@/lib/calendar-generator/generation-types";

vi.mock("@/app/(app)/calendar/generator/actions", () => ({
  generateSmartCalendarPreviewAction: vi.fn(),
  saveSmartCalendarAction: vi.fn(),
}));

const preview: SmartCalendarPreview = {
  year: 2026,
  semester: "all",
  warnings: [],
  items: [
    {
      clientId: "academic-opening",
      ruleId: "academic-opening",
      pack: "academic",
      title: "개학식",
      startDate: "2026-03-02",
      endDate: "2026-03-02",
      area: "schoolSchedule",
      allDay: true,
      description: "Smart Calendar · academic-v1 1.0.0",
      categoryLabel: "학사일정",
      warning: "ready",
      selected: true,
      duplicateDecision: "unchecked",
    },
    {
      clientId: "holiday-existing",
      ruleId: "holiday-existing",
      pack: "holiday",
      title: "삼일절",
      startDate: "2026-03-01",
      endDate: "2026-03-01",
      area: "schoolSchedule",
      allDay: true,
      description: "Smart Calendar · holiday-v1 1.0.0",
      categoryLabel: "공휴일",
      warning: "duplicate",
      selected: false,
      duplicateDecision: "skip",
      duplicate: {
        eventId: "existing-event",
        title: "삼일절",
        startDate: "2026-03-01",
        endDate: "2026-03-01",
      },
    },
  ],
};

describe("SmartCalendarGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateSmartCalendarPreviewAction).mockResolvedValue(preview);
    vi.mocked(saveSmartCalendarAction).mockResolvedValue({
      status: "completed",
      result: {
        results: [
          { clientId: "academic-opening", title: "수정 개학식", status: "created", eventId: "new-event" },
          { clientId: "holiday-existing", title: "삼일절", status: "duplicate-excluded", eventId: "existing-event" },
        ],
        summary: { created: 1, duplicates: 1, excluded: 0, failed: 0 },
      },
    });
  });

  it("builds a preview, allows editing and duplicate override, then shows result links", async () => {
    render(<SmartCalendarGenerator currentYear={2026} school={{ name: "여의도고등학교", schoolLevel: "고등학교", region: "서울특별시" }} />);

    fireEvent.click(screen.getByRole("button", { name: "일정 후보 미리보기" }));
    expect(await screen.findByDisplayValue("개학식")).toBeInTheDocument();
    expect(screen.getByLabelText("삼일절 생성하지 않기")).toBeChecked();
    expect(screen.getByRole("link", { name: "기존 일정 보기" })).toHaveAttribute(
      "href",
      "/calendar?date=2026-03-01&highlight=existing-event",
    );

    fireEvent.click(screen.getByRole("button", { name: "개학식 수정" }));
    fireEvent.change(screen.getByLabelText("개학식 일정명"), { target: { value: "수정 개학식" } });
    fireEvent.click(screen.getByLabelText("삼일절 그래도 생성"));
    fireEvent.click(screen.getByRole("button", { name: /선택한 일정 생성/ }));

    expect(await screen.findByRole("heading", { name: "Smart Calendar 생성 결과" })).toBeInTheDocument();
    expect(screen.getByText("1개 생성 성공")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "캘린더에서 보기" })).toHaveAttribute("href", "/calendar?date=2026-03-02&view=month");
    expect(screen.getByRole("link", { name: "연간계획에서 보기" })).toHaveAttribute("href", "/annual?year=2026");
  });

  it("shows failed items and never labels a partial result as full success", async () => {
    vi.mocked(saveSmartCalendarAction).mockResolvedValueOnce({
      status: "completed",
      result: {
        results: [
          { clientId: "academic-opening", title: "개학식", status: "failed", message: "DB 오류" },
          { clientId: "holiday-existing", title: "삼일절", status: "duplicate-excluded", eventId: "existing-event" },
        ],
        summary: { created: 0, duplicates: 1, excluded: 0, failed: 1 },
      },
    });
    render(<SmartCalendarGenerator currentYear={2026} school={{ name: "여의도고등학교", schoolLevel: "고등학교", region: "서울특별시" }} />);
    fireEvent.click(screen.getByRole("button", { name: "일정 후보 미리보기" }));
    await screen.findByDisplayValue("개학식");
    const submit = await screen.findByRole("button", { name: /선택한 일정 생성/ });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    expect(await screen.findByText("1개 저장 실패")).toBeInTheDocument();
    expect(screen.getByText("개학식 · DB 오류")).toBeInTheDocument();
    expect(screen.queryByText("모든 일정이 생성되었습니다.")).not.toBeInTheDocument();
  });

  it("can exclude a preview item before saving", async () => {
    render(<SmartCalendarGenerator currentYear={2026} school={{ name: "여의도고등학교", schoolLevel: "고등학교", region: "서울특별시" }} />);
    fireEvent.click(screen.getByRole("button", { name: "일정 후보 미리보기" }));
    await screen.findByDisplayValue("개학식");
    fireEvent.click(screen.getByRole("button", { name: "개학식 제외" }));
    fireEvent.click(screen.getByRole("button", { name: /선택한 일정 생성/ }));

    await waitFor(() => expect(saveSmartCalendarAction).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ clientId: "academic-opening", selected: false }),
    ])));
  });
});
