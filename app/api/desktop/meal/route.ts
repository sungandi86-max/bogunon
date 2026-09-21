import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchTodayMeal } from "@/lib/neis/meals";
import {
  createDesktopBearerContext,
  DesktopBearerUnauthorizedError,
} from "@/lib/supabase/bearer-server";

const schoolSelectColumns =
  "neis_office_code,neis_school_code,neis_school_name,neis_office_name,meal_enabled";

const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
});

const json = (body: object, status = 200): NextResponse => NextResponse.json(body, {
  status,
  headers: { "cache-control": "private, no-store" },
});

export async function GET(request: Request): Promise<NextResponse> {
  const parsedDate = calendarDateSchema.safeParse(new URL(request.url).searchParams.get("date"));
  if (!parsedDate.success) {
    return json({ status: "error", code: "INVALID_DATE", message: "올바른 날짜를 입력해 주세요." }, 400);
  }

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
      return json({
        status: "error",
        code: "SCHOOL_SETTINGS_ERROR",
        message: "학교 정보를 불러오지 못했습니다.",
      }, 500);
    }
    if (
      !data?.neis_office_code
      || !data.neis_school_code
      || !data.neis_school_name
      || !data.neis_office_name
    ) {
      return json({ status: "school-missing", date: parsedDate.data });
    }
    if (!data.meal_enabled) {
      return json({
        status: "disabled",
        date: parsedDate.data,
        schoolName: data.neis_school_name,
      });
    }

    const meal = await fetchTodayMeal({
      officeCode: data.neis_office_code,
      schoolCode: data.neis_school_code,
      name: data.neis_school_name,
      officeName: data.neis_office_name,
    }, parsedDate.data);

    if (meal.status === "ready") {
      return json({
        status: "ready",
        date: meal.date,
        schoolName: data.neis_school_name,
        menu: meal.menu,
        calories: meal.calories,
      });
    }
    if (meal.status === "empty") {
      return json({ status: "empty", date: meal.date, schoolName: data.neis_school_name });
    }
    return json({
      status: "error",
      code: "MEAL_UPSTREAM_ERROR",
      message: "급식 정보를 불러오지 못했습니다.",
    }, 502);
  } catch (error) {
    if (error instanceof DesktopBearerUnauthorizedError) {
      return json({ status: "error", code: "UNAUTHORIZED", message: error.message }, 401);
    }
    return json({
      status: "error",
      code: "MEAL_REQUEST_ERROR",
      message: "급식 요청을 처리하지 못했습니다.",
    }, 500);
  }
}
