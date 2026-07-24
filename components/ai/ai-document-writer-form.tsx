import { AlertTriangle, LoaderCircle, PencilLine, Sparkles } from "lucide-react";
import type { Ref } from "react";

import { AiDocumentWriterGuideline } from "@/components/ai/ai-document-writer-guideline";
import { AiDocumentWriterMaterialField } from "@/components/ai/ai-document-writer-material-field";
import type {
  AiDocumentWriterFormValues,
  GuidelineSourceType,
  SchoolRecordGuideline,
  StudentMaterialKey,
} from "@/components/ai/ai-document-writer-types";
import { Button } from "@/components/ui/button";
import { AI_DOCUMENT_LENGTHS, AI_WRITING_TONES } from "@/lib/ai/document-writer";

interface AiDocumentWriterFormProps {
  readonly academicYear: string;
  readonly error: string;
  readonly fileMessages: Partial<Record<StudentMaterialKey, string>>;
  readonly formRef: Ref<HTMLFormElement>;
  readonly guideline: SchoolRecordGuideline | null;
  readonly guidelineError: string;
  readonly guidelineSourceType: GuidelineSourceType;
  readonly isSubmitting: boolean;
  readonly onAcademicYearChange: (value: string) => void;
  readonly onDeleteGuideline: () => void;
  readonly onGuidelineFile: (file: File) => void;
  readonly onGuidelineSourceTypeChange: (value: GuidelineSourceType) => void;
  readonly onMaterialFile: (key: StudentMaterialKey, file: File) => void;
  readonly onSubmit: () => void;
  readonly onUpdate: <K extends keyof AiDocumentWriterFormValues>(
    key: K,
    value: AiDocumentWriterFormValues[K],
  ) => void;
  readonly values: AiDocumentWriterFormValues;
}

const MATERIAL_FIELDS = [
  {
    key: "activityReport",
    label: "활동보고서",
    placeholder: "학생이 제출한 활동 내용의 핵심만 붙여넣으세요.",
  },
  {
    key: "selfEvaluation",
    label: "자기평가",
    placeholder: "학생의 자기평가 내용을 붙여넣으세요.",
  },
] as const;

export function AiDocumentWriterForm({
  academicYear,
  error,
  fileMessages,
  formRef,
  guideline,
  guidelineError,
  guidelineSourceType,
  isSubmitting,
  onAcademicYearChange,
  onDeleteGuideline,
  onGuidelineFile,
  onGuidelineSourceTypeChange,
  onMaterialFile,
  onSubmit,
  onUpdate,
  values,
}: AiDocumentWriterFormProps) {
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
      <AiDocumentWriterGuideline
        academicYear={academicYear}
        error={guidelineError}
        guideline={guideline}
        onAcademicYearChange={onAcademicYearChange}
        onDelete={onDeleteGuideline}
        onFile={onGuidelineFile}
        onSourceTypeChange={onGuidelineSourceTypeChange}
        sourceType={guidelineSourceType}
      />

      <section className="ai-writer-section" aria-labelledby="ai-writer-material-title">
        <header>
          <Sparkles aria-hidden="true" size={20} />
          <div>
            <h2 id="ai-writer-material-title">익명화된 학생 자료</h2>
            <p>직접 입력하거나 TXT 파일을 불러온 뒤 내용을 확인하고 수정하세요.</p>
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
        <div className="ai-writer-materials">
          {MATERIAL_FIELDS.map((field) => (
            <AiDocumentWriterMaterialField
              fieldKey={field.key}
              fileMessage={fileMessages[field.key]}
              key={field.key}
              label={field.label}
              onFile={onMaterialFile}
              onValue={onUpdate}
              placeholder={field.placeholder}
              value={values[field.key]}
            />
          ))}
          <label className="ai-writer-field" htmlFor="ai-teacherMemo">
            <span>교사 메모</span>
            <textarea
              id="ai-teacherMemo"
              maxLength={6_000}
              onChange={(event) => onUpdate("teacherMemo", event.target.value)}
              placeholder="수업 중 관찰한 태도, 역할, 변화 등을 간단히 입력하세요."
              rows={4}
              value={values.teacherMemo}
            />
          </label>
        </div>
      </section>

      <section className="ai-writer-section" aria-labelledby="ai-writer-criteria-title">
        <header>
          <PencilLine aria-hidden="true" size={20} />
          <div>
            <h2 id="ai-writer-criteria-title">작성 기준</h2>
            <p>문체와 목표 분량만 간단히 정합니다.</p>
          </div>
        </header>
        <div className="ai-writer-criteria">
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
      </section>

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
      <div className="ai-writer-submit">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting
            ? <LoaderCircle aria-hidden="true" className="ai-writer-spinner" size={18} />
            : <Sparkles aria-hidden="true" size={18} />}
          {isSubmitting ? "초안 작성 중" : "AI 초안 만들기"}
        </Button>
      </div>
    </form>
  );
}
