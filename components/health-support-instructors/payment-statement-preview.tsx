"use client";

import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import type { HealthSupportSettlementDocuments } from "@/lib/health-support-instructors/settlement/documents";

type PaymentStatementPreviewProps = {
  readonly documents: HealthSupportSettlementDocuments;
  readonly printActive: boolean;
  readonly showPreview: boolean;
};

export function PaymentStatementPreview({ documents, printActive, showPreview }: PaymentStatementPreviewProps) {
  const statement = documents.paymentStatement;
  if (!showPreview && !printActive) return null;

  function downloadExcel(): void {
    const rows = [
      ["순", "", "1", "비고"],
      ["성명", "", statement.instructorName, ""],
      ["주당시수", "", statement.weeklyHours, ""],
      ["과목", "", statement.subject, ""],
      ["일자", "요일", "수업시수", "비고"],
      ...statement.rows.map((row) => [`${Number(statement.month.slice(5, 7))}월 ${Number(row.date.slice(8, 10))}일`, row.weekday, row.hours, row.note]),
      ["총계", "", statement.hours, ""],
      ["금액", "", statement.amount, ""],
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "지급명세서");
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `학교보건지원강사 ${statement.month.replace("-", "년 ")}월 지급명세서.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <section aria-labelledby="payment-statement-preview-title" className="payment-statement-preview">
    <div className="payment-statement-preview__actions"><Button aria-label="Download payment statement Excel" onClick={downloadExcel} type="button" variant="secondary">Excel 다운로드</Button></div>
    <h2 id="payment-statement-preview-title">지급명세서</h2>
    <div className="payment-statement-preview__meta"><span>성명: {statement.instructorName}</span><span>주당시수: {statement.weeklyHours}시간</span><span>과목: {statement.subject}</span><span>조회월: {statement.month}</span></div>
    {statement.rows.length === 0 ? <p role="status">해당 월의 근무기록이 없습니다.</p> : <>
      <table aria-label="Payment statement detail"><thead><tr><th>일자</th><th>요일</th><th>수업시수</th><th>비고</th></tr></thead><tbody>{statement.rows.map((row, index) => <tr key={`${row.date}-${row.isoWeekKey}-${index}`}><td>{Number(statement.month.slice(5, 7))}월 {Number(row.date.slice(8, 10))}일</td><td>{row.weekday}</td><td>{row.hours}</td><td>{row.note}</td></tr>)}</tbody><tfoot><tr><th colSpan={2}>총계</th><td>{statement.hours}</td><td>{statement.weeklyTotals.map((total) => `${total.isoWeekKey.replace(/^\d{4}-W/, "")}주차 ${total.hours}시간`).join(" · ")}</td></tr><tr><th colSpan={2}>금액</th><td colSpan={2}>{statement.amount.toLocaleString("ko-KR")}원</td></tr></tfoot></table>
      <div className="payment-statement-preview__weekly" aria-label="Weekly payment statement totals">{statement.weeklyTotals.map((total) => <span key={total.isoWeekKey}>{total.isoWeekKey.replace(/^\d{4}-W/, "")}주차 {total.hours}시간</span>)}</div>
    </>}
  </section>;
}
