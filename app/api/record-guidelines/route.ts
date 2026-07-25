import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteRecordGuideline,
  listRecordGuidelines,
  RecordGuidelineAccessError,
  upsertRecordGuideline,
} from "@/lib/ai/record-guideline-repository";
import {
  GuidelineContainsPersonalDataError,
  GUIDELINE_MAX_REQUEST_BYTES,
  recordGuidelineInputSchema,
} from "@/lib/ai/record-guidelines";
import {
  readBoundedRequestText,
  RequestBodyTooLargeError,
} from "@/lib/ai/bounded-request-body";

const deleteSchema = z.object({ id: z.string().uuid() }).strict();

async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyTooLargeError();
  }
  return JSON.parse(await readBoundedRequestText(request, maxBytes));
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof RecordGuidelineAccessError) {
    return NextResponse.json({ error: error.message, code: "UNAUTHORIZED" }, { status: 401 });
  }
  if (error instanceof RequestBodyTooLargeError) {
    return NextResponse.json(
      { error: "기준자료가 너무 큽니다. 더 작은 파일을 선택해 주세요.", code: "REQUEST_TOO_LARGE" },
      { status: 413 },
    );
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "기준자료 정보를 확인해 주세요.", code: "INVALID_REQUEST" },
      { status: 400 },
    );
  }
  if (error instanceof GuidelineContainsPersonalDataError) {
    return NextResponse.json(
      { error: error.message, code: "PERSONAL_DATA_DETECTED" },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { error: "기준자료 요청을 처리하지 못했습니다.", code: "GUIDELINE_ERROR" },
    { status: 500 },
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ guidelines: await listRecordGuidelines() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const input = recordGuidelineInputSchema.parse(
      await readJson(request, GUIDELINE_MAX_REQUEST_BYTES),
    );
    return NextResponse.json({ guideline: await upsertRecordGuideline(input) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { id } = deleteSchema.parse(await readJson(request, 2048));
    await deleteRecordGuideline(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
