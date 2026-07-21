"use client";

import { Check, Clipboard, FileText, LockKeyhole, Sparkles, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const studentCodeSchema = z.string().trim().toUpperCase().regex(/^S\d{3}$/, "S001 형식의 익명 코드를 입력해 주세요.");

function draftFrom(studentCode: string, teacherMemo: string): string {
  const evidence = teacherMemo.trim() || "활동 과정에서 맡은 역할과 관찰된 변화를 구체적으로 작성해 주세요.";
  return `${studentCode} 학생은 활동에 성실하게 참여함. ${evidence} 활동 과정과 결과를 스스로 점검하고, 배운 내용을 다음 활동에 적용하려는 태도가 돋보임.`;
}

export function RecordWriterWorkspace() {
  const [studentCode, setStudentCode] = useState("");
  const [teacherMemo, setTeacherMemo] = useState("");
  const [selectedFile, setSelectedFile] = useState<File>();
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const byteCount = useMemo(() => new TextEncoder().encode(draft).length, [draft]);

  function createDraft(): void {
    const result = studentCodeSchema.safeParse(studentCode);
    if (!result.success) {
      setMessage(result.error.issues[0]?.message ?? "학생 코드를 확인해 주세요.");
      return;
    }
    setStudentCode(result.data);
    setDraft(draftFrom(result.data, teacherMemo));
    setMessage("로컬 편집용 초안을 준비했습니다. 내용을 확인하고 수정해 주세요.");
  }

  async function copyDraft(): Promise<void> {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setMessage("초안을 복사했습니다. 나이스 입력 화면에 붙여넣어 주세요.");
  }

  return (
    <section className="record-writer-workspace" aria-label="AI 기록 작성 작업 영역">
      <div className="record-writer-privacy" role="note">
        <LockKeyhole aria-hidden="true" size={20} />
        <div><strong>개인정보를 입력하지 마세요</strong><p>학생 이름·반·번호·학번과 실명 대응표는 입력하거나 업로드하지 않습니다. S001 같은 익명 코드만 사용하세요.</p></div>
      </div>

      <div className="record-writer-grid">
        <section className="record-writer-card" aria-labelledby="record-source-title">
          <div className="record-writer-card__heading"><FileText aria-hidden="true" size={20} /><div><h2 id="record-source-title">작성 자료</h2><p>브라우저 안에서만 임시로 다루며 저장하지 않습니다.</p></div></div>
          <label className="record-writer-field" htmlFor="record-student-code"><span>학생 코드</span><input aria-describedby="student-code-help" aria-label="학생 코드" autoComplete="off" id="record-student-code" inputMode="text" onChange={(event) => setStudentCode(event.target.value.toUpperCase())} placeholder="S001" value={studentCode} /><small id="student-code-help">영문 S와 숫자 3자리만 입력합니다.</small></label>
          <label className="record-writer-upload"><Upload aria-hidden="true" size={22} /><span><strong>활동보고서 파일 선택</strong><small>{selectedFile ? selectedFile.name : "PDF, HWP, HWPX, DOCX 또는 TXT"}</small></span><input accept=".pdf,.hwp,.hwpx,.doc,.docx,.txt" onChange={(event) => setSelectedFile(event.target.files?.[0])} type="file" /></label>
          <label className="record-writer-field" htmlFor="record-teacher-memo"><span>교사 메모</span><textarea aria-label="교사 메모" id="record-teacher-memo" onChange={(event) => setTeacherMemo(event.target.value)} placeholder="관찰한 활동, 역할, 변화, 강점을 실명 없이 적어 주세요." rows={7} value={teacherMemo} /></label>
          <Button className="record-writer-generate" onClick={createDraft}><Sparkles aria-hidden="true" size={17} />AI 초안 생성</Button>
        </section>

        <section className="record-writer-card record-writer-result" aria-labelledby="record-result-title">
          <div className="record-writer-card__heading"><Sparkles aria-hidden="true" size={20} /><div><h2 className="record-writer-result__title" id="record-result-title">생성 결과 <span className="badge badge--neutral">AI 제안</span></h2><p>교사가 사실관계와 표현을 확인한 뒤 사용합니다.</p></div></div>
          <label className="record-writer-field record-writer-draft" htmlFor="record-draft"><span>편집 가능한 초안</span><textarea aria-label="편집 가능한 초안" id="record-draft" onChange={(event) => setDraft(event.target.value)} placeholder="학생 코드와 작성 자료를 입력한 뒤 초안을 생성하세요." rows={16} value={draft} /></label>
          <div className="record-writer-result__footer"><span aria-label={`현재 ${byteCount}바이트`}>{byteCount.toLocaleString("ko-KR")} byte</span><Button disabled={!draft} onClick={copyDraft} variant="secondary"><Clipboard aria-hidden="true" size={17} />복사</Button></div>
          <p aria-live="polite" className="record-writer-message">{message && <><Check aria-hidden="true" size={15} />{message}</>}</p>
        </section>
      </div>
    </section>
  );
}
