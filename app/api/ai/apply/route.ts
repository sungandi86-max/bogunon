import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { applyAiAction } from "@/lib/ai/apply";
import { AiActionSchema } from "@/lib/ai/schemas/actions";
import { createClient } from "@/lib/supabase/server";
import { markAiDraftApplied } from "@/lib/ai/history";
import { inspectStructuredPrivacy } from "@/lib/ai/privacy";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "로그인이 필요합니다.", code: "UNAUTHORIZED" }, { status: 401 });
  try {
    const action = AiActionSchema.parse(await request.json());
    const privacy = inspectStructuredPrivacy(action);
    if (!privacy.allowed) {
      return NextResponse.json({
        error: "학생 개인정보와 건강 민감정보를 제거해 주세요.",
        code: "SENSITIVE_INPUT",
        warnings: privacy.warnings,
      }, { status: 422 });
    }
    const result = await applyAiAction(action);
    const draftId = new URL(request.url).searchParams.get("draftId");
    let warning: string | undefined;
    if (result.applied && draftId) {
      try {
        await markAiDraftApplied(draftId);
      } catch {
        warning = "업무는 적용했지만 AI 기록 상태를 갱신하지 못했습니다.";
      }
    }
    for (const path of ["/briefing", "/tasks", "/calendar", "/annual", "/workflows"]) revalidatePath(path);
    return NextResponse.json({ ...result, ...(warning ? { warning } : {}) });
  } catch {
    return NextResponse.json({ error: "AI 초안을 적용하지 못했습니다. 내용을 확인해 주세요.", code: "INVALID_DRAFT" }, { status: 400 });
  }
}
