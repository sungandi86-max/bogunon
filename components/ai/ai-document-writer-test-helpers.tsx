import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { AiConnectionProvider } from "@/components/ai/ai-connection-context";
import { AiDocumentWriter } from "@/components/ai/ai-document-writer";
import type { RecordGuideline } from "@/lib/ai/record-guidelines";

export const draft = "건강 캠페인 자료를 조사하고 발표 과정에 적극적으로 참여함.";
const nativeSetTimeout = globalThis.setTimeout;

export function successfulFetch(
  resultDraft = draft,
  initialGuidelines: readonly RecordGuideline[] = [],
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/api/record-guidelines")) {
      if (init?.method === "PUT") {
        const submitted = JSON.parse(String(init.body)) as {
          readonly schoolYear: number;
          readonly sourceType: "guide";
          readonly originalFilename: string;
          readonly mimeType: "text/plain";
          readonly extractedText: string;
          readonly fileSize: number;
        };
        return {
          ok: true,
          json: async () => ({
            guideline: {
              createdAt: "2026-07-25T00:00:00Z",
              extractedText: submitted.extractedText,
              fileSize: submitted.fileSize,
              id: "11111111-1111-4111-8111-111111111111",
              mimeType: submitted.mimeType,
              originalFilename: submitted.originalFilename,
              schoolYear: submitted.schoolYear,
              sourceType: submitted.sourceType,
              updatedAt: "2026-07-25T00:00:00Z",
            },
          }),
        };
      }
      return {
        ok: true,
        json: async () => init?.method === "DELETE"
          ? { ok: true }
          : { guidelines: initialGuidelines },
      };
    }
    return {
      ok: true,
      json: async () => ({
      mode: "openai",
      draft: resultDraft,
      insufficiencyNotice: null,
      review: {
        errors: [],
        needsConfirmation: [],
        suggestions: [],
      },
    }),
    };
  });
}

export function renderWriter(connected = true) {
  return render(
    <AiConnectionProvider
      initialConnection={connected
        ? { apiKey: "sk-test-key", model: "gpt-5.6-terra", provider: "openai" }
        : null}
    >
      <AiDocumentWriter />
    </AiConnectionProvider>,
  );
}

export function fillRequiredFields(): void {
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

export function setupWriterTest(): void {
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
}
