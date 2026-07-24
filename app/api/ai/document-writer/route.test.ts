import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ai/document-writer/route";

const getUser = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from }),
}));

function request(body: unknown): Request {
  return new Request("https://bogunon.example/api/ai/document-writer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  studentId: "S001",
  activityReport: "건강 캠페인 자료를 조사하고 발표함",
  additionalRecord: "",
  tone: "objective",
  length: "within-1500-bytes",
  privacyConfirmed: true,
};

describe("POST /api/ai/document-writer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env["AI_PROVIDER"] = "mock";
    delete process.env["OPENAI_API_KEY"];
    getUser.mockResolvedValue({
      data: { user: { id: crypto.randomUUID() } },
      error: null,
    });
  });

  afterEach(() => {
    delete process.env["AI_PROVIDER"];
    delete process.env["OPENAI_API_KEY"];
  });

  it("returns a draft after authentication without reading or writing a table", async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      mode: "mock",
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
      activityReport: "",
      privacyConfirmed: false,
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
        "content-length": "100000",
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
      activityReport: "학번 1234 상담 내용 정리",
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

  it("returns a safe configuration error when OpenAI is selected without a key", async () => {
    process.env["AI_PROVIDER"] = "openai";

    const response = await POST(request(validBody));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "AI 연결 설정이 필요합니다. 관리자에게 문의해 주세요.",
      code: "AI_CONFIGURATION_ERROR",
    });
  });
});
