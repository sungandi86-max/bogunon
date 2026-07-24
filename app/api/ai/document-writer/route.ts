import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AiDocumentWriterRequestSchema } from "@/lib/ai/document-writer";
import {
  AiDocumentWriterSensitiveInputError,
  generateAiDocumentDraft,
} from "@/lib/ai/document-writer-service";
import {
  AiProviderConfigurationError,
  AiProviderError,
} from "@/lib/ai/providers";
import { AiRateLimitError, AiTimeoutError } from "@/lib/ai/request-control";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_BYTES = 64 * 1024;

function errorResponse(
  error: string,
  code: string,
  status: number,
  warnings?: readonly string[],
): NextResponse {
  return NextResponse.json(
    warnings && warnings.length > 0 ? { error, code, warnings } : { error, code },
    { status },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return errorResponse("로그인이 필요합니다.", "UNAUTHORIZED", 401);
    }

    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return errorResponse("입력 내용이 너무 깁니다. 자료를 줄여주세요.", "REQUEST_TOO_LARGE", 413);
    }

    let payload: unknown;
    try {
      const body = await request.text();
      if (new TextEncoder().encode(body).length > MAX_REQUEST_BYTES) {
        return errorResponse("입력 내용이 너무 깁니다. 자료를 줄여주세요.", "REQUEST_TOO_LARGE", 413);
      }
      payload = JSON.parse(body);
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        return errorResponse("입력 내용을 확인해 주세요.", "INVALID_REQUEST", 400);
      }
      throw parseError;
    }

    const parsed = AiDocumentWriterRequestSchema.parse(payload);
    const result = await generateAiDocumentDraft(data.user.id, parsed);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("입력 내용을 확인해 주세요.", "INVALID_REQUEST", 400);
    }
    if (error instanceof AiDocumentWriterSensitiveInputError) {
      return errorResponse(
        "학생 이름, 학번, 연락처 등 개인정보를 제거해 주세요.",
        error.code,
        422,
        error.warnings,
      );
    }
    if (error instanceof AiRateLimitError) {
      return errorResponse("요청이 많습니다. 잠시 후 다시 시도해 주세요.", error.code, 429);
    }
    if (error instanceof AiTimeoutError) {
      return errorResponse("초안 작성 시간이 길어지고 있습니다. 다시 시도해 주세요.", error.code, 504);
    }
    if (error instanceof AiProviderError) {
      return errorResponse("초안을 만들지 못했습니다. 다시 시도해 주세요.", error.code, 502);
    }
    if (error instanceof AiProviderConfigurationError) {
      return errorResponse("AI 연결 설정이 필요합니다. 관리자에게 문의해 주세요.", error.code, 503);
    }
    return errorResponse("초안 작성 중 문제가 발생했습니다. 입력 내용은 그대로 유지됩니다.", "INTERNAL_ERROR", 500);
  }
}
