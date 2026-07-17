import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function isMissingTable(error: { readonly code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

export async function DELETE(request: Request): Promise<NextResponse> {
  void request;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "로그인이 필요합니다.", code: "UNAUTHORIZED" }, { status: 401 });
  }
  const drafts = await supabase.from("ai_action_drafts").delete().eq("user_id", data.user.id);
  if (isMissingTable(drafts.error)) {
    const preference = await supabase.from("ai_preferences")
      .update({ history_enabled: false }).eq("user_id", data.user.id);
    return NextResponse.json({
      deleted: false,
      warnings: isMissingTable(preference.error)
        ? ["AI 기록 테이블과 설정이 준비되지 않아 삭제할 기록이 없습니다."]
        : ["AI 기록 테이블이 준비되지 않아 삭제할 기록이 없습니다."],
    });
  }
  if (drafts.error) {
    return NextResponse.json(
      { error: "AI 요청 기록을 삭제하지 못했습니다.", code: "HISTORY_DELETE_FAILED" },
      { status: 500 },
    );
  }
  const requests = await supabase.from("ai_requests").delete().eq("user_id", data.user.id);
  if (isMissingTable(requests.error)) {
    return NextResponse.json({
      deleted: false,
      warnings: ["AI 기록 테이블이 준비되지 않아 삭제할 기록이 없습니다."],
    });
  }
  if (requests.error) {
    return NextResponse.json(
      { error: "AI 요청 기록을 삭제하지 못했습니다.", code: "HISTORY_DELETE_FAILED" },
      { status: 500 },
    );
  }
  const preference = await supabase.from("ai_preferences")
    .update({ history_enabled: false }).eq("user_id", data.user.id);
  if (isMissingTable(preference.error)) {
    return NextResponse.json({
      deleted: true,
      warnings: ["AI 기록은 삭제했지만 기록 설정 테이블이 준비되지 않았습니다."],
    });
  }
  if (preference.error) {
    return NextResponse.json(
      { error: "AI 기록 설정을 변경하지 못했습니다.", code: "HISTORY_PREFERENCE_FAILED" },
      { status: 500 },
    );
  }
  return NextResponse.json({ deleted: true });
}
