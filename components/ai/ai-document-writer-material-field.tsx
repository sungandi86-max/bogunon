import { FileText, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

import type { StudentMaterialKey } from "@/components/ai/ai-document-writer-types";

interface AiDocumentWriterMaterialFieldProps {
  readonly fieldKey: StudentMaterialKey;
  readonly fileMessage: string | undefined;
  readonly label: string;
  readonly onFile: (key: StudentMaterialKey, file: File) => void;
  readonly onValue: (key: StudentMaterialKey, value: string) => void;
  readonly placeholder: string;
  readonly value: string;
}

export function AiDocumentWriterMaterialField({
  fieldKey,
  fileMessage,
  label,
  onFile,
  onValue,
  placeholder,
  value,
}: AiDocumentWriterMaterialFieldProps) {
  function chooseFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file) onFile(fieldKey, file);
    event.target.value = "";
  }

  return (
    <div className="ai-writer-material-field">
      <div className="ai-writer-material-field__heading">
        <label htmlFor={`ai-${fieldKey}`}>{label}</label>
        <label className="button button--secondary ai-writer-file-button">
          <Upload aria-hidden="true" size={16} />
          TXT 불러오기
          <input
            accept=".txt,text/plain"
            aria-label={`${label} TXT 파일`}
            onChange={chooseFile}
            type="file"
          />
        </label>
      </div>
      <textarea
        id={`ai-${fieldKey}`}
        maxLength={6_000}
        onChange={(event) => onValue(fieldKey, event.target.value)}
        placeholder={placeholder}
        rows={4}
        value={value}
      />
      {fileMessage && (
        <small className="ai-writer-file-status">
          <FileText aria-hidden="true" size={15} />
          {fileMessage}
        </small>
      )}
    </div>
  );
}
