import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

import { HealthSupportInstructorWorkspace } from "@/components/health-support-instructors/health-support-instructor-workspace";

const instructors = [
  { id: "instructor-1", name: "김보건", subject: "보건 지원", weeklyHours: 15, hourlyRate: 20_000, monthlyInsurance: 10_000, monthlyHourLimit: 60, weeklyHourLimit: 15, totalBudget: 1_000_000, operationStartDate: "2026-03-01", operationEndDate: "2026-12-31" },
  { id: "instructor-2", name: "이건강", subject: "건강 교육", weeklyHours: 12, hourlyRate: 19_000, monthlyInsurance: 8_000, monthlyHourLimit: 60, weeklyHourLimit: 15, totalBudget: 1_000_000, operationStartDate: "2026-03-01", operationEndDate: "2026-12-31" },
] as const;

const sharedInstructor = instructors[0];
const sharedWorkLogs = [
  { id: "shared-log-1", instructorId: "instructor-1", date: "2026-08-03", startTime: "09:00", endTime: "12:00", note: null },
  { id: "shared-log-2", instructorId: "instructor-1", date: "2026-08-09", startTime: "13:00", endTime: "16:00", note: null },
  { id: "shared-log-3", instructorId: "instructor-1", date: "2026-08-31", startTime: "09:00", endTime: "11:00", note: null },
  { id: "shared-log-4", instructorId: "instructor-1", date: "2026-09-01", startTime: "09:00", endTime: "12:00", note: null },
] as const;

