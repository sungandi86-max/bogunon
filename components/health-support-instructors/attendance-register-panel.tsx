import { Button } from "@/components/ui/button";
import type { HealthSupportSettlementDocuments } from "@/lib/health-support-instructors/settlement/documents";
import { HEALTH_SUPPORT_STAMP_ASSETS } from "@/lib/health-support-instructors/stamp-assets";

type AttendanceRegisterPanelProps = {
  readonly documents: HealthSupportSettlementDocuments;
  readonly onPrint: () => void;
  readonly onTogglePreview: () => void;
  readonly printActive: boolean;
  readonly showPreview: boolean;
  readonly verifierName: string;
  readonly onVerifierNameChange: (name: string) => void;
  readonly onConfirmerNameBlur: () => void;
  readonly confirmerSaveMessage?: string | undefined;
  readonly includeElectronicStamps: boolean;
  readonly onElectronicStampsChange: (include: boolean) => void;
};

export function AttendanceRegisterPanel({ confirmerSaveMessage, documents, onConfirmerNameBlur, onPrint, onTogglePreview, printActive, showPreview, verifierName, onVerifierNameChange, includeElectronicStamps, onElectronicStampsChange }: AttendanceRegisterPanelProps) {
  const register = documents.attendanceRegister;
  const hasRows = register.rows.length > 0;
  return <section aria-label="Attendance register document" className="health-support-document health-support-document--attendance-register">
    <div className="health-support-document__heading"><h3>출근관리부</h3><label>확인자 이름<input aria-label="Attendance register verifier" onBlur={onConfirmerNameBlur} onChange={(event) => onVerifierNameChange(event.target.value)} placeholder="선택 입력" type="text" value={verifierName} />{confirmerSaveMessage && <span className="form-message" role="status">{confirmerSaveMessage}</span>}</label></div>
    <div className="health-support-document__actions"><label className="attendance-register__stamp-option"><input aria-label="전자도장 포함" checked={includeElectronicStamps} onChange={(event) => onElectronicStampsChange(event.target.checked)} type="checkbox" />전자도장 포함</label><Button aria-label="Preview attendance register" disabled={!hasRows} onClick={onTogglePreview} variant="secondary">출근관리부 미리보기</Button><Button aria-label="Print attendance register" disabled={!hasRows} onClick={onPrint} variant="secondary">출근관리부 출력</Button></div>
    {!hasRows && <p role="status">해당 월의 근무기록이 없습니다.</p>}
    {(showPreview || printActive) && hasRows && <AttendanceRegisterPreview documents={documents} includeElectronicStamps={includeElectronicStamps} verifierName={verifierName} />}
  </section>;
}

function AttendanceRegisterPreview({ documents, includeElectronicStamps, verifierName }: { readonly documents: HealthSupportSettlementDocuments; readonly includeElectronicStamps: boolean; readonly verifierName: string }) {
  const register = documents.attendanceRegister;
  return <section aria-labelledby="attendance-register-preview-title" className="attendance-register-preview">
    <h2 id="attendance-register-preview-title">{register.title}</h2>
    <div className="attendance-register-preview__meta"><span>분야: {register.field}</span><span>성명: {register.instructorName}</span><span>근무기간: {register.operationPeriod}</span><span>근무일수: 총({register.workDays})일</span></div>
    <table aria-label="Attendance register table"><thead><tr><th>날짜</th><th>요일</th><th>시작시간</th><th>종료시간</th><th>서명</th><th>보건교사 확인</th></tr></thead><tbody>{register.rows.map((row) => <tr key={`${row.date}-${row.startTime}`}><td>{row.date.slice(0, 10)}</td><td>{row.weekday}</td><td>{row.startTime}</td><td>{row.endTime}</td><td aria-label={includeElectronicStamps ? "전자도장이 포함된 서명" : "서명 빈칸"}>{includeElectronicStamps ? <img alt={HEALTH_SUPPORT_STAMP_ASSETS.instructor.alt} className="attendance-register-preview__stamp attendance-register-preview__stamp--instructor" src={HEALTH_SUPPORT_STAMP_ASSETS.instructor.src} /> : row.signature}</td><td aria-label={includeElectronicStamps ? "전자도장이 포함된 보건교사 확인" : "보건교사 확인 빈칸"}>{includeElectronicStamps ? <img alt={HEALTH_SUPPORT_STAMP_ASSETS.verifier.alt} className="attendance-register-preview__stamp attendance-register-preview__stamp--teacher" src={HEALTH_SUPPORT_STAMP_ASSETS.verifier.src} /> : row.teacherConfirmation}</td></tr>)}</tbody></table>
    <p className="attendance-register-preview__verifier">확인자: {verifierName || (includeElectronicStamps ? "박숙현" : "________________")} <span className="attendance-register-preview__verifier-signature">{includeElectronicStamps && <img alt={HEALTH_SUPPORT_STAMP_ASSETS.verifier.alt} className="attendance-register-preview__stamp attendance-register-preview__stamp--verifier" src={HEALTH_SUPPORT_STAMP_ASSETS.verifier.src} />}({includeElectronicStamps ? "서명/인" : "서명"})</span></p>
  </section>;
}
