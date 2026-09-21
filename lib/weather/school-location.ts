import { searchPlaces } from "@/lib/maps/gateway";
import type { PlaceSearchResult } from "@/lib/maps/types";
import type { Coordinates, SchoolLocationSource } from "@/lib/weather/types";

type PlaceSearch = (query: string) => Promise<readonly PlaceSearchResult[]>;

const normalize = (value: string): string => value.replace(/[^0-9a-z가-힣]/gi, "").toLowerCase();

const hasValidCoordinates = (
  school: SchoolLocationSource,
): school is SchoolLocationSource & Coordinates =>
  school.latitude !== null
  && school.longitude !== null
  && Number.isFinite(school.latitude)
  && Number.isFinite(school.longitude)
  && school.latitude >= -90
  && school.latitude <= 90
  && school.longitude >= -180
  && school.longitude <= 180;

export function selectTrustedSchoolPlace(
  places: readonly PlaceSearchResult[],
  school: Pick<SchoolLocationSource, "address" | "name" | "region">,
): PlaceSearchResult | null {
  const schoolName = normalize(school.name);
  const exact = places.find((place) => normalize(place.name) === schoolName);
  if (exact !== undefined) return exact;

  const trusted = places
    .map((place) => {
      const placeName = normalize(place.name);
      const nameRelated = placeName.length > 0
        && (placeName.includes(schoolName) || schoolName.includes(placeName));
      const schoolCategory = place.category.includes("학교");
      const regionMatch = school.region !== null && place.address.includes(school.region);
      const addressMatch = school.address !== null && normalize(place.address) === normalize(school.address);
      return { place, score: (nameRelated ? 3 : 0) + (schoolCategory ? 2 : 0) + (regionMatch ? 1 : 0) + (addressMatch ? 2 : 0) };
    })
    .filter(({ score }) => score >= 5)
    .sort((left, right) => right.score - left.score)[0];
  return trusted?.place ?? null;
}

export async function resolveSchoolLocation(
  school: SchoolLocationSource,
  search: PlaceSearch = searchPlaces,
): Promise<Coordinates | null> {
  if (hasValidCoordinates(school)) {
    return { latitude: school.latitude, longitude: school.longitude };
  }

  const queries = school.address === null
    ? [school.name]
    : [`${school.name} ${school.address}`, school.name];
  try {
    for (const query of queries) {
      const selected = selectTrustedSchoolPlace(await search(query), school);
      if (selected !== null) {
        return { latitude: selected.latitude, longitude: selected.longitude };
      }
    }
    return null;
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}
