import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ai/document-writer/route";
import { AiGatewayError } from "@/lib/ai/errors";

const { from, generateText, getUser } = vi.hoisted(() => ({
  from: vi.fn(),
  generateText: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from }),
}));

vi.mock("@/lib/ai/gateway", () => ({
  aiGateway: { generateText },
}));

function request(body: unknown): Request {
  return new Request("https://bogunon.example/api/ai/document-writer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  connection: {
    provider: "openai",
    apiKey: "sk-user-secret",
    model: "gpt-5.6-terra",
  },
  document: {
    studentId: "S001",
    activityReport: "건강 캠페인 자료를 조사하고 발표함",
    additionalRecord: "",
    guideline: null,
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
  });

  afterEach(() => vi.restoreAllMocks());

  it("returns a draft after authentication without reading or writing a table", async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      mode: "openai",
      draft: expect.stringContaining("건강 캠페인"),
    });
    expect(getUser).toHaveBeenCalledOnce();
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });

    const response = await POST(request(validBody));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "로그인이 필요합니다.",
      code: "UNAUTHORIZED",
    });
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
