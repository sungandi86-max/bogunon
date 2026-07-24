import { FileCheck2, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

import type { ActivityReportFileState } from "@/components/ai/ai-document-writer-types";
import { Button } from "@/components/ui/button";
import { DOCUMENT_UPLOAD_ACCEPT } from "@/lib/ai/document-text-extraction";

interface AiDocumentWriterMaterialFieldProps {
  readonly fileState: ActivityReportFileState | null;
  readonly onFile: (file: File) => void;
  readonly onRemoveFile: () => void;
  readonly onValue: (value: string) => void;
  readonly value: string;
}

export function AiDocumentWriterMaterialField({
  fileState,
  onFile,
  onRemoveFile,
  onValue,
  value,
}: AiDocumentWriterMaterialFieldProps) {
  function chooseFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  }

  return (
    <div className="ai-writer-material-field">
      <div className="ai-writer-material-field__heading">
        <div>
          <label htmlFor="ai-activityReport">활동보고서</label>
          <p>
            학생이 제출한 활동보고서를 붙여넣거나 파일로 불러오세요.
            활동 내용, 느낀 점, 자기평가가 포함된 원본 그대로 사용할 수 있습니다.
          </p>
        </div>
        <label className="button button--secondary ai-writer-file-button">
          <Upload aria-hidden="true" size={16} />
          {fileState ? "파일 교체" : "파일 불러오기"}
          <input
            accept={DOCUMENT_UPLOAD_ACCEPT}
            aria-label="활동보고서 파일"
            onChange={chooseFile}
            type="file"
          />
        </label>
      </div>
      <textarea
        aria-describedby="ai-activityReport-limit"
        id="ai-activityReport"
        onChange={(event) => onValue(event.target.value)}
        placeholder="학생 활동보고서 내용을 입력하세요."
        rows={10}
        value={value}
      />
      <small id="ai-activityReport-limit">
        TXT 2MB · DOCX/HWP/HWPX 10MB · PDF 15MB · 초안 생성은 15,000자까지
      </small>
      {fileState && (
        <div className={`ai-writer-file-summary is-${fileState.status}`}>
          <div>
            {fileState.status === "extracting"
              ? <LoaderCircle aria-hidden="true" className="ai-writer-spinner" size={17} />
              : fileState.status === "ready"
                ? <FileCheck2 aria-hidden="true" size={17} />
                : <FileText aria-hidden="true" size={17} />}
            <span>
              <strong>{fileState.fileName}</strong>
              <small>
                {fileState.status === "extracting" && "텍스트 추출 중"}
                {fileState.status === "ready"
                  && `텍스트 추출 완료 · ${(fileState.characterCount ?? 0).toLocaleString("ko-KR")}자`}
                {fileState.status === "error" && fileState.message}
              </small>
            </span>
          </div>
          <Button aria-label="활동보고서 파일 삭제" onClick={onRemoveFile} variant="ghost">
            <Trash2 aria-hidden="true" size={16} />
            삭제
          </Button>
        </div>
      )}
    </div>
  );
}
