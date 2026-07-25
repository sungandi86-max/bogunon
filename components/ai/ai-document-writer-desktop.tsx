"use client";

import { useMemo, useRef, useState } from "react";

import { requestAiDocumentDraft } from "@/components/ai/ai-document-writer-client";
import { useAiConnection } from "@/components/ai/ai-connection-context";
import { AiConnectionStatusCard } from "@/components/ai/ai-connection-status-card";
import { AiDocumentWriterForm } from "@/components/ai/ai-document-writer-form";
import { AiDocumentWriterPrivacyNotice } from "@/components/ai/ai-document-writer-privacy-notice";
import { AiDocumentWriterResultPanel } from "@/components/ai/ai-document-writer-result";
import {
  INITIAL_AI_DOCUMENT_VALUES,
  type ActivityReportFileState,
  type AiDocumentWriterFormValues,
} from "@/components/ai/ai-document-writer-types";
import { useRecordGuidelines } from "@/components/ai/use-record-guidelines";
import { aiDocumentWriterValidationMessage } from "@/components/ai/ai-document-writer-validation";
import { PageHeader } from "@/components/layout/page-header";
import {
  countCharacters,
  countUtf8Bytes,
} from "@/lib/ai/document-writer";
import type { AiDocumentWriterResult } from "@/lib/ai/document-writer";
import {
  DocumentTextExtractionError,
  extractDocumentText,
} from "@/lib/ai/document-text-extraction";
import {
  mergeSchoolRecordReview,
  type SchoolRecordReviewIssue,
} from "@/lib/ai/school-record-review";

export function AiDocumentWriterDesktop() {
  const ai = useAiConnection();
  const guidelineStore = useRecordGuidelines();
  const [values, setValues] = useState(INITIAL_AI_DOCUMENT_VALUES);
  const [activityFileState, setActivityFileState] = useState<ActivityReportFileState | null>(null);
  const [result, setResult] = useState<AiDocumentWriterResult | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissedIssues, setDismissedIssues] = useState<readonly string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const activityExtractionId = useRef(0);
  const generationId = useRef(0);

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

  async function generateDraft(): Promise<void> {
    if (guidelineStore.operation === "loading") {
      setError("기준자료를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!guidelineStore.activeGuideline) {
      setError(
        `${guidelineStore.academicYear}학년도 기준자료가 등록되지 않았습니다. 설정에서 기준자료를 먼저 등록해주세요.`,
      );
      return;
    }
    const validation = aiDocumentWriterValidationMessage(
      values,
      activityFileState?.status ?? null,
      ai.connection !== null,
    );
    if (validation) {
      setError(validation);
      formRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
      return;
    }

    setError("");
    setCopyMessage("");
    setIsSubmitting(true);
    const requestId = ++generationId.current;
    try {
      if (!ai.connection) {
        setError("설정에서 OpenAI 또는 Gemini를 먼저 연결해 주세요.");
        return;
      }
      const response = await requestAiDocumentDraft(
        values,
        ai.connection,
        guidelineStore.academicYear,
      );
      if (requestId !== generationId.current) return;
      setResult(response);
      setDraft(response.draft);
      setDismissedIssues([]);
      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
    } catch (requestError) {
      if (requestId !== generationId.current) return;
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
      if (requestId === generationId.current) setIsSubmitting(false);
    }
  }

  function resetGeneratedDraft(): void {
    generationId.current += 1;
    setResult(null);
    setDraft("");
    setDismissedIssues([]);
    setCopyMessage("");
    setError("");
    setIsSubmitting(false);
  }

  function changeAcademicYear(value: string): void {
    resetGeneratedDraft();
    guidelineStore.setAcademicYear(value);
  }

  async function copyDraft(): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopyMessage("초안을 복사했습니다.");
    } catch (copyError) {
      if (copyError instanceof Error) {
        setCopyMessage("초안을 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
        return;
      }
      throw copyError;
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
    () => mergeSchoolRecordReview(draft, result?.review, {
      guidelineText: guidelineStore.activeGuideline?.text,
    })
      .filter(({ id }) => !dismissedIssues.includes(id)),
    [dismissedIssues, draft, guidelineStore.activeGuideline?.text, result?.review],
  );

  return (
    <div className="ai-writer">
      <div className="ai-writer-input-column">
        <PageHeader
          description="학생 활동자료와 추가 기록을 바탕으로 초안을 만들고, 등록된 해당 학년도 학교생활기록부 기재요령에 따라 검토합니다."
          title="동아리 생활기록부 초안"
        />
        <AiDocumentWriterPrivacyNotice />
        <AiConnectionStatusCard />
        <AiDocumentWriterForm
          aiConnected={ai.connection !== null}
          academicYear={guidelineStore.academicYear}
          activityFileState={activityFileState}
          error={error}
          formRef={formRef}
          guidelines={guidelineStore.guidelines}
          guidelineError={guidelineStore.error}
          guidelineMessage={guidelineStore.message}
          guidelineOperation={guidelineStore.operation}
          guidelineSourceType={guidelineStore.sourceType}
          hasGuideline={guidelineStore.activeGuideline !== null}
          isSubmitting={isSubmitting}
          onAcademicYearChange={changeAcademicYear}
          onActivityFile={(file) => void loadActivityFile(file)}
          onDeleteGuideline={(id) => {
            resetGeneratedDraft();
            void guidelineStore.remove(id);
          }}
          onGuidelineFile={(file, year, sourceType) => {
            resetGeneratedDraft();
            void guidelineStore.upload(file, year, sourceType);
          }}
          onGuidelineSourceTypeChange={guidelineStore.setSourceType}
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
        hasGuideline={guidelineStore.activeGuideline !== null}
        academicYear={guidelineStore.academicYear}
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
