import {
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  Presentation,
} from "lucide-react";

type ProjectFileIconProps = {
  readonly mimeType: string;
  readonly size?: number;
};

export function ProjectFileIcon({ mimeType, size = 20 }: ProjectFileIconProps) {
  if (mimeType.startsWith("image/")) return <FileImage aria-hidden="true" size={size} />;
  if (mimeType === "application/pdf") return <FileType2 aria-hidden="true" size={size} />;
  if (mimeType.includes("spreadsheet")) return <FileSpreadsheet aria-hidden="true" size={size} />;
  if (mimeType.includes("presentation")) return <Presentation aria-hidden="true" size={size} />;
  return <FileText aria-hidden="true" size={size} />;
}

export function projectFileTypeLabel(filename: string, mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF 문서";
  if (mimeType.startsWith("image/")) return "이미지";
  if (mimeType === "text/plain") return "텍스트 문서";
  const extension = filename.split(".").at(-1)?.toLocaleUpperCase("en-US");
  return extension ? `${extension} 문서` : "문서";
}
