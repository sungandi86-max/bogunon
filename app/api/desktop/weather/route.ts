import { NextResponse } from "next/server";

import {
  createDesktopBearerContext,
  DesktopBearerUnauthorizedError,
} from "@/lib/supabase/bearer-server";
import { fetchCurrentWeather } from "@/lib/weather/gateway";
import { WeatherProviderError } from "@/lib/weather/providers/open-meteo";
import { resolveSchoolLocation } from "@/lib/weather/school-location";

const schoolSelectColumns =
  "neis_school_code,neis_school_name,neis_region,neis_address,school_latitude,school_longitude,weather_enabled";

const json = (body: object, status = 200): NextResponse => NextResponse.json(body, {
  status,
  headers: { "cache-control": "private, no-store" },
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { supabase, userId } = await createDesktopBearerContext(
      request.headers.get("authorization"),
    );
    const { data, error } = await supabase
      .from("user_settings")
      .select(schoolSelectColumns)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return json({ status: "error", code: "SCHOOL_SETTINGS_ERROR", message: "학교 정보를 불러오지 못했습니다." }, 500);
    }
    if (!data?.neis_school_code || !data.neis_school_name) {
      return json({ status: "school-missing" });
    }
    if (!data.weather_enabled) {
      return json({ status: "disabled", schoolName: data.neis_school_name });
    }

    const location = await resolveSchoolLocation({
      address: data.neis_address,
      latitude: data.school_latitude,
      longitude: data.school_longitude,
      name: data.neis_school_name,
      region: data.neis_region,
    });
    if (location === null) {
      return json({ status: "location-unavailable", schoolName: data.neis_school_name });
    }

    const weather = await fetchCurrentWeather(location);
    return json({ status: "ready", schoolName: data.neis_school_name, ...weather });
  } catch (error) {
    if (error instanceof DesktopBearerUnauthorizedError) {
      return json({ status: "error", code: "UNAUTHORIZED", message: error.message }, 401);
    }
    if (error instanceof WeatherProviderError) {
      return json({ status: "error", code: "WEATHER_UPSTREAM_ERROR", message: error.message }, 502);
    }
    return json({ status: "error", code: "WEATHER_REQUEST_ERROR", message: "날씨 요청을 처리하지 못했습니다." }, 500);
  }
}
