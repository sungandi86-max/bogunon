"use client";

import { ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";

import { AiDocumentWriterForm } from "@/components/ai/ai-document-writer-form";
import { AiDocumentWriterResultPanel } from "@/components/ai/ai-document-writer-result";
import {
  INITIAL_AI_DOCUMENT_VALUES,
  type AiDocumentWriterFormValues,
} from "@/components/ai/ai-document-writer-types";
import {
  AiDocumentWriterResultSchema,
  countCharacters,
  countUtf8Bytes,
} from "@/lib/ai/document-writer";
import type { AiDocumentWriterResult } from "@/lib/ai/document-writer";

const CLIENT_TIMEOUT_MS = 15_000;

function hasSource(values: AiDocumentWriterFormValues): boolean {
  return [values.activityReport, values.selfEvaluation, values.teacherMemo]
    .some((value) => value.trim().length > 0);
}

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

export function AiDocumentWriterDesktop() {
  const [values, setValues] = useState(INITIAL_AI_DOCUMENT_VALUES);
  const [result, setResult] = useState<AiDocumentWriterResult | null>(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  function update<K extends keyof AiDocumentWriterFormValues>(
    key: K,
    value: AiDocumentWriterFormValues[K],
  ): void {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validationMessage(): string | null {
    if (!values.studentId.trim()) return "학생 식별 ID를 입력해 주세요.";
    if (!/^[A-Za-z0-9_-]+$/.test(values.studentId.trim())) {
      return "학생 식별 ID는 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.";
    }
    if (!hasSource(values)) {
      return "활동보고서, 자기평가, 교사 메모 중 하나 이상 입력해 주세요.";
    }
    if (!values.privacyConfirmed) {
      return "개인정보를 입력하지 않았다는 확인이 필요합니다.";
    }
    return null;
  }

  async function generateDraft(): Promise<void> {
    const validation = validationMessage();
    if (validation) {
      setError(validation);
      formRef.current?.querySelector<HTMLElement>(":invalid, input, textarea, select")?.focus();
      return;
    }

    setError("");
    setCopyMessage("");
    setIsSubmitting(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const response = await fetch("/api/ai/document-writer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, studentId: values.studentId.trim() }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const body = AiDocumentWriterResultSchema.safeParse(await response.json());
      if (!body.success) throw new Error("AI 응답을 읽지 못했습니다. 다시 시도해 주세요.");
      setResult(body.data);
      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        setError("초안 작성 시간이 길어지고 있습니다. 다시 시도해 주세요.");
      } else if (requestError instanceof TypeError) {
        setError("네트워크 연결을 확인하고 다시 시도해 주세요.");
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("네트워크 연결을 확인하고 다시 시도해 주세요.");
      }
    } finally {
      window.clearTimeout(timeout);
      setIsSubmitting(false);
    }
  }

  async function copyDraft(): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.draft);
      setCopyMessage("초안을 복사했습니다.");
    } catch {
      setCopyMessage("초안을 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  }

  function returnToInputs(): void {
    formRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    formRef.current?.querySelector<HTMLTextAreaElement>("textarea")
      ?.focus({ preventScroll: true });
  }

  const characters = result ? countCharacters(result.draft) : 0;
  const bytes = result ? countUtf8Bytes(result.draft) : 0;
  return (
    <div className="ai-writer">
      <aside className="ai-writer-privacy" aria-labelledby="ai-writer-privacy-title">
        <ShieldCheck aria-hidden="true" size={22} />
        <div>
          <strong id="ai-writer-privacy-title">개인정보를 입력하지 마세요.</strong>
          <p>입력한 내용과 생성 결과는 저장되지 않습니다.</p>
        </div>
      </aside>
      <AiDocumentWriterForm
        error={error}
        formRef={formRef}
        isSubmitting={isSubmitting}
        onSubmit={() => void generateDraft()}
        onUpdate={update}
        values={values}
      />
      <AiDocumentWriterResultPanel
        bytes={bytes}
        characters={characters}
        copyMessage={copyMessage}
        isSubmitting={isSubmitting}
        onCopy={() => void copyDraft()}
        onEdit={returnToInputs}
        onRegenerate={() => void generateDraft()}
        result={result}
        resultRef={resultRef}
      />
    </div>
  );
}