describe("HealthSupportInstructorWorkspace", () => {
  it("characterizes the existing default dashboard with the shared instructor fixture", () => {
    // Given: one instructor with logs across ISO weeks and settlement months
    render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} workLogs={sharedWorkLogs} />);

    // When: the workspace first mounts

    // Then: its existing overview is selected and renders the recent records
    expect(screen.getByRole("tab", { name: "대시보드" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "최근 근무기록" })).toBeInTheDocument();
    expect(screen.getByText("2026-08-03")).toBeInTheDocument();
  });

  it("shows the current-month operating totals and capacity from the shared domain output", () => {
    // Given: logs that span two August ISO weeks and a later settlement month
    render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} workLogs={sharedWorkLogs} />);

    // When: the Dashboard is initially rendered for its selected month

    // Then: monthly, cumulative-budget, and weekly capacity values remain visibly traceable to the shared calculation
    const dashboard = screen.getByRole("region", { name: "Dashboard operating overview" });
    expect(dashboard).toHaveTextContent("8.0시간");
    expect(dashboard).toHaveTextContent("160,000");
    expect(dashboard).toHaveTextContent("10,000");
    expect(dashboard).toHaveTextContent("240,000");
    expect(dashboard).toHaveTextContent("760,000");
    expect(dashboard).toHaveTextContent("6.0시간 / 15시간");
    expect(dashboard).toHaveTextContent("5.0시간 / 15시간");
    expect(dashboard).toHaveTextContent("8.0시간 / 60시간");
  });

  it("propagates one work-log fixture mutation through every work, settlement, and payment view", () => {
    // Given: one August record that every workspace view receives through the same props
    const workLog = { id: "propagation-log", instructorId: "instructor-1", date: "2026-08-03", startTime: "09:00", endTime: "12:00", note: null };
    const workLogs = [workLog];
    const updatedWorkLogs = [{ ...workLog, endTime: "16:00" }];
    const view = render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} workLogs={workLogs} />);

    // When: the sole fixture record gains four hours and the workspace receives those props again
    view.rerender(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} workLogs={updatedWorkLogs} />);

    // Then: Dashboard totals and the editable monthly/weekly usage reflect that one data change
    const dashboard = screen.getByRole("region", { name: "Dashboard operating overview" });
    expect(dashboard).toHaveTextContent("7.0시간");
    expect(dashboard).toHaveTextContent("7.0시간 / 15시간");
    fireEvent.click(screen.getByRole("tab", { name: "근무기록" }));
    expect(screen.getByRole("region", { name: "Work log summaries" })).toHaveTextContent("선택 월 합계7.0시간");

    // And: the same selected month drives settlement, payment statement, and printable detail rows
    fireEvent.click(screen.getByRole("tab", { name: "월별 정산" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview work detail" }));
    expect(screen.getByRole("region", { name: "Monthly settlement document" })).toHaveTextContent("150,000");
    expect(screen.getByRole("table", { name: "Monthly work detail" })).toHaveTextContent("7.0");
    fireEvent.click(screen.getByRole("tab", { name: "지급명세서·출력" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview payment statement" }));
    expect(screen.getByRole("region", { name: "Payment statement document" })).toHaveTextContent("140,000");
  });

  it("takes a no-log Dashboard user directly to a new work-log entry", () => {
    // Given: a configured instructor without work logs
    render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} workLogs={[]} />);

    // When: the action-first empty-state command is activated
    fireEvent.click(screen.getByRole("button", { name: "근무 기록 추가" }));

    // Then: the Work Logs tab and its existing entry form are immediately available
    expect(screen.getByRole("tab", { name: "근무기록" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("form", { name: "근무 기록 추가" })).toBeInTheDocument();
  });

  it("keeps the five local-state panes in the required order from the default dashboard", () => {
    // Given: the deterministic instructor fixture
    const saveInstructor = vi.fn(async () => ({ status: "success" as const, message: "saved" }));
    const saveWorkLog = vi.fn(async () => ({ status: "success" as const, message: "saved" }));
    render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} saveInstructor={saveInstructor} saveWorkLog={saveWorkLog} workLogs={sharedWorkLogs} />);

    // When: the tab shell is first rendered

    // Then: Dashboard is the default and each requested pane has an ordered tab
    expect(screen.getByRole("tab", { name: "대시보드" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "대시보드",
      "근무기록",
      "월별 정산",
      "지급명세서·출력",
      "설정",
    ]);

    for (const tabName of ["근무기록", "월별 정산", "지급명세서·출력", "설정", "대시보드"] as const) {
      fireEvent.click(screen.getByRole("tab", { name: tabName }));
      fireEvent.click(screen.getByRole("tab", { name: tabName }));

      expect(screen.getByRole("tab", { name: tabName })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveAttribute("id", `health-support-${tabName}`);
    }

    expect(saveInstructor).not.toHaveBeenCalled();
    expect(saveWorkLog).not.toHaveBeenCalled();
  });

  it("opens and submits the instructor setup panel from the empty-state registration action", async () => {
    const saveInstructor = vi.fn<(state: unknown, formData: FormData) => Promise<{ readonly status: "success"; readonly message: string }>>().mockResolvedValue({ status: "success", message: "Instructor settings saved" });
    render(<HealthSupportInstructorWorkspace instructors={[]} saveInstructor={saveInstructor} workLogs={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "강사 정보 등록" }));

    expect(screen.getByRole("heading", { name: "강사 운영 설정" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("강사명"), { target: { value: "김보건" } });
    fireEvent.change(screen.getByLabelText("담당 업무"), { target: { value: "보건 지원" } });
    fireEvent.submit(screen.getByRole("form", { name: "강사 정보 등록" }));

    await waitFor(() => expect(saveInstructor).toHaveBeenCalledOnce());
    expect(saveInstructor.mock.calls[0]?.[1]?.get("name")).toBe("김보건");
    expect(saveInstructor.mock.calls[0]?.[1]?.get("subject")).toBe("보건 지원");
    expect(screen.getByRole("status")).toHaveTextContent("Instructor settings saved");
  });

  it("edits existing instructor settings with readable numeric helpers and compatible fields", async () => {
    // Given: an existing instructor whose values need a readable operational summary
    const saveInstructor = vi.fn<(state: unknown, formData: FormData) => Promise<{ readonly status: "success"; readonly message: string }>>().mockResolvedValue({ status: "success", message: "Instructor settings saved" });
    const instructor = { ...sharedInstructor, totalBudget: 12_104_000 };
    render(<HealthSupportInstructorWorkspace instructors={[instructor]} saveInstructor={saveInstructor} workLogs={[]} />);

    // When: the Settings tab is opened and its form is submitted
    fireEvent.click(screen.getByRole("tab", { name: "설정" }));
    const form = screen.getByRole("form", { name: "강사 운영 설정" });
    fireEvent.submit(form);

    // Then: editable values remain unformatted while their operating context is human-readable
    expect(screen.getByLabelText("강사명")).toHaveValue("김보건");
    expect(screen.getByLabelText(/^시간당 단가/)).toHaveValue(20000);
    expect(screen.getByLabelText(/^총 예산/)).toHaveValue(12104000);
    expect(screen.getByText("20,000원")).toBeInTheDocument();
    expect(screen.getAllByText("15시간")).not.toHaveLength(0);
    expect(screen.getByText("12,104,000원")).toBeInTheDocument();
    await waitFor(() => expect(saveInstructor).toHaveBeenCalledOnce());
    expect(saveInstructor.mock.calls[0]?.[1].get("id")).toBe("instructor-1");
    expect(saveInstructor.mock.calls[0]?.[1].get("name")).toBe("김보건");
    expect(saveInstructor.mock.calls[0]?.[1].get("subject")).toBe("보건 지원");
    expect(saveInstructor.mock.calls[0]?.[1].get("weeklyHours")).toBe("15");
    expect(saveInstructor.mock.calls[0]?.[1].get("hourlyRate")).toBe("20000");
    expect(saveInstructor.mock.calls[0]?.[1].get("monthlyInsurance")).toBe("10000");
    expect(saveInstructor.mock.calls[0]?.[1].get("monthlyHourLimit")).toBe("60");
    expect(saveInstructor.mock.calls[0]?.[1].get("weeklyHourLimit")).toBe("15");
    expect(saveInstructor.mock.calls[0]?.[1].get("totalBudget")).toBe("12104000");
    expect(saveInstructor.mock.calls[0]?.[1].get("operationStartDate")).toBe("2026-03-01");
    expect(saveInstructor.mock.calls[0]?.[1].get("operationEndDate")).toBe("2026-12-31");
  });

  it("shows one instructor directly without a selector", () => {
    render(<HealthSupportInstructorWorkspace instructors={[instructors[0]]} workLogs={[]} />);

    expect(screen.getByText("김보건")).toBeInTheDocument();
    expect(screen.queryByLabelText("강사 선택")).not.toBeInTheDocument();
  });

  it("shows a selector only when more than one instructor exists", () => {
    render(<HealthSupportInstructorWorkspace instructors={instructors} workLogs={[]} />);

    expect(screen.getByLabelText("강사 선택")).toHaveValue("instructor-1");
    fireEvent.change(screen.getByLabelText("강사 선택"), { target: { value: "instructor-2" } });
    expect(screen.getByText("이건강")).toBeInTheDocument();
  });

  it("changes panels with accessible tabs and blocks malformed work-log submission", () => {
    const saveWorkLog = vi.fn(async () => ({ status: "success" as const, message: "saved" }));
    render(<HealthSupportInstructorWorkspace instructors={[instructors[0]]} saveWorkLog={saveWorkLog} workLogs={[]} />);

    fireEvent.click(screen.getByRole("tab", { name: "근무기록" }));
    expect(screen.getByRole("tabpanel", { name: "근무기록" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("시작 시간"), { target: { value: "13:00" } });
    fireEvent.change(screen.getByLabelText("종료 시간"), { target: { value: "09:00" } });
    fireEvent.submit(screen.getByRole("form", { name: "근무 기록 추가" }));

    expect(screen.getByRole("alert")).toHaveTextContent("종료 시간은 시작 시간보다 늦어야 합니다.");
    expect(saveWorkLog).not.toHaveBeenCalled();
  });

  it("shows draft hours before submission and prevents an end-before-start interval", () => {
    // Given: a work-log entry draft
    const saveWorkLog = vi.fn(async () => ({ status: "success" as const, message: "saved" }));
    render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} saveWorkLog={saveWorkLog} workLogs={[]} />);

    // When: the entered interval is first valid and then reversed
    fireEvent.click(screen.getByRole("tab", { name: "근무기록" }));
    expect(screen.getByLabelText("Draft hours")).toHaveTextContent("3.0시간");
    fireEvent.change(screen.getByLabelText("시작 시간"), { target: { value: "13:00" } });
    fireEvent.change(screen.getByLabelText("종료 시간"), { target: { value: "09:00" } });

    // Then: the invalid interval is visibly rejected before it can call the save action
    expect(screen.getByLabelText("Draft hours")).toHaveTextContent("유효한 시간을 입력하세요");
    expect(screen.getByRole("button", { name: "근무 기록 추가" })).toBeDisabled();
    expect(saveWorkLog).not.toHaveBeenCalled();
  });

  it("filters the editable work-log list by month and retains the selected month while editing", () => {
    // Given: work logs across two months
    render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} workLogs={sharedWorkLogs} />);

    // When: the Work Logs user selects September and edits its record
    fireEvent.click(screen.getByRole("tab", { name: "근무기록" }));
    fireEvent.change(screen.getByLabelText("Work log month"), { target: { value: "2026-09" } });
    fireEvent.click(screen.getByRole("button", { name: "2026-09-01 기록 수정" }));

    // Then: the list, summaries, and edit draft stay in the selected monthly context
    expect(screen.getByRole("region", { name: "Work log summaries" })).toHaveTextContent("3.0시간");
    expect(screen.getByRole("region", { name: "Work log summaries" })).toHaveTextContent("선택 주 합계5.0시간");
    expect(screen.getByRole("button", { name: "2026-09-01 기록 수정" })).toBeInTheDocument();
    expect(screen.queryByText("2026-08-31")).not.toBeInTheDocument();
    expect(screen.getByLabelText("근무 일자")).toHaveValue("2026-09-01");
  });

  it("keeps delete and Excel import entry discoverable from the work-log list", async () => {
    // Given: an existing work log
    const deleteWorkLog = vi.fn<(formData: FormData) => Promise<void>>().mockResolvedValue(undefined);
    const saveWorkLog = vi.fn<(state: unknown, formData: FormData) => Promise<{ readonly status: "success"; readonly message: string }>>().mockResolvedValue({ status: "success", message: "saved" });
    render(<HealthSupportInstructorWorkspace deleteWorkLog={deleteWorkLog} instructors={[sharedInstructor]} saveWorkLog={saveWorkLog} workLogs={[sharedWorkLogs[0]]} />);

    // When: Work Logs is opened and the delete command is chosen
    fireEvent.click(screen.getByRole("tab", { name: "근무기록" }));
    const sheet = XLSX.utils.aoa_to_sheet([["📅 날짜", "요일", "시작시간", "종료시간", "⏰실근무시간", "비고", "주차", "표시여부", "이번달"], ["2026-08-04", "", "09:00", "12:00", "", "엑셀 메모"]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "근무기록");
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new File([bytes], "work-logs.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    Object.defineProperty(file, "arrayBuffer", { value: async () => bytes });
    fireEvent.change(screen.getByLabelText("Excel work log import"), { target: { files: [file] } });
    await screen.findByRole("button", { name: "1건 가져오기" });
    fireEvent.click(screen.getByRole("button", { name: "1건 가져오기" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-08-03 기록 삭제" }));

    // Then: the existing record id is handed to the compatible delete action
    expect(deleteWorkLog).toHaveBeenCalledOnce();
    expect(deleteWorkLog.mock.calls[0]?.[0].get("id")).toBe("shared-log-1");
    await waitFor(() => expect(saveWorkLog).toHaveBeenCalledOnce());
    expect(saveWorkLog.mock.calls[0]?.[1].get("date")).toBe("2026-08-04");
  });

  it("uses the local current date for a new work-log draft", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-04-05T09:00:00+09:00"));
    try {
      render(<HealthSupportInstructorWorkspace instructors={[instructors[0]]} workLogs={[]} />);
      fireEvent.click(screen.getByRole("tab", { name: "근무기록" }));

      expect(screen.getByLabelText("근무 일자")).toHaveValue("2030-04-05");
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders settlement and statement previews from the same selected-month work logs", () => {
    // Given: a selected instructor with one active-month weekly and monthly limit overage
    const workLogs = [
      { id: "log-1", instructorId: "instructor-1", date: "2026-08-03", startTime: "09:00", endTime: "16:00", note: null },
      { id: "log-2", instructorId: "instructor-1", date: "2026-08-04", startTime: "09:00", endTime: "17:00", note: null },
    ];
    const instructor = { ...instructors[0], monthlyHourLimit: 14 };
    render(<HealthSupportInstructorWorkspace instructors={[instructor]} workLogs={workLogs} />);

    // When: the settlement preview is opened
    fireEvent.click(screen.getByRole("tab", { name: "월별 정산" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview work detail" }));

    // Then: settlement contains insurance, warnings, and the same-log monthly detail
    expect(screen.getByRole("region", { name: "Monthly settlement document" })).toHaveTextContent("310,000");
    expect(screen.getByText("Weekly limit reached")).toBeInTheDocument();
    expect(screen.getByText("Monthly limit reached")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Monthly work detail" })).toHaveTextContent("15.0");
    expect(screen.getByRole("button", { name: "Print work detail" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Monthly settlement document" })).toHaveClass("health-support-document--work-detail");
    let printFrame: FrameRequestCallback | undefined;
    const animationFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      printFrame = callback;
      return 0;
    });
    const print = vi.spyOn(window, "print").mockImplementation(() => {
      expect(screen.getByLabelText("보건지원강사 관리 작업 공간")).toHaveAttribute("data-print-document", "work-detail");
    });
    fireEvent.click(screen.getByRole("button", { name: "Print work detail" }));
    expect(print).not.toHaveBeenCalled();
    expect(printFrame).toBeDefined();
    printFrame?.(0);
    expect(print).toHaveBeenCalledOnce();
    animationFrame.mockRestore();
    print.mockRestore();

    // When: the payment statement preview is opened
    fireEvent.click(screen.getByRole("tab", { name: "지급명세서·출력" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview payment statement" }));

    // Then: it exposes the hourly-wage-only amount, excluding monthly insurance
    expect(screen.getByRole("region", { name: "Payment statement document" })).toHaveTextContent("300,000");
    expect(screen.getByRole("region", { name: "Payment statement document" })).not.toHaveTextContent("310,000");
    expect(screen.getByRole("button", { name: "Print payment statement" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Payment statement document" })).toHaveClass("health-support-document--payment-statement");
  });

  it("keeps each on-screen document preview open when its preview action is activated again", () => {
    // Given: a workspace with a monthly work log
    const workLogs = [{ id: "log-1", instructorId: "instructor-1", date: "2026-08-03", startTime: "09:00", endTime: "12:00", note: null }];
    render(<HealthSupportInstructorWorkspace instructors={[instructors[0]]} workLogs={workLogs} />);

    // When: each preview action is activated more than once
    fireEvent.click(screen.getByRole("tab", { name: "월별 정산" }));
    const workDetailPreview = screen.getByRole("button", { name: "Preview work detail" });
    fireEvent.click(workDetailPreview);
    fireEvent.click(workDetailPreview);
    fireEvent.click(screen.getByRole("tab", { name: "지급명세서·출력" }));
    const paymentStatementPreview = screen.getByRole("button", { name: "Preview payment statement" });
    fireEvent.click(paymentStatementPreview);
    fireEvent.click(paymentStatementPreview);

    // Then: opener actions remain idempotent instead of hiding the already-open document
    expect(screen.getByRole("region", { name: "Payment statement document" })).toHaveTextContent("60,000");
    fireEvent.click(screen.getByRole("tab", { name: "월별 정산" }));
    expect(screen.getByRole("table", { name: "Monthly work detail" })).toBeInTheDocument();
  });

  it("derives the initial document month from the selected instructor's shared logs", () => {
    // Given: a selected instructor whose only shared work log is from September
    const workLogs = [{ id: "log-1", instructorId: "instructor-1", date: "2026-09-07", startTime: "09:00", endTime: "12:00", note: null }];
    render(<HealthSupportInstructorWorkspace instructors={[instructors[0]]} workLogs={workLogs} />);

    // When: the settlement panel opens without a manually selected month
    fireEvent.click(screen.getByRole("tab", { name: "월별 정산" }));

    // Then: the document defaults to the shared log month rather than a fixed calendar month
    expect(screen.getByLabelText("Settlement month")).toHaveValue("2026-09");
    expect(screen.getByRole("region", { name: "Monthly settlement document" })).toHaveTextContent("60,000");
  });

  it("updates the selected-month settlement hierarchy without retaining stale work-detail data", () => {
    // Given: work logs in two different settlement months
    render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} workLogs={sharedWorkLogs} />);

    // When: the settlement month is changed to September
    fireEvent.click(screen.getByRole("tab", { name: /월별 정산/ }));
    fireEvent.change(screen.getByLabelText("Settlement month"), { target: { value: "2026-09" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview work detail" }));

    // Then: the selected-month, work/pay, limit, and budget groups make the source hierarchy explicit
    const settlement = screen.getByRole("region", { name: "Monthly settlement document" });
    expect(screen.getByRole("heading", { name: "Selected month settlement" })).toBeInTheDocument();
    expect(screen.getByLabelText("Settlement month")).toHaveValue("2026-09");
    expect(screen.getByRole("heading", { name: "Work and wage summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Limit and budget status" })).toBeInTheDocument();
    expect(settlement).toHaveTextContent("3.0");
    expect(screen.getByRole("table", { name: "Monthly work detail" })).toHaveTextContent("2026-09-01");
    expect(screen.queryByText("2026-08-03")).not.toBeInTheDocument();
  });

  it("keeps payment-statement and monthly-work-detail previews distinct, including an empty selected month", () => {
    // Given: a document month with no work logs
    render(<HealthSupportInstructorWorkspace instructors={[sharedInstructor]} workLogs={sharedWorkLogs} />);

    // When: the user selects an empty month and opens the work-detail preview
    fireEvent.click(screen.getByRole("tab", { name: /월별 정산/ }));
    fireEvent.change(screen.getByLabelText("Settlement month"), { target: { value: "2026-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview work detail" }));

    // Then: the work-detail preview reports its own no-data state rather than resembling a payment statement
    expect(screen.getByRole("heading", { name: "Monthly work-detail preview" })).toBeInTheDocument();
    expect(screen.getByText(/선택한 달의 근무기록이 없습니다/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /지급명세서·출력/ }));
    fireEvent.click(screen.getByRole("button", { name: "Preview payment statement" }));

    // And: the separate payment-statement preview retains its own output and print command
    expect(screen.getByRole("heading", { name: "Payment statement preview" })).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Monthly work detail" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print payment statement" })).toBeInTheDocument();
  });
});
