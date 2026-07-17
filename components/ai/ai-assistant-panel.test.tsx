import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";

describe("AiAssistantPanel", () => {
  it("shows a structured preview and sends a task to the existing form only after confirmation", async () => {
    const onCreateDraft = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mode: "mock",
        action: {
          action: "create_task",
          title: "결핵검진 안내",
          description: "안내 업무",
          category: "healthScreening",
          priority: "high",
          scheduled_date: "2026-07-20",
          due_date: null,
          recurrence: null,
          checklist: ["대상 범위 확인"],
          links: [],
          reminder: null,
        },
      }),
    }));

    render(<AiAssistantPanel onClose={vi.fn()} onCreateDraft={onCreateDraft} open />);
    fireEvent.change(screen.getByLabelText("AI 요청"), { target: { value: "다음 주 월요일 결핵검진 안내 업무 만들어줘" } });
    fireEvent.click(screen.getByRole("button", { name: "초안 만들기" }));

    expect(await screen.findByText("구조화된 미리보기")).toBeInTheDocument();
    expect(onCreateDraft).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "생성 폼에서 확인" }));
    expect(onCreateDraft).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create_task", title: "결핵검진 안내" }),
      undefined,
    );
  });

  it("warns on blocked sensitive input without showing a preview", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ code: "SENSITIVE_INPUT", error: "민감정보를 제거해 주세요.", warnings: ["학번"] }),
    }));
    render(<AiAssistantPanel onClose={vi.fn()} onCreateDraft={vi.fn()} open />);
    fireEvent.change(screen.getByLabelText("AI 요청"), { target: { value: "학번 1234 상담 내용 정리" } });
    fireEvent.click(screen.getByRole("button", { name: "초안 만들기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("민감정보를 제거해 주세요");
    expect(screen.queryByText("구조화된 미리보기")).not.toBeInTheDocument();
  });

  it("cancels an in-flight request without applying a draft", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<AiAssistantPanel onClose={vi.fn()} onCreateDraft={vi.fn()} open />);
    fireEvent.change(screen.getByLabelText("AI 요청"), { target: { value: "오늘 업무 요약" } });
    fireEvent.click(screen.getByRole("button", { name: "초안 만들기" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "요청 취소" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "요청 취소" }));
    expect(abort).toHaveBeenCalled();
  });

  it("blocks sensitive content introduced while editing a structured preview", async () => {
    const onCreateDraft = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mode: "mock",
        action: {
          action: "create_task",
          title: "안내 업무",
          description: null,
          category: "other",
          priority: "normal",
          scheduled_date: null,
          due_date: null,
          recurrence: null,
          checklist: [],
          links: [],
          reminder: null,
        },
      }),
    }));
    render(<AiAssistantPanel onClose={vi.fn()} onCreateDraft={onCreateDraft} open />);
    fireEvent.change(screen.getByLabelText("AI 요청"), { target: { value: "안내 업무 만들어줘" } });
    fireEvent.click(screen.getByRole("button", { name: "초안 만들기" }));
    const editor = await screen.findByLabelText("AI 구조화 초안");
    fireEvent.change(editor, { target: { value: JSON.stringify({
      action: "create_task",
      title: "학생 이름: 김보건 검진 결과",
    }) } });
    fireEvent.click(screen.getByRole("button", { name: "생성 폼에서 확인" }));

    expect(screen.getByRole("alert")).toHaveTextContent("민감정보를 제거해 주세요");
    expect(onCreateDraft).not.toHaveBeenCalled();
  });
});
