import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KakaoPlaceSearchProvider } from "@/lib/maps/providers/kakao";

describe("KakaoPlaceSearchProvider", () => {
  const fetchMock = vi.fn();
  const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    fetchMock.mockReset();
    errorLog.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reports sanitized Kakao upstream diagnostics without exposing the REST API key", async () => {
    const apiKey = "test-rest-api-key";
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      errorType: "AccessDeniedError",
      message: `wrong appKey(${apiKey}) format`,
    }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }));

    const provider = new KakaoPlaceSearchProvider(` \r\n${apiKey}\t`);

    await expect(provider.search("제주공항", AbortSignal.timeout(1_000))).rejects.toMatchObject({
      code: "provider-error",
    });
    const [request, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect({ host: request.host, path: request.pathname, query: request.searchParams.get("query") }).toEqual({
      host: "dapi.kakao.com",
      path: "/v2/local/search/keyword.json",
      query: "제주공항",
    });
    expect(new Headers(init.headers).get("Authorization")).toBe(`KakaoAK ${apiKey}`);
    expect(errorLog).toHaveBeenCalledWith("kakao-local.upstream-failure", {
      provider: "kakao-local",
      upstreamStatus: 401,
      providerCode: "AccessDeniedError",
      providerMessage: "wrong appKey([REDACTED]) format",
      contentType: "application/json; charset=utf-8",
      requestHost: "dapi.kakao.com",
      requestPath: "/v2/local/search/keyword.json",
      authorizationPresent: true,
      authScheme: "KakaoAK",
      keyPresent: true,
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(apiKey);
  });
});
