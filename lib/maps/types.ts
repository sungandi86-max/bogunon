import { z } from "zod";

export const placeSearchResultSchema = z.object({
  providerId: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string(),
});

export type PlaceSearchResult = z.infer<typeof placeSearchResultSchema>;

export interface PlaceSearchProvider {
  readonly id: string;
  search(query: string, signal: AbortSignal): Promise<readonly PlaceSearchResult[]>;
}

export class MapProviderError extends Error {
  readonly code: "not-configured" | "provider-error" | "rate-limited";

  constructor(code: MapProviderError["code"], message: string) {
    super(message);
    this.name = "MapProviderError";
    this.code = code;
  }
}
