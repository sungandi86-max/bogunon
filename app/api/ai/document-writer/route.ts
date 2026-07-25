import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AiDocumentWriterApiRequestSchema } from "@/lib/ai/document-writer";
import {
  readBoundedRequestText,
  RequestBodyTooLargeError,
} from "@/lib/ai/bounded-request-body";
import {
  AiDocumentWriterSensitiveInputError,
  generateAiDocumentDraft,
} from "@/lib/ai/document-writer-service";
import { AiGatewayError, aiGatewayErrorHttpStatus } from "@/lib/ai/errors";
import { AiRateLimitError, AiTimeoutError } from "@/lib/ai/request-control";
import {
  loadRecordGuidelineContext,
  RecordGuidelineAccessError,
} from "@/lib/ai/record-guideline-repository";
import { GUIDELINE_MAX_COMBINED_CHARACTERS } from "@/lib/ai/record-guidelines";

const MAX_REQUEST_BYTES = 384 * 1024;

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
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return errorResponse("입력 내용이 너무 깁니다. 자료를 줄여주세요.", "REQUEST_TOO_LARGE", 413);
    }

    let payload: unknown;
    try {
      const body = await readBoundedRequestText(request, MAX_REQUEST_BYTES);
      payload = JSON.parse(body);
    } catch (parseError) {
      if (parseError instanceof RequestBodyTooLargeError) {
        return errorResponse("입력 내용이 너무 깁니다. 자료를 줄여주세요.", "REQUEST_TOO_LARGE", 413);
      }
      if (parseError instanceof SyntaxError) {
        return errorResponse("입력 내용을 확인해 주세요.", "INVALID_REQUEST", 400);
      }
      throw parseError;
    }

    const parsed = AiDocumentWriterApiRequestSchema.parse(payload);
    const { guideline, userId } = await loadRecordGuidelineContext(
      Number(parsed.document.academicYear),
    );
    if (!guideline) {
      return errorResponse(
        `${parsed.document.academicYear}학년도 기준자료가 등록되지 않았습니다. 설정에서 기준자료를 먼저 등록해주세요.`,
        "GUIDELINE_NOT_FOUND",
        409,
      );
    }
    if (Array.from(guideline.text).length > GUIDELINE_MAX_COMBINED_CHARACTERS) {
      return errorResponse(
        `${parsed.document.academicYear}학년도 기준자료가 너무 깁니다. 등록된 자료를 줄이거나 교체해 주세요.`,
        "GUIDELINE_TOO_LONG",
        422,
      );
    }
    const result = await generateAiDocumentDraft(
      userId,
      parsed.connection,
      parsed.document,
      guideline,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("입력 내용을 확인해 주세요.", "INVALID_REQUEST", 400);
    }
    if (error instanceof RecordGuidelineAccessError) {
      return errorResponse("로그인이 필요합니다.", "UNAUTHORIZED", 401);
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
    if (error instanceof AiGatewayError) {
      return errorResponse(error.message, error.code, aiGatewayErrorHttpStatus(error));
    }
    return errorResponse("초안 작성 중 문제가 발생했습니다. 입력 내용은 그대로 유지됩니다.", "INTERNAL_ERROR", 500);
  }
}
