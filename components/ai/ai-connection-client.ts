import { z } from "zod";

import type { AiConnectionInput } from "@/lib/ai/types";
import { AiProviderIdSchema } from "@/lib/ai/types";

const CONNECTION_CLIENT_TIMEOUT_MS = 22_000;

const AiConnectionResponseSchema = z.object({
  status: z.literal("connected"),
  provider: AiProviderIdSchema,
  model: z.string().min(1),
}).strict();

const AiConnectionErrorResponseSchema = z.object({
  code: z.string(),
  error: z.string().min(1),
}).loose();

export class AiConnectionClientError extends Error {
  readonly name = "AiConnectionClientError";
}

async function responseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AiConnectionClientError(
        "AI 연결 응답을 확인하지 못했습니다. 다시 시도해 주세요.",
      );
    }
    throw error;
  }
}

export async function validateAiConnection(
  connection: AiConnectionInput,
): Promise<void> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    CONNECTION_CLIENT_TIMEOUT_MS,
  );
  try {
    const response = await fetch("/api/ai/connection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(connection),
      signal: controller.signal,
    });
    const body = await responseBody(response);
    if (!response.ok) {
      const parsedError = AiConnectionErrorResponseSchema.safeParse(body);
      throw new AiConnectionClientError(
        parsedError.success
          ? parsedError.data.error
          : "AI 연결을 확인하지 못했습니다. 다시 시도해 주세요.",
      );
    }
    const parsed = AiConnectionResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new AiConnectionClientError(
        "AI 연결 응답을 확인하지 못했습니다. 다시 시도해 주세요.",
      );
    }
  } finally {
    window.clearTimeout(timeout);
  }
}
