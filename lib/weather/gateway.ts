import { fetchOpenMeteoWeather } from "@/lib/weather/providers/open-meteo";
import type { Coordinates, WeatherSnapshot } from "@/lib/weather/types";

export function fetchCurrentWeather(coordinates: Coordinates): Promise<WeatherSnapshot> {
  return fetchOpenMeteoWeather(coordinates, AbortSignal.timeout(8_000));
}
