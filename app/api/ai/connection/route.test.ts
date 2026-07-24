import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiGatewayError } from "@/lib/ai/errors";
import { POST } from "@/app/api/ai/connection/route";

const { from, getUser, validateConnection } = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  validateConnection: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from }),
}));

vi.mock("@/lib/ai/gateway", () => ({
  aiGateway: { validateConnection },
}));

function request(body: unknown): Request {
  return new Request("https://bogunon.example/api/ai/connection", {
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
          controller.enqueue(new Uint8Array(3 * 1024));
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
  return new Request("https://bogunon.example/api/ai/connection", init);
}

const connection = {
  provider: "openai",
  apiKey: "sk-user-secret",
  model: "gpt-5.6-terra",
} as const;

describe("POST /api/ai/connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({
      data: { user: { id: crypto.randomUUID() } },
      error: null,
    });
    validateConnection.mockResolvedValue(undefined);
  });

  it("validates a user key without reading or writing application tables", async () => {
    const response = await POST(request(connection));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "connected",
      provider: "openai",
      model: "gpt-5.6-terra",
    });
    expect(validateConnection).toHaveBeenCalledWith(
      connection,
      expect.any(AbortSignal),
    );
    expect(from).not.toHaveBeenCalled();
  });

  it("blocks an unauthenticated connection attempt", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });

    const response = await POST(request(connection));

    expect(response.status).toBe(401);
    expect(validateConnection).not.toHaveBeenCalled();
  });

  it("returns a safe normalized error without echoing the key", async () => {
    validateConnection.mockRejectedValue(
      new AiGatewayError("INVALID_API_KEY", "openai"),
    );

    const response = await POST(request(connection));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "INVALID_API_KEY",
      error: "API Key를 확인해 주세요.",
    });
    expect(JSON.stringify(body)).not.toContain(connection.apiKey);
  });

  it("rejects an oversized request before provider validation", async () => {
    const oversized = new Request("https://bogunon.example/api/ai/connection", {
      method: "POST",
      headers: {
        "content-length": "5000",
        "content-type": "application/json",
      },
      body: "{}",
    });

    const response = await POST(oversized);

    expect(response.status).toBe(413);
    expect(validateConnection).not.toHaveBeenCalled();
  });

  it("stops reading a streaming request as soon as it exceeds the limit", async () => {
    const response = await POST(oversizedStreamingRequest());

    expect(response.status).toBe(413);
    expect(validateConnection).not.toHaveBeenCalled();
  });
});
