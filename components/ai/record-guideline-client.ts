import {
  recordGuidelineSchema,
  type RecordGuideline,
  type RecordGuidelineInput,
} from "@/lib/ai/record-guidelines";
import { z } from "zod";

const errorPayloadSchema = z.object({ error: z.string().optional() }).passthrough();
const listPayloadSchema = z.object({ guidelines: z.array(recordGuidelineSchema) }).strict();
const savePayloadSchema = z.object({ guideline: recordGuidelineSchema }).strict();

async function responseError(response: Response, fallback: string): Promise<Error> {
  const payload = errorPayloadSchema.safeParse(await response.json().catch(() => null));
  return new Error(payload.success && payload.data.error ? payload.data.error : fallback);
}

export async function fetchRecordGuidelines(signal?: AbortSignal): Promise<RecordGuideline[]> {
  const response = await fetch("/api/record-guidelines", {
    cache: "no-store",
    credentials: "same-origin",
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw await responseError(response, "기준자료를 불러오지 못했습니다.");
  const payload = listPayloadSchema.safeParse(await response.json());
  if (!payload.success) throw new Error("기준자료 응답을 확인하지 못했습니다.");
  return payload.data.guidelines;
}

export async function saveRecordGuideline(
  input: RecordGuidelineInput,
): Promise<RecordGuideline> {
  const response = await fetch("/api/record-guidelines", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await responseError(response, "기준자료를 저장하지 못했습니다.");
  const payload = savePayloadSchema.safeParse(await response.json());
  if (!payload.success) throw new Error("저장된 기준자료를 확인하지 못했습니다.");
  return payload.data.guideline;
}

export async function removeRecordGuideline(id: string): Promise<void> {
  const response = await fetch("/api/record-guidelines", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw await responseError(response, "기준자료를 삭제하지 못했습니다.");
}
