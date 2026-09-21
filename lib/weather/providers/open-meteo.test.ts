import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchOpenMeteoWeather, WeatherProviderError } from "@/lib/weather/providers/open-meteo";

describe("Open-Meteo weather provider", () => {
  const fetchMock = vi.fn();

  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(() => vi.unstubAllGlobals());

  it("maps current and daily weather fields", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      current: {
        apparent_temperature: 22.1,
        temperature_2m: 23.4,
        time: "2026-09-21T14:15",
        weather_code: 2,
      },
      daily: {
        temperature_2m_max: [26.5],
        temperature_2m_min: [18.2],
        time: ["2026-09-21"],
      },
    }), { status: 200 }));

    const result = await fetchOpenMeteoWeather(
      { latitude: 37.5, longitude: 127.0 },
      AbortSignal.timeout(1_000),
    );

    expect(result).toEqual({
      apparentTemperatureC: 22.1,
      conditionLabel: "대체로 맑음",
      highC: 26.5,
      lowC: 18.2,
      observedAt: "2026-09-21T14:15",
      temperatureC: 23.4,
      weatherCode: 2,
    });
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.origin + url.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("current")).toBe("temperature_2m,apparent_temperature,weather_code");
    expect(url.searchParams.get("daily")).toBe("temperature_2m_max,temperature_2m_min");
    expect(url.searchParams.get("timezone")).toBe("Asia/Seoul");
    expect(url.searchParams.get("forecast_days")).toBe("1");
  });

  it.each([
    [0, "맑음"], [1, "대체로 맑음"], [3, "흐림"], [45, "안개"],
    [61, "비"], [80, "소나기"], [71, "눈"], [95, "뇌우"], [999, "기타"],
  ])("maps WMO code %i to %s", async (weatherCode, conditionLabel) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      current: { apparent_temperature: 10, temperature_2m: 11, time: "2026-09-21T09:00", weather_code: weatherCode },
      daily: { temperature_2m_max: [12], temperature_2m_min: [5], time: ["2026-09-21"] },
    }), { status: 200 }));

    await expect(fetchOpenMeteoWeather(
      { latitude: 37.5, longitude: 127 },
      AbortSignal.timeout(1_000),
    )).resolves.toMatchObject({ conditionLabel });
  });

  it("normalizes upstream and schema failures", async () => {
    fetchMock.mockResolvedValue(new Response("upstream detail", { status: 503 }));

    await expect(fetchOpenMeteoWeather(
      { latitude: 37.5, longitude: 127 },
      AbortSignal.timeout(1_000),
    )).rejects.toBeInstanceOf(WeatherProviderError);
  });
});
