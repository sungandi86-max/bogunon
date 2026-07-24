import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AiGatewayError, aiGatewayErrorHttpStatus } from "@/lib/ai/errors";
import { aiGateway } from "@/lib/ai/gateway";
import { InMemoryRateLimiter } from "@/lib/ai/request-control";
import { AiConnectionInputSchema } from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_BYTES = 4 * 1024;
const CONNECTION_TIMEOUT_MS = 20_000;
const limiter = new InMemoryRateLimiter({ maxRequests: 12, windowMs: 60_000 });

function errorResponse(error: string, code: string, status: number): NextResponse {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return errorResponse("로그인이 필요합니다.", "UNAUTHORIZED", 401);
    }
    if (!limiter.consume(data.user.id)) {
      return errorResponse(
        "연결 확인 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
        "RATE_LIMITED",
        429,
      );
    }

    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return errorResponse("연결 정보를 확인해 주세요.", "REQUEST_TOO_LARGE", 413);
    }

    const body = await request.text();
    if (new TextEncoder().encode(body).length > MAX_REQUEST_BYTES) {
      return errorResponse("연결 정보를 확인해 주세요.", "REQUEST_TOO_LARGE", 413);
    }
    const connection = AiConnectionInputSchema.parse(JSON.parse(body));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
    try {
      await aiGateway.validateConnection(connection, controller.signal);
    } finally {
      clearTimeout(timeout);
    }

    return NextResponse.json({
      status: "connected",
      provider: connection.provider,
      model: connection.model,
    });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return errorResponse("연결 정보를 확인해 주세요.", "INVALID_REQUEST", 400);
    }
    if (error instanceof AiGatewayError) {
      return errorResponse(error.message, error.code, aiGatewayErrorHttpStatus(error));
    }
    return errorResponse(
      "AI 연결을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      "UNKNOWN",
      502,
    );
  }
}
