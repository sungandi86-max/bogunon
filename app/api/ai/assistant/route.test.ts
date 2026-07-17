import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ai/assistant/route";

const getUser = vi.fn();
const from = vi.fn();
const rpc = vi.fn();
let missingHistoryTables = false;

function tableQuery(table: string) {
  const result = table.startsWith("ai_") && missingHistoryTables
    ? { data: null, error: { code: "PGRST205" } }
    : { data: [], error: null };
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.upsert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.single.mockResolvedValue(!missingHistoryTables && table === "ai_requests"
    ? { data: { id: "request-1" }, error: null }
    : !missingHistoryTables && table === "ai_action_drafts"
      ? { data: { id: "draft-1" }, error: null }
      : result);
  return query;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from, rpc }),
}));

describe("POST /api/ai/assistant", () => {
  beforeEach(() => {
    delete process.env["OPENAI_API_KEY"];
    getUser.mockReset();
    from.mockReset();
    rpc.mockReset();
    missingHistoryTables = false;
    from.mockImplementation((table: string) => tableQuery(table));
    rpc.mockImplementation(async () => missingHistoryTables
      ? { data: null, error: { code: "PGRST202" } }
      : { data: "draft-1", error: null });
    getUser.mockResolvedValue({ data: { user: { id: crypto.randomUUID() } }, error: null });
  });

  afterEach(() => {
    delete process.env["OPENAI_API_KEY"];
  });

  it("returns an authenticated preview without requiring a database repository", async () => {
    // Given an authenticated request and no OpenAI key
    const request = new Request("https://bogunon.example/api/ai/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "오늘 업무 요약", context: { surface: "dashboard" } }),
    });

    // When the API handles the request
    const response = await POST(request);

    // Then it returns a rules-only preview and performs auth only
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      mode: "mock",
      action: { action: "summarize_today" },
    });
    expect(getUser).toHaveBeenCalledOnce();
    const historyWrites = from.mock.results
      .map((entry) => entry.value)
      .filter((query) => query.insert.mock.calls.length > 0);
    expect(historyWrites).toHaveLength(0);
  });

  it("rejects unauthenticated requests", async () => {
    // Given a request without a valid Supabase user
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    const request = new Request("https://bogunon.example/api/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ input: "오늘 업무 요약" }),
    });

    // When the API handles the request
    const response = await POST(request);

    // Then it returns the stable auth error contract
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "로그인이 필요합니다.", code: "UNAUTHORIZED" });
  });

  it("rejects unknown request fields", async () => {
    // Given a payload outside the strict request schema
    const request = new Request("https://bogunon.example/api/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ input: "오늘 업무 요약", userId: "another-user" }),
    });

    // When the API handles the request
    const response = await POST(request);

    // Then it returns a stable validation error
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "요청 형식을 확인해 주세요.", code: "INVALID_REQUEST" });
  });

  it("blocks sensitive input before provider processing", async () => {
    // Given a request containing prohibited student information
    const request = new Request("https://bogunon.example/api/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ input: "학번 1234 상담 내용 정리" }),
    });

    // When the API handles the request
    const response = await POST(request);

    // Then it returns safe category warnings without the original value
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body).toEqual({
      error: "학생 개인정보와 건강 민감정보를 제거해 주세요.",
      code: "SENSITIVE_INPUT",
      warnings: ["상담 내용", "학번"],
    });
    expect(JSON.stringify(body)).not.toContain("1234");
  });

  it("persists sanitized history only when saveHistory is true", async () => {
    // Given an authenticated request opting into history persistence
    const request = new Request("https://bogunon.example/api/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ input: "오늘 업무 요약", saveHistory: true }),
    });

    // When the API handles the request
    const response = await POST(request);

    // Then history rows are written while the domain action remains a preview
    const body = await response.json();
    expect({ status: response.status, body }).toMatchObject({
      status: 200,
      body: { mode: "mock", draftId: "draft-1" },
    });
    expect(rpc).toHaveBeenCalledWith("save_ai_history_bundle", expect.objectContaining({
      p_request_type: "summarize_today",
      p_prompt: "오늘 업무 요약",
    }));
  });

  it("keeps the preview when history tables are unavailable", async () => {
    // Given history persistence is requested before its tables are migrated
    missingHistoryTables = true;
    const request = new Request("https://bogunon.example/api/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ input: "오늘 업무 요약", saveHistory: true }),
    });

    // When the API handles the request
    const response = await POST(request);

    // Then the preview succeeds with a clear persistence warning
    const body = await response.json();
    expect({ status: response.status, body }).toMatchObject({
      status: 200,
      body: {
        mode: "mock",
        warnings: ["AI 기록 테이블이 준비되지 않아 요청 기록을 저장하지 못했습니다."],
      },
    });
  });
});
