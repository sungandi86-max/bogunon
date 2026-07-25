import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  draft,
  fillRequiredFields,
  renderWriter,
  savedGuideline,
  setupWriterTest,
  successfulFetch,
} from "@/components/ai/ai-document-writer-test-helpers";

describe("AiDocumentWriter guideline application", () => {
  beforeEach(setupWriterTest);

  it("keeps the guideline collapsed by default and persists extracted text", async () => {
    vi.stubGlobal("fetch", successfulFetch(draft, []));
    renderWriter();
    const summary = screen.getByText("생기부 기준자료").closest("summary");
    const details = summary?.closest("details");
    expect(details).not.toHaveAttribute("open");

    if (summary) fireEvent.click(summary);
    const file = new File(["대회 수상 관련 기재 내용을 확인한다."], "2026-guide.txt", {
      type: "text/plain",
    });
    fireEvent.change(screen.getByLabelText("생기부 기준자료 파일"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("적용 기준")).toBeInTheDocument();
    expect(screen.getByText("2026-guide.txt")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/record-guidelines", expect.objectContaining({
      method: "PUT",
      body: expect.not.stringContaining("activityReport"),
    }));
    fireEvent.click(screen.getByRole("button", { name: "학교생활기록부 기재요령 삭제" }));
    await waitFor(() => expect(screen.queryByText("2026-guide.txt")).not.toBeInTheDocument());
    expect(details).toHaveAttribute("open");
  });

  it("loads account guidelines after refresh and automatically applies the selected year", async () => {
    vi.stubGlobal("fetch", successfulFetch(draft, [savedGuideline]));
    renderWriter();

    expect(await screen.findByText("2026학년도 학교생활기록부 기재요령 자동 적용"))
      .toBeInTheDocument();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    expect(await screen.findByRole("tab", { name: "생성된 초안" })).toBeInTheDocument();

    const aiCall = vi.mocked(fetch).mock.calls.find(
      ([input]) => String(input).endsWith("/api/ai/document-writer"),
    );
    const payload = JSON.parse(String(aiCall?.[1]?.body)) as {
      readonly document?: {
        readonly academicYear?: string;
        readonly guideline?: unknown;
      };
    };
    expect(payload.document?.academicYear).toBe("2026");
    expect(payload.document).not.toHaveProperty("guideline");
    expect(String(aiCall?.[1]?.body)).not.toContain(savedGuideline.extractedText);
  });

  it("blocks generation and guides the user when the selected year has no guideline", async () => {
    vi.stubGlobal("fetch", successfulFetch(draft, []));
    renderWriter();

    expect(await screen.findByText(
      "2026학년도 기준자료가 등록되지 않았습니다. 설정에서 기준자료를 먼저 등록해주세요.",
    )).toBeInTheDocument();
    fillRequiredFields();

    expect(screen.getByRole("button", { name: "생기부 초안 생성" })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/ai/document-writer",
      expect.anything(),
    );
  });

  it("clears a generated result when the selected guideline year changes", async () => {
    renderWriter();
    await screen.findByText("2026학년도 학교생활기록부 기재요령 자동 적용");
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    expect(await screen.findByRole("tab", { name: "생성된 초안" })).toBeInTheDocument();

    fireEvent.click(screen.getByText("생기부 기준자료"));
    fireEvent.change(screen.getByLabelText("기준 학년도"), {
      target: { value: "2027" },
    });

    expect(screen.queryByRole("tab", { name: "생성된 초안" })).not.toBeInTheDocument();
    expect(screen.getByText(
      "2027학년도 기준자료가 등록되지 않았습니다. 설정에서 기준자료를 먼저 등록해주세요.",
    )).toBeInTheDocument();
  });

  it("ignores an in-flight result after the active guideline is deleted", async () => {
    let resolveGeneration: ((response: Response) => void) | undefined;
    let resolveDeletion: ((response: Response) => void) | undefined;
    const fallback = successfulFetch();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith("/api/ai/document-writer")) {
        return new Promise<Response>((resolve) => {
          resolveGeneration = resolve;
        });
      }
      if (String(input).endsWith("/api/record-guidelines") && init?.method === "DELETE") {
        return new Promise<Response>((resolve) => {
          resolveDeletion = resolve;
        });
      }
      return fallback(input, init) as Promise<Response>;
    }));
    renderWriter();
    await screen.findByText("2026학년도 학교생활기록부 기재요령 자동 적용");
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));

    fireEvent.click(screen.getByText("생기부 기준자료"));
    fireEvent.click(screen.getByRole("button", { name: "학교생활기록부 기재요령 삭제" }));
    expect(screen.getByRole("button", { name: "생기부 초안 생성" })).toBeDisabled();
    expect(vi.mocked(fetch).mock.calls.filter(
      ([input]) => String(input).endsWith("/api/ai/document-writer"),
    )).toHaveLength(1);
    resolveGeneration?.({
      ok: true,
      json: async () => ({
        draft,
        insufficiencyNotice: null,
        mode: "openai",
        review: { errors: [], needsConfirmation: [], suggestions: [] },
      }),
    } as Response);
    resolveDeletion?.({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    await waitFor(() => expect(screen.queryByRole("tab", { name: "생성된 초안" }))
      .not.toBeInTheDocument());
    expect(await screen.findByText(
      "2026학년도 기준자료가 등록되지 않았습니다. 설정에서 기준자료를 먼저 등록해주세요.",
    )).toBeInTheDocument();
  });
});
