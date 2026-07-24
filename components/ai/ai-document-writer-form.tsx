import { AlertTriangle, FilePenLine, LoaderCircle, PencilLine, Sparkles } from "lucide-react";
import type { Ref } from "react";

import type { AiDocumentWriterFormValues } from "@/components/ai/ai-document-writer-types";
import { Button } from "@/components/ui/button";
import {
  AI_DOCUMENT_LENGTHS,
  AI_DOCUMENT_TYPES,
  AI_WRITING_TONES,
} from "@/lib/ai/document-writer";

interface AiDocumentWriterFormProps {
  readonly error: string;
  readonly formRef: Ref<HTMLFormElement>;
  readonly isSubmitting: boolean;
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
  {
    key: "teacherMemo",
    label: "교사 메모",
    placeholder: "수업 중 관찰한 태도, 역할, 변화 등을 간단히 입력하세요.",
  },
] as const;

export function AiDocumentWriterForm({
  error,
  formRef,
  isSubmitting,
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
      <section className="ai-writer-section" aria-labelledby="ai-writer-type-title">
        <header>
          <FilePenLine aria-hidden="true" size={20} />
          <div>
            <h2 id="ai-writer-type-title">문서 유형</h2>
            <p>작성할 초안의 종류를 선택하세요.</p>
          </div>
        </header>
        <label className="ai-writer-field" htmlFor="ai-document-type">
          <span>문서 유형</span>
          <select
            id="ai-document-type"
            onChange={(event) => onUpdate(
              "documentType",
              event.target.value as AiDocumentWriterFormValues["documentType"],
            )}
            value={values.documentType}
          >
            {AI_DOCUMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="ai-writer-section" aria-labelledby="ai-writer-material-title">
        <header>
          <Sparkles aria-hidden="true" size={20} />
          <div>
            <h2 id="ai-writer-material-title">익명화된 자료</h2>
            <p>필요한 자료만 입력하세요. 세 자료를 모두 채우지 않아도 됩니다.</p>
          </div>
        </header>
        <label className="ai-writer-field" htmlFor="ai-student-id">
          <span>학생 식별 ID</span>
          <input
            autoComplete="off"
            id="ai-student-id"
            maxLength={32}
            onChange={(event) => onUpdate("studentId", event.target.value)}
            placeholder="예) S001"
            value={values.studentId}
          />
          <small>
            학생 이름이나 학번 대신 익명 ID를 사용하세요. 결과 본문에는 포함하지 않습니다.
          </small>
        </label>
        <div className="ai-writer-materials">
          {MATERIAL_FIELDS.map((field) => (
            <label className="ai-writer-field" htmlFor={`ai-${field.key}`} key={field.key}>
              <span>{field.label}</span>
              <textarea
                id={`ai-${field.key}`}
                maxLength={6_000}
                onChange={(event) => onUpdate(field.key, event.target.value)}
                placeholder={field.placeholder}
                rows={4}
                value={values[field.key]}
              />
            </label>
          ))}
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
