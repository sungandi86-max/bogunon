"use server";

import { revalidatePath } from "next/cache";
import { createReport, updateReport } from "@/lib/reports/repository";
import { isReportStatus, isReportType } from "@/lib/reports/model";

export type ReportActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };
function value(formData: FormData, key: string): string { return String(formData.get(key) ?? "").trim(); }
function optional(valueToCheck: string): string | null { return valueToCheck || null; }
function optionalBounded(formData: FormData, key: string, maxLength: number): string | null | "invalid" {
  const candidate = value(formData, key);
  if (candidate.length > maxLength) return "invalid";
  return optional(candidate);
}
function numberValue(formData: FormData, key: string): number | null { const valueToParse = Number(formData.get(key)); return Number.isInteger(valueToParse) && valueToParse > 0 ? valueToParse : null; }
function isReproducible(valueToCheck: string): valueToCheck is "yes" | "no" | "unknown" { return valueToCheck === "yes" || valueToCheck === "no" || valueToCheck === "unknown"; }

export async function createReportAction(_state: ReportActionState, formData: FormData): Promise<ReportActionState> {
  const reportType = value(formData, "reportType");
  const title = value(formData, "title");
  const description = value(formData, "description");
  if (!isReportType(reportType)) return { status: "error", message: "신고 유형을 선택해 주세요." };
  if (!title || title.length > 160) return { status: "error", message: "제목을 160자 이내로 입력해 주세요." };
  if (!description || description.length > 10000) return { status: "error", message: "내용을 입력해 주세요." };
  try {
    const reproducibleValue = value(formData, "reproducible");
    const attemptedAction = reportType === "bug" ? optionalBounded(formData, "attemptedAction", 5000) : null;
    const observedResult = reportType === "bug" ? optionalBounded(formData, "observedResult", 5000) : null;
    if (attemptedAction === "invalid" || observedResult === "invalid") return { status: "error", message: "발생 상황은 5,000자 이내로 입력해 주세요." };
    await createReport({ reportType, title, description, attemptedAction, observedResult, reproducible: reportType === "bug" && isReproducible(reproducibleValue) ? reproducibleValue : null, pagePath: value(formData, "pagePath"), appVersion: optional(value(formData, "appVersion")), userAgent: optional(value(formData, "userAgent")), viewportWidth: numberValue(formData, "viewportWidth"), viewportHeight: numberValue(formData, "viewportHeight") });
    revalidatePath("/support/reports");
    return { status: "success", message: "신고가 접수되었습니다. 확인 후 신고 내역에 처리 상태를 표시해 드릴게요." };
  } catch (error) {
    console.error("[reports] create report failed", error);
    return { status: "error", message: "신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function updateReportAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!id || !isReportStatus(status)) throw new Error("신고 상태를 확인해 주세요.");
  const adminNote = optionalBounded(formData, "adminNote", 10000);
  if (adminNote === "invalid") throw new Error("관리자 메모는 10,000자 이내로 입력해 주세요.");
  await updateReport(id, status, adminNote);
  revalidatePath("/admin/reports");
  revalidatePath("/support/reports");
}
