"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createReportAction, type ReportActionState } from "@/app/(app)/support/reports/actions";
import { REPORT_STATUS_LABELS, REPORT_TYPES, REPORT_TYPE_LABELS, type ReportType, type UserReport } from "@/lib/reports/model";

const initialState: ReportActionState = { status: "idle" };
function isReportTypeValue(value: string): value is ReportType { return REPORT_TYPES.some((type) => type === value); }

export function ReportCenter({ reports, appVersion }: { readonly reports: readonly UserReport[]; readonly appVersion: string }) {
  const [open, setOpen] = useState(false);
  return <section className="report-center"><div className="report-center__toolbar"><p>오류나 사용 중 궁금한 점을 BOGUNON 안에서 바로 알려주세요.</p><button className="button button--primary" onClick={() => setOpen(true)} type="button">새 신고 작성</button></div>{open && <ReportForm appVersion={appVersion} onClose={() => setOpen(false)} />}{reports.length === 0 ? <div className="report-empty"><strong>아직 제출한 신고가 없습니다.</strong><p>문제가 생기면 새 신고 작성으로 알려주세요.</p></div> : <div className="report-list">{reports.map((report) => <article className="report-card" key={report.id}><div><span className="report-card__type">{REPORT_TYPE_LABELS[report.reportType]}</span><strong>{report.title}</strong><small>{REPORT_STATUS_LABELS[report.status]} · {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(report.createdAt))}</small></div><details><summary>상세 보기</summary><div className="report-card__detail"><p>{report.description}</p>{report.attemptedAction && <p><b>하려고 했던 작업</b>{report.attemptedAction}</p>}{report.observedResult && <p><b>발생한 현상</b>{report.observedResult}</p>}</div></details></article>)}</div>}</section>;
}

function ReportForm({ appVersion, onClose }: { readonly appVersion: string; readonly onClose: () => void }) {
  const [reportType, setReportType] = useState<ReportType>("bug");
  const [state, action, pending] = useActionState(createReportAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") { formRef.current?.reset(); onClose(); } }, [onClose, state.status]);
  const pagePathRef = useRef<HTMLInputElement>(null);
  const userAgentRef = useRef<HTMLInputElement>(null);
  const viewportWidthRef = useRef<HTMLInputElement>(null);
  const viewportHeightRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (pagePathRef.current) pagePathRef.current.value = window.location.pathname;
    if (userAgentRef.current) userAgentRef.current.value = navigator.userAgent.slice(0, 512);
    if (viewportWidthRef.current) viewportWidthRef.current.value = String(window.innerWidth);
    if (viewportHeightRef.current) viewportHeightRef.current.value = String(window.innerHeight);
  }, []);
  return <form action={action} className="report-form" ref={formRef}><div className="report-form__heading"><h2>새 신고 작성</h2><button aria-label="신고 작성 닫기" className="icon-button" onClick={onClose} type="button">×</button></div><label>유형<select name="reportType" onChange={(event) => { if (isReportTypeValue(event.target.value)) setReportType(event.target.value); }} value={reportType}>{REPORT_TYPES.map((type) => <option key={type} value={type}>{REPORT_TYPE_LABELS[type]}</option>)}</select></label><label>제목<input maxLength={160} name="title" required /></label><label>내용<span className="form-hint">어떤 작업을 하던 중 문제가 발생했는지 알려주세요.</span><textarea maxLength={10000} name="description" required rows={5} /></label>{reportType === "bug" && <fieldset><legend>발생 상황</legend><label>하려고 했던 작업<textarea maxLength={5000} name="attemptedAction" rows={3} /></label><label>실제로 발생한 현상<textarea maxLength={5000} name="observedResult" rows={3} /></label><label>다시 시도해도 발생하나요?<select defaultValue="unknown" name="reproducible"><option value="yes">예</option><option value="no">아니요</option><option value="unknown">확인하지 못함</option></select></label></fieldset>}<input name="pagePath" ref={pagePathRef} type="hidden" value="/" readOnly /><input name="appVersion" type="hidden" value={appVersion} /><input name="userAgent" ref={userAgentRef} type="hidden" value="" readOnly /><input name="viewportWidth" ref={viewportWidthRef} type="hidden" value="" readOnly /><input name="viewportHeight" ref={viewportHeightRef} type="hidden" value="" readOnly />{state.message && <p className={state.status === "error" ? "form-message is-error" : "form-message"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}<div className="report-form__actions"><button className="button button--primary" disabled={pending} type="submit">{pending ? "접수 중..." : "신고 접수"}</button><button className="button button--secondary" onClick={onClose} type="button">취소</button></div><p className="report-form__privacy">개인정보 보호를 위해 페이지 경로와 기본 기기 정보만 자동으로 포함합니다. 화면 입력 내용이나 파일은 수집하지 않습니다.</p></form>;
}
