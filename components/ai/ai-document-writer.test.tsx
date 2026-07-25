import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  draft,
  fillRequiredFields,
  renderWriter,
  setupWriterTest,
  successfulFetch,
} from "@/components/ai/ai-document-writer-test-helpers";

describe("AiDocumentWriter", () => {
  beforeEach(setupWriterTest);

  it("uses the simplified activity report and optional additional record structure", () => {
    renderWriter();

    expect(screen.getByRole("heading", { level: 1, name: "동아리 생활기록부 초안" })).toBeInTheDocument();
    expect(screen.getByLabelText("활동보고서")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^추가 기록 \(선택\)/ })).toBeInTheDocument();
    expect(screen.queryByLabelText("자기평가")).not.toBeInTheDocument();
    expect(screen.queryByText("교사 메모")).not.toBeInTheDocument();
    expect(screen.getByText("입력한 내용과 생성 결과는 저장되지 않습니다.")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("GPT-5.6 Terra")).toBeInTheDocument();
    expect(screen.getByText("연결됨")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "생기부 초안 생성" })).toBeDisabled();
  });

  it("shows readiness without repeating student source text", () => {
    renderWriter();

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
    renderWriter();
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
    renderWriter();
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
    renderWriter();
    const file = new File(["broken"], "report.pdf", { type: "text/plain" });

    fireEvent.change(screen.getByLabelText("활동보고서 파일"), {
      target: { files: [file] },
    });

    expect(await screen.findByText(/파일 확장자와 형식이 일치하지 않습니다/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("활동보고서"), { target: { value: "직접 입력한 내용" } });
    expect(screen.getByLabelText("활동보고서")).toHaveValue("직접 입력한 내용");
  });

  it("keeps the guideline collapsed by default and persists extracted text", async () => {
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
    vi.stubGlobal("fetch", successfulFetch(draft, [{
      createdAt: "2026-07-25T00:00:00Z",
      extractedText: "외부기관 관련 표현은 근거를 확인한다.",
      fileSize: 256,
      id: "11111111-1111-4111-8111-111111111111",
      mimeType: "text/plain",
      originalFilename: "2026-guide.txt",
      schoolYear: 2026,
      sourceType: "guide",
      updatedAt: "2026-07-25T00:00:00Z",
    }]));
    renderWriter();

    expect(await screen.findByText("2026학년도 · 1건 등록 완료")).toBeInTheDocument();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    expect(await screen.findByRole("tab", { name: "생성된 초안" })).toBeInTheDocument();

    const aiCall = vi.mocked(fetch).mock.calls.find(
      ([input]) => String(input).endsWith("/api/ai/document-writer"),
    );
    const payload = JSON.parse(String(aiCall?.[1]?.body)) as {
      readonly document?: { readonly guideline?: { readonly text?: string } };
    };
    expect(payload.document?.guideline?.text).toContain("외부기관 관련 표현");
  });

  it("validates the anonymous ID and privacy confirmation", () => {
    renderWriter();
    fireEvent.change(screen.getByLabelText("활동보고서"), {
      target: { value: "활동 내용" },
    });
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    expect(screen.getByRole("alert")).toHaveTextContent("학생 식별 ID를 입력해 주세요.");

    fireEvent.change(screen.getByLabelText(/^익명 학생 ID/), { target: { value: "S001" } });
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    expect(screen.getByRole("alert")).toHaveTextContent("개인정보를 입력하지 않았다는 확인이 필요합니다.");
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/ai/document-writer",
      expect.anything(),
    );
  });

  it("keeps an over-limit report visible and blocks generation without truncating it", () => {
    renderWriter();
    const longReport = "가".repeat(15_001);

    fireEvent.change(screen.getByLabelText("활동보고서"), {
      target: { value: longReport },
    });

    expect(screen.getByLabelText("활동보고서")).toHaveValue(longReport);
    expect(screen.getByText(/15,000자 이하로 줄여주세요/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "생기부 초안 생성" })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/ai/document-writer",
      expect.anything(),
    );
  });

  it("generates without an additional record and sends no self-evaluation field", async () => {
    renderWriter();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));

    expect(await screen.findByRole("tab", { name: "생성된 초안" })).toBeInTheDocument();
    expect(screen.getByLabelText("생성된 초안 편집")).toHaveValue(draft);
    const fetchCall = vi.mocked(fetch).mock.calls.find(
      ([input]) => String(input).endsWith("/api/ai/document-writer"),
    );
    const requestOptions = fetchCall?.[1];
    const payload: unknown = JSON.parse(String(requestOptions?.body));
    expect(payload).toMatchObject({
      connection: {
        model: "gpt-5.6-terra",
        provider: "openai",
      },
      document: {
        activityReport: "건강 캠페인 자료를 조사하고 발표함",
        additionalRecord: "",
      },
    });
    expect(payload).not.toHaveProperty("document.selfEvaluation");
    expect(payload).not.toHaveProperty("document.teacherMemo");
    expect(screen.queryByText(/교사 메모가 없어/)).not.toBeInTheDocument();
  });

  it("sends the optional additional record and shows both result tabs", async () => {
    renderWriter();
    fillRequiredFields();
    fireEvent.change(screen.getByRole("textbox", { name: /^추가 기록 \(선택\)/ }), {
      target: { value: "축제 부스 운영을 총괄함" },
    });
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));

    expect(await screen.findByRole("tab", { name: "생성된 초안" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "기재 내용 점검" })).toBeInTheDocument();
    const aiCall = vi.mocked(fetch).mock.calls.find(
      ([input]) => String(input).endsWith("/api/ai/document-writer"),
    );
    const payload = JSON.parse(String(aiCall?.[1]?.body)) as {
      readonly document?: { readonly additionalRecord?: unknown };
    };
    expect(payload.document?.additionalRecord).toBe("축제 부스 운영을 총괄함");
  });

  it("updates character and UTF-8 byte counts while editing the draft", async () => {
    renderWriter();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "생기부 초안 생성" }));
    const editor = await screen.findByLabelText("생성된 초안 편집");

    fireEvent.change(editor, { target: { value: "보건A" } });

    expect(screen.getByText("3자")).toBeInTheDocument();
    expect(screen.getByText("7바이트")).toBeInTheDocument();
    expect(screen.getByText("1500바이트 이내입니다.")).toBeInTheDocument();
  });

});
