"use client";

import { useMemo, useRef, useState } from "react";

import { requestAiDocumentDraft } from "@/components/ai/ai-document-writer-client";
import { AiDocumentWriterForm } from "@/components/ai/ai-document-writer-form";
import { AiDocumentWriterPrivacyNotice } from "@/components/ai/ai-document-writer-privacy-notice";
import { AiDocumentWriterResultPanel } from "@/components/ai/ai-document-writer-result";
import {
  INITIAL_AI_DOCUMENT_VALUES,
  type ActivityReportFileState,
  type AiDocumentWriterFormValues,
  type GuidelineSourceType,
  type SchoolRecordGuideline,
} from "@/components/ai/ai-document-writer-types";
import { PageHeader } from "@/components/layout/page-header";
import {
  countCharacters,
  countUtf8Bytes,
  MAX_ACTIVITY_REPORT_CHARACTERS,
} from "@/lib/ai/document-writer";
import type { AiDocumentWriterResult } from "@/lib/ai/document-writer";
import {
  DocumentTextExtractionError,
  extractDocumentText,
} from "@/lib/ai/document-text-extraction";
import {
  reviewSchoolRecordDraft,
  type SchoolRecordReviewIssue,
} from "@/lib/ai/school-record-review";

const GUIDELINE_MAX_BYTES = 2 * 1024 * 1024;

export function AiDocumentWriterDesktop() {
  const [values, setValues] = useState(INITIAL_AI_DOCUMENT_VALUES);
  const [activityFileState, setActivityFileState] = useState<ActivityReportFileState | null>(null);
  const [result, setResult] = useState<AiDocumentWriterResult | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [guidelineSourceType, setGuidelineSourceType] =
    useState<GuidelineSourceType>("guide");
  const [guideline, setGuideline] = useState<SchoolRecordGuideline | null>(null);
  const [guidelineError, setGuidelineError] = useState("");
  const [dismissedIssues, setDismissedIssues] = useState<readonly string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const activityExtractionId = useRef(0);
  const guidelineExtractionId = useRef(0);

  function update<K extends keyof AiDocumentWriterFormValues>(
    key: K,
    value: AiDocumentWriterFormValues[K],
  ): void {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "activityReport" && activityFileState?.status === "ready") {
      setActivityFileState((current) => current
        ? { ...current, characterCount: Array.from(String(value)).length }
        : null);
    }
  }

  async function loadActivityFile(file: File): Promise<void> {
    const extractionId = ++activityExtractionId.current;
    setActivityFileState({ fileName: file.name, status: "extracting" });
    try {
      const extracted = await extractDocumentText(file);
      if (extractionId !== activityExtractionId.current) return;
      update("activityReport", extracted.text);
      setActivityFileState({
        characterCount: Array.from(extracted.text).length,
        fileName: file.name,
        format: extracted.format,
        status: "ready",
      });
      setError("");
    } catch (fileError) {
      if (extractionId !== activityExtractionId.current) return;
      const message = fileError instanceof DocumentTextExtractionError
        ? fileError.message
        : "파일을 읽지 못했습니다. 내용을 직접 붙여넣거나 다른 파일을 선택해 주세요.";
      setActivityFileState({
        fileName: file.name,
        message,
        status: "error",
      });
    }
  }

  async function loadGuidelineFile(file: File): Promise<void> {
    const extractionId = ++guidelineExtractionId.current;
    setGuidelineError("");
    if (!/^\d{4}$/.test(academicYear)) {
      setGuidelineError("기준 학년도를 4자리 숫자로 입력해 주세요.");
      return;
    }
    try {
      const extracted = await extractDocumentText(file, {
        allowedFormats: ["txt"],
        maxBytes: GUIDELINE_MAX_BYTES,
      });
      if (extractionId !== guidelineExtractionId.current) return;
      setGuideline({
        academicYear,
        fileName: file.name,
        schoolLevel: "고등학교",
        sourceType: guidelineSourceType,
        text: extracted.text,
      });
      setDismissedIssues([]);
    } catch (fileError) {
      if (extractionId !== guidelineExtractionId.current) return;
      setGuidelineError(fileError instanceof DocumentTextExtractionError
        ? fileError.message
        : "기준자료를 읽지 못했습니다. 다시 시도해 주세요.");
    }
  }

  function validationMessage(): string | null {
    if (activityFileState?.status === "extracting") {
      return "활동보고서 텍스트 추출이 끝날 때까지 기다려 주세요.";
    }
    if (!values.studentId.trim()) return "학생 식별 ID를 입력해 주세요.";
    if (!/^[A-Za-z0-9_-]+$/.test(values.studentId.trim())) {
      return "학생 식별 ID는 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.";
    }
    if (!values.activityReport.trim()) {
      return "활동보고서를 입력하거나 파일로 불러와 주세요.";
    }
    if (Array.from(values.activityReport).length > MAX_ACTIVITY_REPORT_CHARACTERS) {
      return `활동보고서를 ${MAX_ACTIVITY_REPORT_CHARACTERS.toLocaleString("ko-KR")}자 이하로 줄여주세요.`;
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
      formRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
      return;
    }

    setError("");
    setCopyMessage("");
    setIsSubmitting(true);
    try {
      const response = await requestAiDocumentDraft(values);
      setResult(response);
      setDraft(response.draft);
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
      <div className="ai-writer-input-column">
        <PageHeader
          description="학생 활동자료와 추가 기록을 바탕으로 초안을 만들고, 등록된 해당 학년도 학교생활기록부 기재요령에 따라 검토합니다."
          title="동아리 생활기록부 초안"
        />
        <AiDocumentWriterPrivacyNotice />
        <AiDocumentWriterForm
          academicYear={academicYear}
          activityFileState={activityFileState}
          error={error}
          formRef={formRef}
          guideline={guideline}
          guidelineError={guidelineError}
          guidelineSourceType={guidelineSourceType}
          isSubmitting={isSubmitting}
          onAcademicYearChange={setAcademicYear}
          onActivityFile={(file) => void loadActivityFile(file)}
          onDeleteGuideline={() => {
            guidelineExtractionId.current += 1;
            setGuideline(null);
            setDismissedIssues([]);
          }}
          onGuidelineFile={(file) => void loadGuidelineFile(file)}
          onGuidelineSourceTypeChange={setGuidelineSourceType}
          onRemoveActivityFile={() => {
            activityExtractionId.current += 1;
            setActivityFileState(null);
            update("activityReport", "");
          }}
          onSubmit={() => void generateDraft()}
          onUpdate={update}
          values={values}
        />
      </div>
      <AiDocumentWriterResultPanel
        activityReportReady={values.activityReport.trim().length > 0}
        bytes={countUtf8Bytes(draft)}
        characters={countCharacters(draft)}
        copyMessage={copyMessage}
        draft={draft}
        hasAdditionalRecord={values.additionalRecord.trim().length > 0}
        hasGuideline={guideline !== null}
        isSubmitting={isSubmitting}
        issues={issues}
        onApply={applySuggestion}
        onCopy={() => void copyDraft()}
        onDraftChange={updateDraft}
        onEdit={() => formRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" })}
        onKeep={(issue) => setDismissedIssues((current) => [...current, issue.id])}
        onRegenerate={() => void generateDraft()}
        result={result}
        resultRef={resultRef}
        studentIdReady={values.studentId.trim().length > 0}
      />
    </div>
  );
}
