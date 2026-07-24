import {
  AiDocumentWriterResultSchema,
  type AiDocumentWriterResult,
} from "@/lib/ai/document-writer";
import type { AiDocumentWriterFormValues } from "@/components/ai/ai-document-writer-types";
import type { SchoolRecordGuideline } from "@/components/ai/ai-document-writer-types";
import type { AiConnectionInput } from "@/lib/ai/types";

const CLIENT_TIMEOUT_MS = 40_000;

async function responseMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown };
    return typeof body.error === "string"
      ? body.error
      : "초안을 만들지 못했습니다. 다시 시도해 주세요.";
  } catch {
    return "초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

export async function requestAiDocumentDraft(
  values: AiDocumentWriterFormValues,
  connection: AiConnectionInput,
  guideline: SchoolRecordGuideline | null,
): Promise<AiDocumentWriterResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch("/api/ai/document-writer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        connection,
        document: {
          ...values,
          studentId: values.studentId.trim(),
          guideline: guideline
            ? {
              academicYear: guideline.academicYear,
              schoolLevel: guideline.schoolLevel,
              sourceType: guideline.sourceType,
              text: guideline.text,
            }
            : null,
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(await responseMessage(response));

    const body = AiDocumentWriterResultSchema.safeParse(await response.json());
    if (!body.success) throw new Error("AI 응답을 읽지 못했습니다. 다시 시도해 주세요.");
    return body.data;
  } finally {
    window.clearTimeout(timeout);
  }
}
