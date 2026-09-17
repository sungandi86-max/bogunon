import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportCenter } from "./report-center";

vi.mock("@/app/(app)/support/reports/actions", () => ({
  createReportAction: vi.fn(),
}));

describe("ReportCenter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an empty state and opens the report form", () => {
    render(<ReportCenter appVersion="0.21.2" reports={[]} />);
    expect(screen.getByText("아직 제출한 신고가 없습니다.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "새 신고 작성" }));
    expect(screen.getByRole("heading", { name: "새 신고 작성" })).toBeInTheDocument();
    expect(screen.getByLabelText("유형")).toHaveValue("bug");
    expect(screen.getByText("개인정보 보호를 위해 페이지 경로와 기본 기기 정보만 자동으로 포함합니다. 화면 입력 내용이나 파일은 수집하지 않습니다.")).toBeInTheDocument();
  });
});
