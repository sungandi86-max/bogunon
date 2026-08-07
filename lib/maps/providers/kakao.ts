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

export class KakaoPlaceSearchProvider implements PlaceSearchProvider {
  readonly id = "kakao";
  readonly #apiKey: string;

  constructor(apiKey: string) {
    this.#apiKey = apiKey;
  }

  async search(query: string, signal: AbortSignal): Promise<readonly PlaceSearchResult[]> {
    const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    url.searchParams.set("query", query);
    url.searchParams.set("size", "10");
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${this.#apiKey}` },
      signal,
      cache: "no-store",
    });
    if (response.status === 429) throw new MapProviderError("rate-limited", "장소 검색 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    if (!response.ok) throw new MapProviderError("provider-error", "장소 검색 서비스에 일시적인 문제가 있습니다.");
    const parsed = responseSchema.parse(await response.json());
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
