import { KakaoPlaceSearchProvider } from "@/lib/maps/providers/kakao";
import { MapProviderError, type PlaceSearchResult } from "@/lib/maps/types";

function provider() {
  const kakaoKey = process.env["KAKAO_REST_API_KEY"]?.trim();
  if (kakaoKey) return new KakaoPlaceSearchProvider(kakaoKey);
  throw new MapProviderError("not-configured", "장소 검색이 아직 설정되지 않았습니다. 좌표를 직접 입력할 수 있습니다.");
}

export async function searchPlaces(query: string): Promise<readonly PlaceSearchResult[]> {
  return provider().search(query, AbortSignal.timeout(6_000));
}
