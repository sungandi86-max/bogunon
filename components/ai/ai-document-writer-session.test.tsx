import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  draft,
  fillRequiredFields,
  renderWriter,
  setupWriterTest,
  successfulFetch,
} from "@/components/ai/ai-document-writer-test-helpers";

describe("AiDocumentWriter session behavior", () => {
  beforeEach(setupWriterTest);

  it("copies the generated draft and reports success", async () => {
    renderWriter();
    await screen.findByText("2026학년도 학교생활기록부 기재요령 자동 적용");
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    fireEvent.click(await screen.findByRole("button", { name: "초안 복사" }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(draft));
    expect(await screen.findByText("초안을 복사했습니다.")).toBeInTheDocument();
  });

  it("uses memory state only and starts empty after remount", () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const view = renderWriter();
    fireEvent.change(screen.getByLabelText(/^익명 학생 ID/), {
      target: { value: "S001" },
    });
    expect(storage).not.toHaveBeenCalled();

    view.unmount();
    renderWriter();
    expect(screen.getByLabelText(/^익명 학생 ID/)).toHaveValue("");
    expect(storage).not.toHaveBeenCalled();
  });

  it("renders only the PC notice and no file processing controls on a small viewport", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    renderWriter();

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
    renderWriter();
    await screen.findByText("2026학년도 학교생활기록부 기재요령 자동 적용");
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

  it("blocks generation until a personal AI connection is available", () => {
    renderWriter(false);

    expect(screen.getByText("AI가 아직 연결되지 않았습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AI 연결하기" })).toHaveAttribute("href", "/settings/ai");
    expect(screen.getByRole("button", { name: "생기부 초안 생성" })).toBeDisabled();
    expect(fetch).toHaveBeenCalledWith("/api/record-guidelines", expect.any(Object));
    expect(fetch).not.toHaveBeenCalledWith("/api/ai/document-writer", expect.anything());
  });
});
