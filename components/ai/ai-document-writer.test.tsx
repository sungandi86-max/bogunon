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
  fireEvent.change(screen.getByLabelText(/^학생 식별 ID/), {
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
    vi.stubGlobal("fetch", successfulFetch());
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("shows the two document types and privacy notice with MVP defaults", () => {
    render(<AiDocumentWriter />);

    const documentType = screen.getByRole("combobox", { name: "문서 유형" });
    expect(documentType).toHaveValue("club-record");
    expect(screen.getByRole("option", { name: "동아리 생활기록부 초안" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "보건교육 활동 기록 초안" })).toBeInTheDocument();
    fireEvent.change(documentType, { target: { value: "health-education-record" } });
    expect(documentType).toHaveValue("health-education-record");
    expect(screen.getByText("입력한 내용과 생성 결과는 저장되지 않습니다.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "객관적이고 구체적으로" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "1500바이트 이내" })).toBeChecked();
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
    fireEvent.change(screen.getByLabelText(/^학생 식별 ID/), {
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

    expect(await screen.findByRole("heading", { name: "생성된 초안" })).toBeInTheDocument();
    expect(screen.getByText(draft)).toBeInTheDocument();
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
    expect(screen.getByText(longDraft)).toHaveTextContent(longDraft);
    expect(screen.getByText("1,503바이트")).toBeInTheDocument();
  });

  it("copies the generated draft and reports success", async () => {
    render(<AiDocumentWriter />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 만들기" }));
    fireEvent.click(await screen.findByRole("button", { name: "초안 복사" }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(draft));
    expect(screen.getByText("초안을 복사했습니다.")).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/^학생 식별 ID/), {
      target: { value: "S001" },
    });
    expect(storage).not.toHaveBeenCalled();

    view.unmount();
    render(<AiDocumentWriter />);
    expect(screen.getByLabelText(/^학생 식별 ID/)).toHaveValue("");
    expect(storage).not.toHaveBeenCalled();
  });

  it("renders the writing form on a desktop viewport", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<AiDocumentWriter />);

    expect(await screen.findByRole("heading", { name: "AI 문서 작성" })).toBeInTheDocument();
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
    expect(screen.queryByLabelText(/^학생 식별 ID/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "오늘 화면으로 돌아가기" }))
      .toHaveAttribute("href", "/briefing");
    expect(fetch).not.toHaveBeenCalled();
  });
});
