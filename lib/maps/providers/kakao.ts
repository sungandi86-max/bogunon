import { z } from "zod";

import { MapProviderError, type PlaceSearchProvider, type PlaceSearchResult } from "@/lib/maps/types";

const responseSchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    place_name: z.string(),
    address_name: z.string(),
    road_address_name: z.string(),
    category_name: z.string(),
    x: z.string(),
    y: z.string(),
  })),
});

const errorResponseSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  msg: z.string().optional(),
  errorType: z.string().optional(),
  message: z.string().optional(),
});

export class KakaoPlaceSearchProvider implements PlaceSearchProvider {
  readonly id = "kakao";
  readonly #apiKey: string;

  constructor(apiKey: string) {
    this.#apiKey = apiKey.trim();
  }

  async search(query: string, signal: AbortSignal): Promise<readonly PlaceSearchResult[]> {
    const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    url.searchParams.set("query", query);
    url.searchParams.set("size", "10");
    const authorization = `KakaoAK ${this.#apiKey}`;
    const response = await fetch(url, {
      headers: { Authorization: authorization },
      signal,
      cache: "no-store",
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const parsedError = errorResponseSchema.safeParse(payload);
      const providerCode = parsedError.success
        ? String(parsedError.data.code ?? parsedError.data.errorType ?? "") || null
        : null;
      const rawMessage = parsedError.success
        ? parsedError.data.msg ?? parsedError.data.message ?? null
        : null;
      const providerMessage = rawMessage
        ?.replaceAll(this.#apiKey, "[REDACTED]")
        .replace(/appKey\([^)]*\)/gi, "appKey([REDACTED])") ?? null;
      console.error("kakao-local.upstream-failure", {
        provider: "kakao-local",
        upstreamStatus: response.status,
        providerCode,
        providerMessage,
        contentType: response.headers.get("content-type"),
        requestHost: url.host,
        requestPath: url.pathname,
        authorizationPresent: authorization.length > 0,
        authScheme: authorization.slice(0, authorization.indexOf(" ")),
        keyPresent: this.#apiKey.length > 0,
      });
    }
    if (response.status === 429) throw new MapProviderError("rate-limited", "장소 검색 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    if (!response.ok) throw new MapProviderError("provider-error", "장소 검색 서비스에 일시적인 문제가 있습니다.");
    const parsed = responseSchema.parse(payload);
    return parsed.documents.map((item) => ({
      providerId: item.id,
      name: item.place_name,
      address: item.road_address_name || item.address_name,
      latitude: Number(item.y),
      longitude: Number(item.x),
      category: item.category_name,
    }));
  }
}
