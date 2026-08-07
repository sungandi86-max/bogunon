import { NextResponse } from "next/server";
import { z } from "zod";

import { searchPlaces } from "@/lib/maps/gateway";
import { MapProviderError } from "@/lib/maps/types";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.string().trim().min(2).max(120);

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const parsed = querySchema.safeParse(new URL(request.url).searchParams.get("q") ?? "");
  if (!parsed.success) return NextResponse.json({ error: "두 글자 이상의 장소명을 입력해 주세요." }, { status: 400 });
  try {
    return NextResponse.json({ results: await searchPlaces(parsed.data) });
  } catch (caught) {
    if (caught instanceof MapProviderError) {
      return NextResponse.json({ error: caught.message, code: caught.code }, { status: caught.code === "not-configured" ? 503 : 502 });
    }
    if (caught instanceof z.ZodError) return NextResponse.json({ error: "장소 검색 응답을 확인하지 못했습니다." }, { status: 502 });
    if (caught instanceof Error && caught.name === "TimeoutError") return NextResponse.json({ error: "장소 검색 시간이 초과되었습니다." }, { status: 504 });
    return NextResponse.json({ error: "장소를 검색하지 못했습니다." }, { status: 502 });
  }
}
