"use client";

import { ShieldCheck } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AiDocumentWriterForm } from "@/components/ai/ai-document-writer-form";
import { AiDocumentWriterResultPanel } from "@/components/ai/ai-document-writer-result";
import {
  INITIAL_AI_DOCUMENT_VALUES,
  type AiDocumentWriterFormValues,
  type GuidelineSourceType,
  type SchoolRecordGuideline,
  type StudentMaterialKey,
} from "@/components/ai/ai-document-writer-types";
import {
  AiDocumentWriterResultSchema,
  countCharacters,
  countUtf8Bytes,
} from "@/lib/ai/document-writer";
import type { AiDocumentWriterResult } from "@/lib/ai/document-writer";
import {
  DocumentTextExtractionError,
  extractTextFile,
} from "@/lib/ai/document-text-extraction";
import {
  reviewSchoolRecordDraft,
  type SchoolRecordReviewIssue,
} from "@/lib/ai/school-record-review";

const CLIENT_TIMEOUT_MS = 15_000;
const MAX_STUDENT_TEXT_LENGTH = 6_000;

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
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileMessages, setFileMessages] = useState<
    Partial<Record<StudentMaterialKey, string>>
  >({});
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [guidelineSourceType, setGuidelineSourceType] =
    useState<GuidelineSourceType>("guide");
  const [guideline, setGuideline] = useState<SchoolRecordGuideline | null>(null);
  const [guidelineError, setGuidelineError] = useState("");
  const [dismissedIssues, setDismissedIssues] = useState<readonly string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  function update<K extends keyof AiDocumentWriterFormValues>(
    key: K,
    value: AiDocumentWriterFormValues[K],
  ): void {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function loadMaterialFile(key: StudentMaterialKey, file: File): Promise<void> {
    try {
      const text = await extractTextFile(file);
      if (text.length > MAX_STUDENT_TEXT_LENGTH) {
        throw new DocumentTextExtractionError(
          "FILE_TOO_LARGE",
          "추출된 내용이 너무 깁니다. 6000자 이하로 줄인 TXT 파일을 사용해 주세요.",
        );
      }
      update(key, text);
      setFileMessages((current) => ({ ...current, [key]: `${file.name} 내용을 불러왔습니다.` }));
    } catch (fileError) {
      const message = fileError instanceof DocumentTextExtractionError
        ? fileError.message
        : "파일을 읽지 못했습니다. 다시 시도해 주세요.";
      setFileMessages((current) => ({ ...current, [key]: message }));
    }
  }

  async function loadGuidelineFile(file: File): Promise<void> {
    setGuidelineError("");
    if (!/^\d{4}$/.test(academicYear)) {
      setGuidelineError("기준 학년도를 4자리 숫자로 입력해 주세요.");
      return;
    }
    try {
      const text = await extractTextFile(file);
      setGuideline({
        academicYear,
        fileName: file.name,
        schoolLevel: "고등학교",
        sourceType: guidelineSourceType,
        text,
      });
      setDismissedIssues([]);
    } catch (fileError) {
      setGuidelineError(fileError instanceof DocumentTextExtractionError
        ? fileError.message
        : "기준자료를 읽지 못했습니다. 다시 시도해 주세요.");
    }
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
      setDraft(body.data.draft);
      setDismissedIssues([]);
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
      await navigator.clipboard.writeText(draft);
      setCopyMessage("초안을 복사했습니다.");
    } catch {
      setCopyMessage("초안을 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  }

  function updateDraft(value: string): void {
    setDraft(value);
    setDismissedIssues([]);
    setCopyMessage("");
  }

  function applySuggestion(issue: SchoolRecordReviewIssue): void {
    if (issue.suggestion === null) return;
    updateDraft(draft.replace(issue.expression, issue.suggestion));
  }

  const issues = useMemo(
    () => reviewSchoolRecordDraft(draft, { guidelineText: guideline?.text })
      .filter(({ id }) => !dismissedIssues.includes(id)),
    [dismissedIssues, draft, guideline?.text],
  );
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
        academicYear={academicYear}
        error={error}
        fileMessages={fileMessages}
        formRef={formRef}
        guideline={guideline}
        guidelineError={guidelineError}
        guidelineSourceType={guidelineSourceType}
        isSubmitting={isSubmitting}
        onAcademicYearChange={setAcademicYear}
        onDeleteGuideline={() => {
          setGuideline(null);
          setDismissedIssues([]);
        }}
        onGuidelineFile={(file) => void loadGuidelineFile(file)}
        onGuidelineSourceTypeChange={setGuidelineSourceType}
        onMaterialFile={(key, file) => void loadMaterialFile(key, file)}
        onSubmit={() => void generateDraft()}
        onUpdate={update}
        values={values}
      />
      <AiDocumentWriterResultPanel
        bytes={countUtf8Bytes(draft)}
        characters={countCharacters(draft)}
        copyMessage={copyMessage}
        draft={draft}
        hasGuideline={guideline !== null}
        isSubmitting={isSubmitting}
        issues={issues}
        noTeacherMemo={!values.teacherMemo.trim()}
        onApply={applySuggestion}
        onCopy={() => void copyDraft()}
        onDraftChange={updateDraft}
        onEdit={() => formRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" })}
        onKeep={(issue) => setDismissedIssues((current) => [...current, issue.id])}
        onRegenerate={() => void generateDraft()}
        result={result}
        resultRef={resultRef}
      />
    </div>
  );
}
