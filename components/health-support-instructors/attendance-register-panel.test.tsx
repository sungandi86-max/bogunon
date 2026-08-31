import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AttendanceRegisterPanel } from "./attendance-register-panel";
import type { HealthSupportSettlementDocuments } from "@/lib/health-support-instructors/settlement/documents";

const documents = {
  attendanceRegister: {
    title: "출 근 관 리 부 (8월)",
    field: "학교보건지원강사",
    instructorName: "장진희",
    operationPeriod: "‘26.03.01. ~ ‘26.12.31.",
    workDays: 2,
    rows: [
      { date: "2026-08-01", weekday: "토요일", startTime: "09:00", endTime: "12:00", signature: "", teacherConfirmation: "" },
      { date: "2026-08-02", weekday: "일요일", startTime: "09:00", endTime: "12:00", signature: "", teacherConfirmation: "" },
    ],
  },
} as HealthSupportSettlementDocuments;

function renderPanel(includeElectronicStamps: boolean) {
  return render(<AttendanceRegisterPanel documents={documents} includeElectronicStamps={includeElectronicStamps} onElectronicStampsChange={vi.fn()} onPrint={vi.fn()} onTogglePreview={vi.fn()} printActive={false} showPreview verifierName="" onVerifierNameChange={vi.fn()} />);
}

describe("AttendanceRegisterPanel electronic stamps", () => {
  it("keeps both stamp images out of the preview when disabled", () => {
    renderPanel(false);

    expect(screen.queryByRole("img", { name: "장진희 전자도장" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "박숙현 전자도장" })).not.toBeInTheDocument();
    expect(document.querySelector(".attendance-register-preview__verifier")?.textContent).toContain("________________ (서명)");
  });

  it("places one instructor stamp per work row and a verifier stamp when enabled", () => {
    renderPanel(true);

    expect(screen.getAllByRole("img", { name: "장진희 전자도장" })).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "박숙현 전자도장" })).toHaveLength(3);
    expect(screen.getAllByRole("img", { name: "박숙현 전자도장" })[2]).toBeInTheDocument();
    expect(screen.getByText(/확인자: 박숙현/)).toBeInTheDocument();
    expect(screen.getByText(/서명\/인/)).toBeInTheDocument();
  });
});
