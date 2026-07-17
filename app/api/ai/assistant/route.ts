import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AiSensitiveInputError, generateAiPreview } from "@/lib/ai/assistant";
import { AiProviderConfigurationError, AiProviderError } from "@/lib/ai/providers";
import { AiAssistantRequestSchema } from "@/lib/ai/schemas/request";
import { AiRateLimitError, AiTimeoutError } from "@/lib/ai/request-control";
import { createClient } from "@/lib/supabase/server";

function errorResponse(error: string, code: string, status: number, warnings?: readonly string[]) {
  return NextResponse.json(
    warnings && warnings.length > 0 ? { error, code, warnings } : { error, code },
    { status },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return errorResponse("로그인이 필요합니다.", "UNAUTHORIZED", 401);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        return errorResponse("요청 형식을 확인해 주세요.", "INVALID_REQUEST", 400);
      }
      throw parseError;
    }
    const parsed = AiAssistantRequestSchema.parse(payload);
    const preview = await generateAiPreview(data.user.id, parsed);
    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("요청 형식을 확인해 주세요.", "INVALID_REQUEST", 400);
    }
    if (error instanceof AiSensitiveInputError) {
      return errorResponse(
        "학생 개인정보와 건강 민감정보를 제거해 주세요.",
        error.code,
        422,
        error.warnings,
      );
    }
    if (error instanceof AiRateLimitError) {
      return errorResponse("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", error.code, 429);
    }
    if (error instanceof AiTimeoutError) {
      return errorResponse("AI 응답 시간이 초과되었습니다. 다시 시도해 주세요.", error.code, 504);
    }
    if (error instanceof AiProviderError) {
      return errorResponse("AI 초안을 만들지 못했습니다. 다시 시도해 주세요.", error.code, 502);
    }
    if (error instanceof AiProviderConfigurationError) {
      return errorResponse("AI 제공자 설정을 확인해 주세요.", error.code, 503);
    }
    return errorResponse("AI 요청 중 오류가 발생했습니다.", "INTERNAL_ERROR", 500);
  }
}
