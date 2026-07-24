import { z } from "zod";

import type { AiProviderId } from "@/lib/ai/types";

export const AI_GATEWAY_ERROR_CODES = [
  "INVALID_API_KEY",
  "PERMISSION_DENIED",
  "QUOTA_OR_BILLING",
  "MODEL_NOT_SUPPORTED",
  "RATE_LIMITED",
  "NETWORK",
  "TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "INVALID_RESPONSE",
  "UNKNOWN",
] as const;

export type AiGatewayErrorCode = (typeof AI_GATEWAY_ERROR_CODES)[number];

const ERROR_MESSAGES: Readonly<Record<AiGatewayErrorCode, string>> = {
  INVALID_API_KEY: "API Key를 확인해 주세요.",
  PERMISSION_DENIED: "이 API Key에는 선택한 모델을 사용할 권한이 없습니다.",
  QUOTA_OR_BILLING: "결제 설정 또는 사용 한도를 확인해 주세요.",
  MODEL_NOT_SUPPORTED: "선택한 모델을 사용할 수 없습니다. 다른 모델을 선택해 주세요.",
  RATE_LIMITED: "요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.",
  NETWORK: "AI 서비스에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.",
  TIMEOUT: "AI 서비스의 응답이 늦어지고 있습니다. 다시 시도해 주세요.",
  PROVIDER_UNAVAILABLE: "AI 서비스가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.",
  INVALID_RESPONSE: "AI 응답을 확인하지 못했습니다. 다시 생성해 주세요.",
  UNKNOWN: "AI 연결 중 문제가 발생했습니다. 다시 시도해 주세요.",
};

const ProviderErrorDetailsSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  name: z.string().optional(),
  status: z.number().int().optional(),
}).loose();

export type ProviderErrorDetails = z.infer<typeof ProviderErrorDetailsSchema>;

export class AiGatewayError extends Error {
  readonly name = "AiGatewayError";

  constructor(
    readonly code: AiGatewayErrorCode,
    readonly provider: AiProviderId,
  ) {
    super(ERROR_MESSAGES[code]);
  }
}

export function providerErrorDetails(error: unknown): ProviderErrorDetails {
  const parsed = ProviderErrorDetailsSchema.safeParse(error);
  return parsed.success ? parsed.data : {};
}

export function commonProviderError(
  error: unknown,
  provider: AiProviderId,
): AiGatewayError | null {
  if (
    typeof error === "object"
    && error !== null
    && "name" in error
    && error.name === "AbortError"
  ) {
    return new AiGatewayError("TIMEOUT", provider);
  }
  if (error instanceof TypeError) {
    return new AiGatewayError("NETWORK", provider);
  }
  return null;
}

export function gatewayError(
  code: AiGatewayErrorCode,
  provider: AiProviderId,
): AiGatewayError {
  return new AiGatewayError(code, provider);
}

export function aiGatewayErrorHttpStatus(error: AiGatewayError): number {
  switch (error.code) {
    case "INVALID_API_KEY":
      return 401;
    case "PERMISSION_DENIED":
      return 403;
    case "QUOTA_OR_BILLING":
      return 402;
    case "MODEL_NOT_SUPPORTED":
      return 400;
    case "RATE_LIMITED":
      return 429;
    case "TIMEOUT":
      return 504;
    case "NETWORK":
    case "PROVIDER_UNAVAILABLE":
    case "INVALID_RESPONSE":
    case "UNKNOWN":
      return 502;
  }
}
