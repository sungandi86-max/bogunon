import {
  AlertTriangle,
  NotebookPen,
  PencilLine,
} from "lucide-react";
import type { Ref } from "react";

import { AiDocumentWriterGuideline } from "@/components/ai/ai-document-writer-guideline";
import { AiDocumentWriterMaterialField } from "@/components/ai/ai-document-writer-material-field";
import { AiDocumentWriterSubmit } from "@/components/ai/ai-document-writer-submit";
import type {
  ActivityReportFileState,
  AiDocumentWriterFormValues,
  GuidelineSourceType,
} from "@/components/ai/ai-document-writer-types";
import type { RecordGuideline } from "@/lib/ai/record-guidelines";
import type { GuidelineOperation } from "@/components/ai/use-record-guidelines";
import {
  AI_DOCUMENT_LENGTHS,
  AI_WRITING_TONES,
  MAX_ACTIVITY_REPORT_CHARACTERS,
  MAX_ADDITIONAL_RECORD_CHARACTERS,
} from "@/lib/ai/document-writer";

interface AiDocumentWriterFormProps {
  readonly aiConnected: boolean;
  readonly academicYear: string;
  readonly activityFileState: ActivityReportFileState | null;
  readonly error: string;
  readonly formRef: Ref<HTMLFormElement>;
  readonly guidelines: readonly RecordGuideline[];
  readonly guidelineError: string;
  readonly guidelineMessage: string;
  readonly guidelineOperation: GuidelineOperation;
  readonly guidelineSourceType: GuidelineSourceType;
  readonly hasGuideline: boolean;
  readonly isSubmitting: boolean;
  readonly onAcademicYearChange: (value: string) => void;
  readonly onActivityFile: (file: File) => void;
  readonly onDeleteGuideline: (id: string) => void;
  readonly onGuidelineFile: (
    file: File,
    academicYear: string,
    sourceType: GuidelineSourceType,
  ) => void;
  readonly onGuidelineSourceTypeChange: (value: GuidelineSourceType) => void;
  readonly onRemoveActivityFile: () => void;
  readonly onSubmit: () => void;
  readonly onUpdate: <K extends keyof AiDocumentWriterFormValues>(
    key: K,
    value: AiDocumentWriterFormValues[K],
  ) => void;
  readonly values: AiDocumentWriterFormValues;
}

const ADDITIONAL_RECORD_EXAMPLES = [
  "회장·부회장 등 직책",
  "체육대회 보건도우미",
  "축제 운영",
  "특별 역할 및 추가 활동",
] as const;

