import { z } from "zod";

import type { Coordinates, WeatherSnapshot } from "@/lib/weather/types";

const openMeteoResponseSchema = z.object({
  current: z.object({
    apparent_temperature: z.number(),
    temperature_2m: z.number(),
    time: z.string().min(1),
    weather_code: z.number().int(),
  }),
  daily: z.object({
    temperature_2m_max: z.array(z.number()).min(1),
    temperature_2m_min: z.array(z.number()).min(1),
    time: z.array(z.string()).min(1),
  }),
});

export class WeatherProviderError extends Error {
  readonly name = "WeatherProviderError";

  constructor() {
    super("날씨 정보를 불러오지 못했습니다.");
  }
}

export function weatherConditionLabel(code: number): string {
  if (code === 0) return "맑음";
  if (code === 1 || code === 2) return "대체로 맑음";
  if (code === 3) return "흐림";
  if (code === 45 || code === 48) return "안개";
  if (code >= 51 && code <= 67) return "비";
  if (code >= 80 && code <= 82) return "소나기";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "눈";
  if (code >= 95 && code <= 99) return "뇌우";
  return "기타";
}

export async function fetchOpenMeteoWeather(
  coordinates: Coordinates,
  signal: AbortSignal,
): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coordinates.latitude));
  url.searchParams.set("longitude", String(coordinates.longitude));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "Asia/Seoul");
  url.searchParams.set("forecast_days", "1");

  try {
    const response = await fetch(url, { cache: "no-store", signal });
    if (!response.ok) throw new WeatherProviderError();
    const parsed = openMeteoResponseSchema.parse(await response.json());
    const highC = parsed.daily.temperature_2m_max[0];
    const lowC = parsed.daily.temperature_2m_min[0];
    if (highC === undefined || lowC === undefined) throw new WeatherProviderError();
    return {
      apparentTemperatureC: parsed.current.apparent_temperature,
      conditionLabel: weatherConditionLabel(parsed.current.weather_code),
      highC,
      lowC,
      observedAt: parsed.current.time,
      temperatureC: parsed.current.temperature_2m,
      weatherCode: parsed.current.weather_code,
    };
  } catch (error) {
    if (error instanceof WeatherProviderError) throw error;
    if (error instanceof Error) throw new WeatherProviderError();
    throw error;
  }
}
