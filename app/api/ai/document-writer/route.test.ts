import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ai/document-writer/route";
import { AiGatewayError } from "@/lib/ai/errors";
import { RecordGuidelineAccessError } from "@/lib/ai/record-guideline-repository";

const { from, generateText, getUser, loadGuidelineContext } = vi.hoisted(() => ({
  from: vi.fn(),
  generateText: vi.fn(),
  getUser: vi.fn(),
  loadGuidelineContext: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from }),
}));

vi.mock("@/lib/ai/gateway", () => ({
  aiGateway: { generateText },
}));

vi.mock("@/lib/ai/record-guideline-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/record-guideline-repository")>();
  return {
    ...actual,
    loadRecordGuidelineContext: loadGuidelineContext,
  };
});

function request(body: unknown): Request {
  return new Request("https://bogunon.example/api/ai/document-writer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function oversizedStreamingRequest(): Request {
  let pullCount = 0;
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        pullCount += 1;
        if (pullCount <= 2) {
          controller.enqueue(new Uint8Array(200 * 1024));
          return;
        }
        controller.error(new Error("The route read past its request limit"));
      }
    },
    { highWaterMark: 0 },
  );
  const init: RequestInit & { readonly duplex: "half" } = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half",
  };
  return new Request("https://bogunon.example/api/ai/document-writer", init);
}

const validBody = {
  connection: {
    provider: "openai",
    apiKey: "sk-user-secret",
    model: "gpt-5.6-terra",
  },
  document: {
    academicYear: "2026",
    studentId: "S001",
    activityReport: "건강 캠페인 자료를 조사하고 발표함",
    additionalRecord: "",
    tone: "objective",
    length: "within-1500-bytes",
    privacyConfirmed: true,
  },
};

describe("POST /api/ai/document-writer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateText.mockResolvedValue({
      draft: "건강 캠페인 자료를 조사하고 발표함.",
      insufficiencyNotice: null,
      review: {
        errors: [],
        needsConfirmation: [],
        suggestions: [],
      },
    });
    getUser.mockResolvedValue({
      data: { user: { id: crypto.randomUUID() } },
      error: null,
    });
    loadGuidelineContext.mockResolvedValue({
      userId: "11111111-1111-4111-8111-111111111111",
      guideline: {
        academicYear: "2026",
        fileName: "2026-guide.txt",
        schoolLevel: "고등학교",
        sourceType: "guide",
        text: "공식 기재요령",
      },
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("loads the selected year's guideline before generating without persisting student data", async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      mode: "openai",
      draft: expect.stringContaining("건강 캠페인"),
    });
    expect(loadGuidelineContext).toHaveBeenCalledWith(2026);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    loadGuidelineContext.mockRejectedValue(new RecordGuidelineAccessError());

    const response = await POST(request(validBody));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "로그인이 필요합니다.",
      code: "UNAUTHORIZED",
    });
  });

  it("blocks generation when the selected year has no saved guideline", async () => {
    loadGuidelineContext.mockResolvedValue({
      userId: "11111111-1111-4111-8111-111111111111",
      guideline: null,
    });

    const response = await POST(request(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "2026학년도 기준자료가 등록되지 않았습니다. 설정에서 기준자료를 먼저 등록해주세요.",
      code: "GUIDELINE_NOT_FOUND",
    });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("rejects an oversized stored guideline without truncating it", async () => {
    loadGuidelineContext.mockResolvedValue({
      userId: "11111111-1111-4111-8111-111111111111",
      guideline: {
        academicYear: "2026",
        fileName: "2026-guide.txt",
        schoolLevel: "고등학교",
        sourceType: "guide",
        text: "가".repeat(100_001),
      },
    });

    const response = await POST(request(validBody));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "2026학년도 기준자료가 너무 깁니다. 등록된 자료를 줄이거나 교체해 주세요.",
      code: "GUIDELINE_TOO_LONG",
    });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("rejects missing materials and privacy confirmation", async () => {
    const response = await POST(request({
      ...validBody,
      document: {
        ...validBody.document,
        activityReport: "",
        privacyConfirmed: false,
      },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "입력 내용을 확인해 주세요.",
      code: "INVALID_REQUEST",
    });
  });

  it("rejects an oversized request before parsing the body", async () => {
    const oversizedRequest = new Request("https://bogunon.example/api/ai/document-writer", {
      method: "POST",
      headers: {
        "content-length": "500000",
        "content-type": "application/json",
      },
      body: "{}",
    });

    const response = await POST(oversizedRequest);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "입력 내용이 너무 깁니다. 자료를 줄여주세요.",
      code: "REQUEST_TOO_LARGE",
    });
  });

  it("stops reading a streaming request as soon as it exceeds the limit", async () => {
    const response = await POST(oversizedStreamingRequest());

    expect(response.status).toBe(413);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("blocks sensitive input without echoing the original value", async () => {
    const response = await POST(request({
      ...validBody,
      document: {
        ...validBody.document,
        activityReport: "학번 1234 상담 내용 정리",
      },
    }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({
      error: "학생 이름, 학번, 연락처 등 개인정보를 제거해 주세요.",
      code: "SENSITIVE_INPUT",
      warnings: ["상담 내용", "학번"],
    });
    expect(JSON.stringify(body)).not.toContain("1234");
  });

  it("returns a safe provider error without echoing the user key", async () => {
    generateText.mockRejectedValue(
      new AiGatewayError("INVALID_API_KEY", "openai"),
    );

    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "API Key를 확인해 주세요.",
      code: "INVALID_API_KEY",
    });
    expect(JSON.stringify(body)).not.toContain(validBody.connection.apiKey);
  });
});
