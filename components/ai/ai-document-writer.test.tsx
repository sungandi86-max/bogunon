import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiDocumentWriter } from "@/components/ai/ai-document-writer";

const draft = "건강 캠페인 자료를 조사하고 발표 과정에 적극적으로 참여함.";
const nativeSetTimeout = globalThis.setTimeout;

function successfulFetch(resultDraft = draft) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      mode: "openai",
      draft: resultDraft,
      insufficiencyNotice: null,
    }),
  });
}

function fillRequiredFields(): void {
  fireEvent.change(screen.getByLabelText(/^익명 학생 ID/), {
    target: { value: "S001" },
  });
  fireEvent.change(screen.getByLabelText("활동보고서"), {
    target: { value: "건강 캠페인 자료를 조사하고 발표함" },
  });
  fireEvent.click(screen.getByRole("checkbox", {
    name: "학생 이름, 학번, 연락처 등 개인정보를 입력하지 않았습니다.",
  }));
}

describe("AiDocumentWriter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("setTimeout", (callback: TimerHandler, delay?: number) => {
      if (delay === 0 && typeof callback === "function") callback();
      return typeof callback === "function" ? nativeSetTimeout(callback, delay) : 1;
    });
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("fetch", successfulFetch());
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("uses the simplified activity report and optional additional record structure", () => {
    render(<AiDocumentWriter />);

    expect(screen.getByRole("heading", { level: 1, name: "동아리 생활기록부 초안" })).toBeInTheDocument();
    expect(screen.getByLabelText("활동보고서")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^추가 기록 \(선택\)/ })).toBeInTheDocument();
    expect(screen.queryByLabelText("자기평가")).not.toBeInTheDocument();
    expect(screen.queryByText("교사 메모")).not.toBeInTheDocument();
    expect(screen.getByText("입력한 내용과 생성 결과는 저장되지 않습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "생기부 초안 생성" })).toBeDisabled();
  });

  it("shows readiness without repeating student source text", () => {
    render(<AiDocumentWriter />);

    const status = screen.getByLabelText("입력 준비 상태");
    expect(status).toHaveTextContent("익명 학생 ID 입력");
    expect(status).toHaveTextContent("활동보고서 준비");
    expect(status).toHaveTextContent("추가 기록 없음 · 선택 사항");
    expect(status).toHaveTextContent("공식 기재요령 없음 · 일반 점검만 가능");
    expect(screen.getByText("1,500바이트 확인 후 복사")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^익명 학생 ID/), { target: { value: "S001" } });
    fireEvent.change(screen.getByLabelText("활동보고서"), { target: { value: "학생 원문 비공개" } });
    expect(status).not.toHaveTextContent("학생 원문 비공개");
  });

  it("loads an activity file into an editable textarea and supports deletion", async () => {
    render(<AiDocumentWriter />);
    const file = new File(["학생 활동\r\n자기평가"], "student-name.txt", { type: "text/plain" });

    fireEvent.change(screen.getByLabelText("활동보고서 파일"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(screen.getByLabelText("활동보고서")).toHaveValue("학생 활동\n자기평가"));
    expect(screen.getByText("student-name.txt")).toBeInTheDocument();
    expect(screen.getByText("텍스트 추출 완료 · 10자")).toBeInTheDocument();

    const replacement = new File(["교체한 활동보고서"], "replacement.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("활동보고서 파일"), {
      target: { files: [replacement] },
    });
    await waitFor(() => expect(screen.getByLabelText("활동보고서")).toHaveValue("교체한 활동보고서"));
    expect(screen.getByText("replacement.txt")).toBeInTheDocument();
    expect(screen.queryByText("student-name.txt")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "활동보고서 파일 삭제" }));
    expect(screen.getByLabelText("활동보고서")).toHaveValue("");
    expect(screen.queryByText("student-name.txt")).not.toBeInTheDocument();
  });

  it("keeps the latest activity file when an older extraction finishes later", async () => {
    render(<AiDocumentWriter />);
    fireEvent.change(screen.getByLabelText("활동보고서"), {
      target: { value: "기존 활동보고서" },
    });

    let resolveOlder: ((value: string) => void) | undefined;
    let resolveLatest: ((value: string) => void) | undefined;
    const older = new File(["older"], "older.txt", { type: "text/plain" });
    const latest = new File(["latest"], "latest.txt", { type: "text/plain" });
    Object.defineProperty(older, "text", {
      value: () => new Promise<string>((resolve) => {
        resolveOlder = resolve;
      }),
    });
    Object.defineProperty(latest, "text", {
      value: () => new Promise<string>((resolve) => {
        resolveLatest = resolve;
      }),
    });

    fireEvent.change(screen.getByLabelText("활동보고서 파일"), {
      target: { files: [older] },
    });
    expect(screen.getByRole("button", { name: "생기부 초안 생성" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("활동보고서 파일"), {
      target: { files: [latest] },
    });

    resolveLatest?.("최신 활동보고서");
    await waitFor(() => {
      expect(screen.getByLabelText("활동보고서")).toHaveValue("최신 활동보고서");
    });
    resolveOlder?.("오래된 활동보고서");
    await waitFor(() => {
      expect(screen.getByLabelText("활동보고서")).toHaveValue("최신 활동보고서");
    });
    expect(screen.getByText("latest.txt")).toBeInTheDocument();
    expect(screen.queryByText("older.txt")).not.toBeInTheDocument();
  });

  it("keeps direct entry available after a file extraction failure", async () => {
    render(<AiDocumentWriter />);
    const file = new File(["broken"], "report.pdf", { type: "text/plain" });

    fireEvent.change(screen.getByLabelText("활동보고서 파일"), {
      target: { files: [file] },
    });

    expect(await screen.findByText(/파일 확장자와 형식이 일치하지 않습니다/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("활동보고서"), { target: { value: "직접 입력한 내용" } });
    expect(screen.getByLabelText("활동보고서")).toHaveValue("직접 입력한 내용");
  });

  it("keeps the guideline collapsed by default and registers it in memory", async () => {
    render(<AiDocumentWriter />);
    const summary = screen.getByText("생기부 기준자료").closest("summary");
    const details = summary?.closest("details");
    expect(details).not.toHaveAttribute("open");

    if (summary) fireEvent.click(summary);
    const file = new File(["대회 수상 관련 기재 내용을 확인한다."], "2026-guide.txt", {
      type: "text/plain",
    });
    fireEvent.change(screen.getByLabelText("생기부 기준자료 TXT 파일"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("적용 기준")).toBeInTheDocument();
    expect(screen.getByText("2026-guide.txt")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "기준자료 삭제" }));
    expect(screen.queryByText("2026-guide.txt")).not.toBeInTheDocument();
    expect(details).toHaveAttribute("open");
  });

  it("validates the anonymous ID and privacy confirmation", () => {
    render(<AiDocumentWriter />);
    fireEvent.change(screen.getByLabelText("활동보고서"), {
      target: { value: "활동 내용" },
    });
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    expect(screen.getByRole("alert")).toHaveTextContent("학생 식별 ID를 입력해 주세요.");

    fireEvent.change(screen.getByLabelText(/^익명 학생 ID/), { target: { value: "S001" } });
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    expect(screen.getByRole("alert")).toHaveTextContent("개인정보를 입력하지 않았다는 확인이 필요합니다.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps an over-limit report visible and blocks generation without truncating it", () => {
    render(<AiDocumentWriter />);
    const longReport = "가".repeat(15_001);

    fireEvent.change(screen.getByLabelText("활동보고서"), {
      target: { value: longReport },
    });

    expect(screen.getByLabelText("활동보고서")).toHaveValue(longReport);
    expect(screen.getByText(/15,000자 이하로 줄여주세요/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "생기부 초안 생성" })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("generates without an additional record and sends no self-evaluation field", async () => {
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));

    expect(await screen.findByRole("tab", { name: "생성된 초안" })).toBeInTheDocument();
    expect(screen.getByLabelText("생성된 초안 편집")).toHaveValue(draft);
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestOptions = fetchCall?.[1];
    const payload: unknown = JSON.parse(String(requestOptions?.body));
    expect(payload).toMatchObject({
      activityReport: "건강 캠페인 자료를 조사하고 발표함",
      additionalRecord: "",
    });
    expect(payload).not.toHaveProperty("selfEvaluation");
    expect(payload).not.toHaveProperty("teacherMemo");
    expect(screen.queryByText(/교사 메모가 없어/)).not.toBeInTheDocument();
  });

  it("sends the optional additional record and shows both result tabs", async () => {
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.change(screen.getByRole("textbox", { name: /^추가 기록 \(선택\)/ }), {
      target: { value: "축제 부스 운영을 총괄함" },
    });
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));

    expect(await screen.findByRole("tab", { name: "생성된 초안" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "기재 내용 점검" })).toBeInTheDocument();
    const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body)) as {
      readonly additionalRecord?: unknown;
    };
    expect(payload.additionalRecord).toBe("축제 부스 운영을 총괄함");
  });

  it("updates character and UTF-8 byte counts while editing the draft", async () => {
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    const editor = await screen.findByLabelText("생성된 초안 편집");

    fireEvent.change(editor, { target: { value: "보건A" } });

    expect(screen.getByText("3자")).toBeInTheDocument();
    expect(screen.getByText("7바이트")).toBeInTheDocument();
    expect(screen.getByText("1500바이트 이내입니다.")).toBeInTheDocument();
  });

  it("copies the generated draft and reports success", async () => {
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    fireEvent.click(await screen.findByRole("button", { name: "초안 복사" }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(draft));
    expect(await screen.findByText("초안을 복사했습니다.")).toBeInTheDocument();
  });

  it("uses memory state only and starts empty after remount", () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const view = render(<AiDocumentWriter />);
    fireEvent.change(screen.getByLabelText(/^익명 학생 ID/), {
      target: { value: "S001" },
    });
    expect(storage).not.toHaveBeenCalled();

    view.unmount();
    render(<AiDocumentWriter />);
    expect(screen.getByLabelText(/^익명 학생 ID/)).toHaveValue("");
    expect(storage).not.toHaveBeenCalled();
  });

  it("renders only the PC notice and no file processing controls on a small viewport", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<AiDocumentWriter />);

    expect(await screen.findByRole("heading", {
      name: "생기부 도우미는 PC에서 이용해 주세요",
    })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "생기부 초안 생성" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("활동보고서 파일")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "오늘 화면으로 돌아가기" }))
      .toHaveAttribute("href", "/briefing");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps the result review controls operable", async () => {
    vi.stubGlobal("fetch", successfulFetch("최고의 역량을 보임."));
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    const reviewTab = await screen.findByRole("tab", { name: /기재 내용 점검/ });
    fireEvent.click(reviewTab);

    const reviewPanel = screen.getByRole("tabpanel");
    expect(within(reviewPanel).getByText("과장과 단정")).toBeInTheDocument();
    fireEvent.click(within(reviewPanel).getByRole("button", { name: "제안 적용" }));
    fireEvent.click(screen.getByRole("tab", { name: "생성된 초안" }));
    expect(screen.getByLabelText("생성된 초안 편집"))
      .toHaveValue("활동 자료에서 확인되는 참여 모습을 보임.");
  });
});
