import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiDocumentWriter } from "@/components/ai/ai-document-writer";

const draft = "건강 캠페인 자료를 조사하고 발표 과정에 적극적으로 참여함.";

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
    target: { value: "건강 캠페인 자료를 조사함" },
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
      return 1;
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

  it("shows the single club record purpose and privacy notice with MVP defaults", () => {
    render(<AiDocumentWriter />);

    expect(screen.getByRole("heading", { name: "동아리 생활기록부 초안" })).toBeInTheDocument();
    expect(screen.queryByText("보건교육 활동 기록 초안")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "문서 유형" })).not.toBeInTheDocument();
    expect(screen.getByText("입력한 내용과 생성 결과는 저장되지 않습니다.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "객관적이고 구체적으로" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "1500바이트 이내" })).toBeChecked();
  });

  it("loads an activity TXT file into an editable textarea", async () => {
    render(<AiDocumentWriter />);
    const file = new File(["파일에서 읽은 활동 내용"], "activity.txt", { type: "text/plain" });

    fireEvent.change(screen.getByLabelText("활동보고서 TXT 파일"), {
      target: { files: [file] },
    });

    expect(await screen.findByDisplayValue("파일에서 읽은 활동 내용")).toBeInTheDocument();
    expect(screen.getByText("activity.txt 내용을 불러왔습니다.")).toBeInTheDocument();
  });

  it("registers and removes an official guideline in memory", async () => {
    render(<AiDocumentWriter />);
    const file = new File(["대회 수상 관련 기재 내용을 확인한다."], "2026-guide.txt", {
      type: "text/plain",
    });

    fireEvent.change(screen.getByLabelText("생기부 기준자료 TXT 파일"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("적용 기준")).toBeInTheDocument();
    expect(screen.getByText(/2026학년도 학교생활기록부 기재요령/)).toBeInTheDocument();
    expect(screen.getByText("2026-guide.txt")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "기준자료 삭제" }));
    expect(screen.queryByText("2026-guide.txt")).not.toBeInTheDocument();
    expect(screen.getByText(/공식 기재요령을 등록하면/)).toBeInTheDocument();
  });

  it("validates the anonymous ID before generating", () => {
    render(<AiDocumentWriter />);
    fireEvent.change(screen.getByLabelText("활동보고서"), {
      target: { value: "활동 내용" },
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));

    expect(screen.getByRole("alert")).toHaveTextContent("학생 식별 ID를 입력해 주세요.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires at least one material and privacy confirmation", () => {
    render(<AiDocumentWriter />);
    fireEvent.change(screen.getByLabelText(/^익명 학생 ID/), {
      target: { value: "S001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));
    expect(screen.getByRole("alert")).toHaveTextContent("중 하나 이상 입력해 주세요.");

    fireEvent.change(screen.getByLabelText("교사 메모"), {
      target: { value: "발표 준비를 꾸준히 함" },
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));
    expect(screen.getByRole("alert")).toHaveTextContent("개인정보를 입력하지 않았다는 확인이 필요합니다.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("generates from partial input and displays counts and the byte limit", async () => {
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));

    expect(await screen.findByRole("tab", { name: "생성된 초안" })).toBeInTheDocument();
    expect(screen.getByLabelText("생성된 초안 편집")).toHaveValue(draft);
    expect(screen.getByText(`${Array.from(draft).length}자`)).toBeInTheDocument();
    expect(screen.getByText(`${new TextEncoder().encode(draft).length}바이트`)).toBeInTheDocument();
    expect(screen.getByText("1500바이트 이내입니다.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/ai/document-writer", expect.objectContaining({
      method: "POST",
    }));
  });

  it("warns without truncating a draft over 1500 UTF-8 bytes", async () => {
    const longDraft = "가".repeat(501);
    vi.stubGlobal("fetch", successfulFetch(longDraft));
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));

    expect(await screen.findByText("1500바이트를 초과했습니다. 내용을 줄여주세요.")).toBeInTheDocument();
    expect(screen.getByLabelText("생성된 초안 편집")).toHaveValue(longDraft);
    expect(screen.getByText("1,503바이트")).toBeInTheDocument();
  });

  it("shows the teacher observation notice when no teacher memo was supplied", async () => {
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));

    expect(await screen.findByText(/교사 메모가 없어 학생 제출자료 중심으로/)).toBeInTheDocument();
  });

  it("reviews the editable draft and applies an individual suggestion", async () => {
    vi.stubGlobal("fetch", successfulFetch("최고의 역량을 보임."));
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));
    fireEvent.click(await screen.findByRole("tab", { name: /생기부 기재 점검/ }));

    expect(screen.getByText("과장과 단정")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "제안 적용" }));
    fireEvent.click(screen.getByRole("tab", { name: "생성된 초안" }));
    expect(screen.getByLabelText("생성된 초안 편집"))
      .toHaveValue("활동 자료에서 확인되는 참여 모습을 보임.");
  });

  it("copies the generated draft and reports success", async () => {
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));
    fireEvent.click(await screen.findByRole("button", { name: "초안 복사" }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(draft));
    expect(await screen.findByText("초안을 복사했습니다.")).toBeInTheDocument();
  });

  it("reports a clipboard permission failure", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("denied"));
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));
    fireEvent.click(await screen.findByRole("button", { name: "초안 복사" }));

    expect(await screen.findByText(/초안을 복사하지 못했습니다/)).toBeInTheDocument();
  });

  it("keeps current input when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "초안을 만들지 못했습니다. 다시 시도해 주세요." }),
    }));
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("초안을 만들지 못했습니다.");
    expect(screen.getByLabelText("활동보고서")).toHaveValue("건강 캠페인 자료를 조사함");
  });

  it("shows an easy Korean message for a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("네트워크 연결을 확인하고 다시 시도해 주세요.");
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

  it("renders the writing form on a desktop viewport", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<AiDocumentWriter />);

    expect(await screen.findByRole("heading", { name: "동아리 생활기록부 초안" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AI 초안 만들기" })).toBeInTheDocument();
  });

  it("renders only the PC notice on a small viewport", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<AiDocumentWriter />);

    expect(await screen.findByRole("heading", {
      name: "AI 문서 작성은 PC에서 이용해주세요",
    })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "AI 초안 만들기" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^익명 학생 ID/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "오늘 화면으로 돌아가기" }))
      .toHaveAttribute("href", "/briefing");
    expect(fetch).not.toHaveBeenCalled();
  });
});
