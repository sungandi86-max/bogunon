import type {
  RecordGuideline,
  RecordGuidelineInput,
} from "@/lib/ai/record-guidelines";

interface ErrorPayload {
  readonly error?: unknown;
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => null) as ErrorPayload | null;
  return new Error(typeof payload?.error === "string" ? payload.error : fallback);
}

export async function fetchRecordGuidelines(signal?: AbortSignal): Promise<RecordGuideline[]> {
  const response = await fetch("/api/record-guidelines", {
    cache: "no-store",
    credentials: "same-origin",
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw await responseError(response, "기준자료를 불러오지 못했습니다.");
  const payload = await response.json() as { readonly guidelines?: unknown };
  if (!Array.isArray(payload.guidelines)) throw new Error("기준자료 응답을 확인하지 못했습니다.");
  return payload.guidelines as RecordGuideline[];
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
  const payload = await response.json() as { readonly guideline?: RecordGuideline };
  if (!payload.guideline) throw new Error("저장된 기준자료를 확인하지 못했습니다.");
  return payload.guideline;
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
