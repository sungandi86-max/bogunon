import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AcademicCalendarImport } from "@/components/calendar/academic-calendar-import";
import { importAcademicCalendarAction } from "@/app/(app)/academic-calendar-import-actions";

vi.mock("@/app/(app)/academic-calendar-import-actions", () => ({
  checkAcademicDuplicatesAction: vi.fn(async (items: readonly unknown[]) => items),
  importAcademicCalendarAction: vi.fn(async () => ({ status: "success", message: "완료", inserted: 1, excluded: 0, duplicates: 0, failed: 0 })),
}));
vi.mock("@/lib/academic-calendar-import/file", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/academic-calendar-import/file")>();
  return { ...original, readAcademicWorkbook: vi.fn(async () => ({ fileName: "sample.xlsx", sheets: [{ name: "학사일정", likely: true, rows: [["날짜", "일정명"], ["2026-03-02", "개학식"], ["2026-02-30", "오류"]] }] })) };
});

describe("AcademicCalendarImport", () => {
  it("follows file, preview, selection, and completion steps", async () => {
    render(<AcademicCalendarImport />);
    const input = screen.getByLabelText("학사일정 파일 선택");
    fireEvent.change(input, { target: { files: [new File(["data"], "sample.xlsx")] } });
    expect(await screen.findByText("sample.xlsx")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "일정 분석하기" }));
    expect(await screen.findByDisplayValue("개학식")).toBeInTheDocument();
    expect(screen.getByText("날짜 오류")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("개학식"), { target: { value: "개학식 수정" } });
    const submit = await screen.findByRole("button", { name: /선택한 일정 1개 등록/ });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByRole("heading", { name: "학사일정 등록 완료" })).toBeInTheDocument());
  });

  it("stays on preview when registration reports any failure", async () => {
    vi.mocked(importAcademicCalendarAction).mockResolvedValueOnce({ status: "error", message: "일부 실패", inserted: 1, excluded: 0, duplicates: 0, failed: 1 });
    render(<AcademicCalendarImport />);
    fireEvent.change(screen.getByLabelText("학사일정 파일 선택"), { target: { files: [new File(["data"], "sample.xlsx")] } });
    await screen.findByText("sample.xlsx");
    fireEvent.click(screen.getByRole("button", { name: "일정 분석하기" }));
    await screen.findByDisplayValue("개학식");
    const submit = await screen.findByRole("button", { name: /선택한 일정 1개 등록/ });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent("일부 실패");
    expect(screen.queryByRole("heading", { name: "학사일정 등록 완료" })).not.toBeInTheDocument();
  });
});
