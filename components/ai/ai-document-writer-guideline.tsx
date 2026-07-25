import {
  ChevronDown,
  FileCheck2,
  Info,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  GUIDELINE_SOURCE_LABELS,
  type GuidelineSourceType,
  type RecordGuideline,
} from "@/lib/ai/record-guidelines";
import type { GuidelineOperation } from "@/components/ai/use-record-guidelines";

interface AiDocumentWriterGuidelineProps {
  readonly academicYear: string;
  readonly error: string;
  readonly guidelines: readonly RecordGuideline[];
  readonly message: string;
  readonly onAcademicYearChange: (value: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onFile: (
    file: File,
    academicYear: string,
    sourceType: GuidelineSourceType,
  ) => void;
  readonly onSourceTypeChange: (value: GuidelineSourceType) => void;
  readonly operation: GuidelineOperation;
  readonly sourceType: GuidelineSourceType;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024).toLocaleString("ko-KR")}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

export function AiDocumentWriterGuideline({
  academicYear,
  error,
  guidelines,
  message,
  onAcademicYearChange,
  onDelete,
  onFile,
  onSourceTypeChange,
  operation,
  sourceType,
}: AiDocumentWriterGuidelineProps) {
  const [expanded, setExpanded] = useState(false);
  const isBusy = operation !== "idle";
  const selectedYear = Number(academicYear);
  const yearGuidelines = Number.isInteger(selectedYear)
    ? guidelines.filter((guideline) => guideline.schoolYear === selectedYear)
    : [];
  const currentTypeExists = yearGuidelines.some(
    (guideline) => guideline.sourceType === sourceType,
  );
  const isExpanded = expanded || Boolean(error);

  function chooseFile(
    event: ChangeEvent<HTMLInputElement>,
    year: string,
    type: GuidelineSourceType,
  ): void {
    const file = event.target.files?.[0];
    if (file) onFile(file, year, type);
    event.target.value = "";
  }

  return (
    <details
      className="ai-writer-guideline-disclosure"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
      open={isExpanded}
    >
      <summary>
        <span className="ai-writer-guideline-disclosure__title">
          <FileCheck2 aria-hidden="true" size={20} />
          <span>
            <strong>생기부 기준자료</strong>
            <small>
              {operation === "loading"
                ? "등록 자료 불러오는 중"
                : yearGuidelines.length > 0
                  ? `${academicYear}학년도 · ${yearGuidelines.length}건 등록 완료`
                  : `${academicYear}학년도 등록된 공식 기준자료 없음`}
            </small>
          </span>
        </span>
        <span className="ai-writer-guideline-disclosure__action">
          {isExpanded ? "접기" : yearGuidelines.length > 0 ? "펼치기" : "등록하기"}
          <ChevronDown aria-hidden="true" size={17} />
        </span>
      </summary>

      <div className="ai-writer-guideline-disclosure__body">
        <p className="ai-writer-guideline-disclosure__description">
          등록한 기준자료는 내 계정에 저장되며, 해당 학년도의 생기부 검토에 자동으로 적용됩니다.
        </p>

        {yearGuidelines.length > 0 && (
          <div className="ai-writer-guideline-list" aria-label={`${academicYear}학년도 등록 기준자료`}>
            {yearGuidelines.map((guideline) => (
              <article className="ai-writer-guideline" key={guideline.id}>
                <div className="ai-writer-guideline__applied">
                  <span>적용 기준</span>
                  <strong>
                    {guideline.schoolYear}학년도 {GUIDELINE_SOURCE_LABELS[guideline.sourceType]}
                  </strong>
                </div>
                <dl>
                  <div><dt>파일명</dt><dd>{guideline.originalFilename}</dd></div>
                  <div><dt>등록일</dt><dd>{formatDate(guideline.updatedAt)}</dd></div>
                  <div><dt>파일 크기</dt><dd>{formatFileSize(guideline.fileSize)}</dd></div>
                  <div><dt>추출 상태</dt><dd>텍스트 추출 완료</dd></div>
                </dl>
                <div className="ai-writer-guideline__actions">
                  <label className="button button--secondary ai-writer-file-button">
                    <Upload aria-hidden="true" size={16} />
                    교체
                    <input
                      accept=".pdf,.txt,application/pdf,text/plain"
                      aria-label={`${GUIDELINE_SOURCE_LABELS[guideline.sourceType]} 파일 교체`}
                      disabled={isBusy}
                      onChange={(event) => chooseFile(
                        event,
                        String(guideline.schoolYear),
                        guideline.sourceType,
                      )}
                      type="file"
                    />
                  </label>
                  <Button
                    aria-label={`${GUIDELINE_SOURCE_LABELS[guideline.sourceType]} 삭제`}
                    disabled={isBusy}
                    onClick={() => onDelete(guideline.id)}
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" size={17} />
                    삭제
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="ai-writer-guideline-register">
          <div className="ai-writer-guideline-register__fields">
            <label className="ai-writer-field" htmlFor="ai-guideline-year">
              <span>기준 학년도</span>
              <input
                disabled={isBusy}
                id="ai-guideline-year"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => onAcademicYearChange(event.target.value)}
                value={academicYear}
              />
            </label>
            <label className="ai-writer-field" htmlFor="ai-guideline-type">
              <span>공식 자료 유형</span>
              <select
                disabled={isBusy}
                id="ai-guideline-type"
                onChange={(event) => onSourceTypeChange(event.target.value as GuidelineSourceType)}
                value={sourceType}
              >
                {Object.entries(GUIDELINE_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="button button--secondary ai-writer-file-button">
            {isBusy
              ? <LoaderCircle aria-hidden="true" className="ai-writer-spinner" size={16} />
              : <Upload aria-hidden="true" size={16} />}
            {operation === "extracting"
              ? "텍스트 추출 중"
              : operation === "saving"
                ? "저장 중"
                : currentTypeExists
                  ? "기존 기준자료 교체"
                  : "공식 기준자료 등록"}
            <input
              accept=".pdf,.txt,application/pdf,text/plain"
              aria-label="생기부 기준자료 파일"
              disabled={isBusy}
              onChange={(event) => chooseFile(event, academicYear, sourceType)}
              type="file"
            />
          </label>
          <p className="ai-writer-message ai-writer-message--notice">
            <Info aria-hidden="true" size={17} />
            텍스트 기반 PDF와 TXT를 지원합니다. 스캔 PDF는 텍스트를 직접 입력해야 합니다.
            등록한 공식 기재요령은 내 계정에 저장되며, 학생 자료는 서버에 저장되지 않습니다.
          </p>
        </div>

        {error && <p className="ai-writer-message ai-writer-message--error" role="alert">{error}</p>}
        {message && <p className="ai-writer-message ai-writer-message--success" role="status">{message}</p>}
        <p className="ai-writer-guideline-disclosure__memory">
          학생 활동보고서, 추가 기록 및 생성 결과는 서버에 저장되지 않습니다.
        </p>
      </div>
    </details>
  );
}