export function AiDocumentWriterForm({
  aiConnected,
  academicYear,
  activityFileState,
  error,
  formRef,
  guidelines,
  guidelineError,
  guidelineMessage,
  guidelineOperation,
  guidelineSourceType,
  hasGuideline,
  isSubmitting,
  onAcademicYearChange,
  onActivityFile,
  onDeleteGuideline,
  onGuidelineFile,
  onGuidelineSourceTypeChange,
  onRemoveActivityFile,
  onSubmit,
  onUpdate,
  values,
}: AiDocumentWriterFormProps) {
  const activityReportLength = Array.from(values.activityReport).length;
  const activityReportTooLong = activityReportLength > MAX_ACTIVITY_REPORT_CHARACTERS;
  const activityReportMissing = values.activityReport.trim().length === 0;
  const activityReportExtracting = activityFileState?.status === "extracting";
  const guidelineLoading = guidelineOperation === "loading";

  return (
    <form
      className="ai-writer-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      ref={formRef}
    >
      <section className="ai-writer-section ai-writer-student-input" aria-labelledby="ai-writer-material-title">
        <header>
          <NotebookPen aria-hidden="true" size={20} />
          <div>
            <h2 id="ai-writer-material-title">학생 자료</h2>
            <p>활동보고서를 중심으로 작성하고, 보고서에 없는 특별한 내용만 추가합니다.</p>
          </div>
        </header>

        <label className="ai-writer-field" htmlFor="ai-student-id">
          <span>익명 학생 ID</span>
          <input
            autoComplete="off"
            id="ai-student-id"
            maxLength={32}
            onChange={(event) => onUpdate("studentId", event.target.value)}
            placeholder="예) S001"
            value={values.studentId}
          />
          <small>학생 이름이나 학번 대신 익명 ID를 사용하세요. 결과 본문에는 포함하지 않습니다.</small>
        </label>

        <AiDocumentWriterMaterialField
          fileState={activityFileState}
          onFile={onActivityFile}
          onRemoveFile={onRemoveActivityFile}
          onValue={(value) => onUpdate("activityReport", value)}
          value={values.activityReport}
        />

        <label className="ai-writer-field ai-writer-additional-record" htmlFor="ai-additionalRecord">
          <span>추가 기록 (선택)</span>
          <small>
            활동보고서에 없는 직책, 역할, 행사 참여 등 초안에 추가로 반영할 내용만 입력하세요.
          </small>
          <textarea
            id="ai-additionalRecord"
            maxLength={MAX_ADDITIONAL_RECORD_CHARACTERS}
            onChange={(event) => onUpdate("additionalRecord", event.target.value)}
            placeholder="예) 동아리 회장, 체육대회 보건도우미 참여, 축제 부스 운영 총괄"
            rows={4}
            value={values.additionalRecord}
          />
          <span className="ai-writer-example-tags" aria-label="추가 기록 예시">
            {ADDITIONAL_RECORD_EXAMPLES.map((example) => <small key={example}>{example}</small>)}
          </span>
        </label>

        <div className="ai-writer-criteria" aria-labelledby="ai-writer-criteria-title">
          <div className="ai-writer-criteria__heading">
            <PencilLine aria-hidden="true" size={18} />
            <div>
              <h3 id="ai-writer-criteria-title">작성 기준</h3>
              <p>문체와 목표 분량을 정합니다.</p>
            </div>
          </div>
          <fieldset>
            <legend>문체</legend>
            <div className="ai-writer-segments">
              {AI_WRITING_TONES.map((option) => (
                <label key={option.value}>
                  <input
                    checked={values.tone === option.value}
                    name="ai-writer-tone"
                    onChange={() => onUpdate("tone", option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>분량</legend>
            <div className="ai-writer-segments">
              {AI_DOCUMENT_LENGTHS.map((option) => (
                <label key={option.value}>
                  <input
                    checked={values.length === option.value}
                    name="ai-writer-length"
                    onChange={() => onUpdate("length", option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="ai-writer-consent">
          <label>
            <input
              checked={values.privacyConfirmed}
              onChange={(event) => onUpdate("privacyConfirmed", event.target.checked)}
              type="checkbox"
            />
            <span>학생 이름, 학번, 연락처 등 개인정보를 입력하지 않았습니다.</span>
          </label>
        </div>

        {error && (
          <p className="ai-writer-message ai-writer-message--error" role="alert">
            <AlertTriangle aria-hidden="true" size={18} />
            {error}
          </p>
        )}
        <AiDocumentWriterSubmit
          academicYear={academicYear}
          activityReportExtracting={activityReportExtracting}
          activityReportLength={activityReportLength}
          activityReportMissing={activityReportMissing}
          activityReportTooLong={activityReportTooLong}
          aiConnected={aiConnected}
          guidelineBusy={guidelineOperation !== "idle"}
          guidelineLoading={guidelineLoading}
          hasGuideline={hasGuideline}
          isSubmitting={isSubmitting}
        />
      </section>

      <AiDocumentWriterGuideline
        academicYear={academicYear}
        error={guidelineError}
        guidelines={guidelines}
        message={guidelineMessage}
        onAcademicYearChange={onAcademicYearChange}
        onDelete={onDeleteGuideline}
        onFile={onGuidelineFile}
        onSourceTypeChange={onGuidelineSourceTypeChange}
        operation={guidelineOperation}
        sourceType={guidelineSourceType}
      />
    </form>
  );
}
