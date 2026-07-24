import { FileCheck2, Info, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

import type {
  GuidelineSourceType,
  SchoolRecordGuideline,
} from "@/components/ai/ai-document-writer-types";
import { Button } from "@/components/ui/button";

const SOURCE_LABELS: Record<GuidelineSourceType, string> = {
  guide: "학교생활기록부 기재요령",
  correction: "교육부 공식 정오표",
  supplement: "공식 보완자료",
};

interface AiDocumentWriterGuidelineProps {
  readonly academicYear: string;
  readonly error: string;
  readonly guideline: SchoolRecordGuideline | null;
  readonly onAcademicYearChange: (value: string) => void;
  readonly onDelete: () => void;
  readonly onFile: (file: File) => void;
  readonly onSourceTypeChange: (value: GuidelineSourceType) => void;
  readonly sourceType: GuidelineSourceType;
}

export function AiDocumentWriterGuideline({
  academicYear,
  error,
  guideline,
  onAcademicYearChange,
  onDelete,
  onFile,
  onSourceTypeChange,
  sourceType,
}: AiDocumentWriterGuidelineProps) {
  function chooseFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  }

  return (
    <section className="ai-writer-section" aria-labelledby="ai-writer-guideline-title">
      <header>
        <FileCheck2 aria-hidden="true" size={20} />
        <div>
          <h2 id="ai-writer-guideline-title">생기부 기준자료</h2>
          <p>해당 학년도의 교육부 공식 자료만 등록하세요.</p>
        </div>
      </header>
      {guideline ? (
        <div className="ai-writer-guideline">
          <div className="ai-writer-guideline__applied">
            <span>적용 기준</span>
            <strong>
              {guideline.academicYear}학년도 {SOURCE_LABELS[guideline.sourceType]} ·{" "}
              {guideline.schoolLevel}
            </strong>
          </div>
          <dl>
            <div><dt>파일명</dt><dd>{guideline.fileName}</dd></div>
            <div><dt>등록 상태</dt><dd>현재 세션에 적용 중</dd></div>
          </dl>
          <div className="ai-writer-guideline__actions">
            <label className="button button--secondary ai-writer-file-button">
              <Upload aria-hidden="true" size={16} />
              교체
              <input
                accept=".txt,text/plain"
                aria-label="생기부 기준자료 TXT 파일"
                onChange={chooseFile}
                type="file"
              />
            </label>
            <Button aria-label="기준자료 삭제" onClick={onDelete} variant="ghost">
              <Trash2 aria-hidden="true" size={17} />
              삭제
            </Button>
          </div>
          <p className="ai-writer-message">
            <Info aria-hidden="true" size={17} />
            승인 전 임시 등록입니다. 새로고침하면 기준자료도 초기화됩니다.
          </p>
        </div>
      ) : (
        <div className="ai-writer-guideline-register">
          <div className="ai-writer-guideline-register__fields">
            <label className="ai-writer-field" htmlFor="ai-guideline-year">
              <span>기준 학년도</span>
              <input
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
                id="ai-guideline-type"
                onChange={(event) => onSourceTypeChange(event.target.value as GuidelineSourceType)}
                value={sourceType}
              >
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="button button--secondary ai-writer-file-button">
            <Upload aria-hidden="true" size={16} />
            공식 TXT 기준자료 등록
            <input
              accept=".txt,text/plain"
              aria-label="생기부 기준자료 TXT 파일"
              onChange={chooseFile}
              type="file"
            />
          </label>
          <p className="ai-writer-message ai-writer-message--notice">
            <Info aria-hidden="true" size={17} />
            공식 기재요령을 등록하면 기재 제한 가능 표현을 함께 점검할 수 있습니다.
            등록 전에도 개인정보, 문장, 오탈자, 바이트 검토는 가능합니다.
          </p>
          {error && <p className="ai-writer-message ai-writer-message--error" role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
