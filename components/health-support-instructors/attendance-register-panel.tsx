import { Button } from "@/components/ui/button";
import type { HealthSupportSettlementDocuments } from "@/lib/health-support-instructors/settlement/documents";

type AttendanceRegisterPanelProps = {
  readonly documents: HealthSupportSettlementDocuments;
  readonly onPrint: () => void;
  readonly onTogglePreview: () => void;
  readonly printActive: boolean;
  readonly showPreview: boolean;
  readonly verifierName: string;
  readonly onVerifierNameChange: (name: string) => void;
};

export function AttendanceRegisterPanel({ documents, onPrint, onTogglePreview, printActive, showPreview, verifierName, onVerifierNameChange }: AttendanceRegisterPanelProps) {
  const register = documents.attendanceRegister;
  const hasRows = register.rows.length > 0;
  return <section aria-label="Attendance register document" className="health-support-document health-support-document--attendance-register">
    <div className="health-support-document__heading"><h3>출근관리부</h3><label>확인자 이름<input aria-label="Attendance register verifier" onChange={(event) => onVerifierNameChange(event.target.value)} placeholder="선택 입력" type="text" value={verifierName} /></label></div>
    <div className="health-support-document__actions"><Button aria-label="Preview attendance register" disabled={!hasRows} onClick={onTogglePreview} variant="secondary">출근관리부 미리보기</Button><Button aria-label="Print attendance register" disabled={!hasRows} onClick={onPrint} variant="secondary">출근관리부 출력</Button></div>
    {!hasRows && <p role="status">해당 월의 근무기록이 없습니다.</p>}
    {(showPreview || printActive) && hasRows && <AttendanceRegisterPreview documents={documents} verifierName={verifierName} />}
  </section>;
}

function AttendanceRegisterPreview({ documents, verifierName }: { readonly documents: HealthSupportSettlementDocuments; readonly verifierName: string }) {
  const register = documents.attendanceRegister;
  return <section aria-labelledby="attendance-register-preview-title" className="attendance-register-preview">
    <h2 id="attendance-register-preview-title">{register.title}</h2>
    <div className="attendance-register-preview__meta"><span>분야: {register.field}</span><span>성명: {register.instructorName}</span><span>근무기간: {register.operationPeriod}</span><span>근무일수: 총({register.workDays})일</span></div>
    <table aria-label="Attendance register table"><thead><tr><th>날짜</th><th>요일</th><th>시작시간</th><th>종료시간</th><th>서명</th><th>보건교사 확인</th></tr></thead><tbody>{register.rows.map((row) => <tr key={`${row.date}-${row.startTime}`}><td>{row.date.slice(0, 10)}</td><td>{row.weekday}</td><td>{row.startTime}</td><td>{row.endTime}</td><td aria-label="서명 빈칸">{row.signature}</td><td aria-label="보건교사 확인 빈칸">{row.teacherConfirmation}</td></tr>)}</tbody></table>
    <p className="attendance-register-preview__verifier">확인자: {verifierName || "________________"} (서명)</p>
  </section>;
}
