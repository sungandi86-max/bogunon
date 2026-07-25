"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  fetchRecordGuidelines,
  removeRecordGuideline,
  saveRecordGuideline,
} from "@/components/ai/record-guideline-client";
import {
  DocumentTextExtractionError,
  extractDocumentText,
} from "@/lib/ai/document-text-extraction";
import {
  combineGuidelines,
  GUIDELINE_MAX_CHARACTERS,
  safeGuidelineFilename,
  type GuidelineSourceType,
  type RecordGuideline,
} from "@/lib/ai/record-guidelines";

export type GuidelineOperation =
  | "idle"
  | "loading"
  | "extracting"
  | "saving"
  | "deleting";

export function useRecordGuidelines() {
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [sourceType, setSourceType] = useState<GuidelineSourceType>("guide");
  const [guidelines, setGuidelines] = useState<readonly RecordGuideline[]>([]);
  const [operation, setOperation] = useState<GuidelineOperation>("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const extractionId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetchRecordGuidelines(controller.signal)
      .then((loaded) => {
        setGuidelines(loaded);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error
          ? requestError.message
          : "기준자료를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setOperation("idle");
      });
    return () => controller.abort();
  }, []);

  const selectedYear = /^\d{4}$/.test(academicYear) ? Number(academicYear) : null;
  const activeGuideline = useMemo(
    () => selectedYear === null ? null : combineGuidelines(guidelines, selectedYear),
    [guidelines, selectedYear],
  );

  async function upload(
    file: File,
    requestedYear = academicYear,
    requestedSourceType = sourceType,
  ): Promise<void> {
    const requestId = ++extractionId.current;
    setError("");
    setMessage("");
    const uploadYear = /^\d{4}$/.test(requestedYear) ? Number(requestedYear) : null;
    if (uploadYear === null || uploadYear < 2000 || uploadYear > 2100) {
      setError("기준 학년도를 4자리 숫자로 입력해 주세요.");
      return;
    }

    setOperation("extracting");
    try {
      const extracted = await extractDocumentText(file, { allowedFormats: ["pdf", "txt"] });
      if (requestId !== extractionId.current) return;
      if (Array.from(extracted.text).length > GUIDELINE_MAX_CHARACTERS) {
        throw new Error(
          `기준자료가 ${GUIDELINE_MAX_CHARACTERS.toLocaleString("ko-KR")}자를 초과했습니다. 더 작은 공식 자료를 선택해 주세요.`,
        );
      }

      setOperation("saving");
      const saved = await saveRecordGuideline({
        schoolYear: uploadYear,
        sourceType: requestedSourceType,
        originalFilename: safeGuidelineFilename(file.name),
        mimeType: extracted.format === "pdf" ? "application/pdf" : "text/plain",
        extractedText: extracted.text,
        fileSize: file.size,
      });
      if (requestId !== extractionId.current) return;
      setGuidelines((current) => [
        ...current.filter((item) =>
          item.schoolYear !== saved.schoolYear || item.sourceType !== saved.sourceType),
        saved,
      ]);
      setMessage("기준자료를 내 계정에 저장했습니다.");
    } catch (requestError) {
      if (requestId !== extractionId.current) return;
      setError(requestError instanceof DocumentTextExtractionError || requestError instanceof Error
        ? requestError.message
        : "기준자료를 등록하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      if (requestId === extractionId.current) setOperation("idle");
    }
  }

  async function remove(id: string): Promise<void> {
    extractionId.current += 1;
    setOperation("deleting");
    setError("");
    setMessage("");
    try {
      await removeRecordGuideline(id);
      setGuidelines((current) => current.filter((guideline) => guideline.id !== id));
      setMessage("기준자료를 삭제했습니다.");
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : "기준자료를 삭제하지 못했습니다.");
    } finally {
      setOperation("idle");
    }
  }

  return {
    academicYear,
    activeGuideline,
    error,
    guidelines,
    message,
    operation,
    remove,
    setAcademicYear,
    setSourceType,
    sourceType,
    upload,
  };
}
