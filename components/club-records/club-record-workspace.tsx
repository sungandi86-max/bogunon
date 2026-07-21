"use client";

import { CheckCircle2, Clipboard, FileCheck2, RefreshCw, Search, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

const students = [
  { id: "1-1-kim", grade: "1", className: "1", name: "김민서" },
  { id: "1-1-lee", grade: "1", className: "1", name: "이도윤" },
  { id: "1-2-park", grade: "1", className: "2", name: "박서연" },
  { id: "2-1-jeong", grade: "2", className: "1", name: "정하준" },
  { id: "2-2-choi", grade: "2", className: "2", name: "최유진" },
] as const;

const sampleDraft = "동아리 활동에 꾸준히 참여하며 맡은 역할을 책임감 있게 수행함. 활동 과정에서 구성원과 원활하게 소통하고 필요한 준비를 주도적으로 지원했으며, 경험을 바탕으로 자신의 역할과 배운 점을 구체적으로 성찰함.";

export function ClubRecordWorkspace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [grade, setGrade] = useState("all");
  const [className, setClassName] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>();
  const [studentReport, setStudentReport] = useState("");
  const [teacherFacts, setTeacherFacts] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredStudents = useMemo(() => students.filter((student) => {
    const matchesSearch = student.name.includes(searchQuery.trim());
    const matchesGrade = grade === "all" || student.grade === grade;
    const matchesClass = className === "all" || student.className === className;
    return matchesSearch && matchesGrade && matchesClass;
  }), [className, grade, searchQuery]);
  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const byteCount = new TextEncoder().encode(draft).length;

  function selectStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setStudentReport("");
    setTeacherFacts("");
    setDraft("");
    setCopied(false);
  }

  function generateDraft() {
    setDraft(sampleDraft);
    setCopied(false);
  }

  async function copyDraft() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
  }

  return (
    <section aria-label="동아리 학생기록 작성 작업공간" className="club-record-workspace">
      <aside className="club-record-card club-record-students" aria-labelledby="club-student-list-title">
        <div className="club-record-card__heading">
          <span className="club-record-card__icon"><Users aria-hidden="true" size={18} /></span>
          <div><h2 id="club-student-list-title">학생 목록</h2><p>작성할 학생을 선택하세요.</p></div>
        </div>
        <label className="club-record-search">
          <span className="sr-only">학생 검색</span>
          <Search aria-hidden="true" size={16} />
          <input onChange={(event) => setSearchQuery(event.target.value)} placeholder="학생 이름 검색" type="search" value={searchQuery} />
        </label>
        <div className="club-record-filters">
          <label><span>학년</span><select onChange={(event) => setGrade(event.target.value)} value={grade}><option value="all">전체</option><option value="1">1학년</option><option value="2">2학년</option></select></label>
          <label><span>반</span><select onChange={(event) => setClassName(event.target.value)} value={className}><option value="all">전체</option><option value="1">1반</option><option value="2">2반</option></select></label>
        </div>
        <div className="club-student-list">
          {filteredStudents.map((student) => (
            <button aria-pressed={selectedStudentId === student.id} key={student.id} onClick={() => selectStudent(student.id)} type="button">
              <span>{student.name.slice(0, 1)}</span>
              <span><strong>{student.name}</strong><small>{student.grade}학년 {student.className}반</small></span>
              {selectedStudentId === student.id && <CheckCircle2 aria-hidden="true" size={17} />}
            </button>
          ))}
          {filteredStudents.length === 0 && <p className="club-record-list-empty">조건에 맞는 학생이 없습니다.</p>}
        </div>
      </aside>

      <div className="club-record-column" aria-disabled={!selectedStudent}>
        <div className="club-record-column__student"><span>입력 자료</span><strong>{selectedStudent?.name ?? "학생 미선택"}</strong></div>
        <article className="club-record-card club-record-input-card">
          <div className="club-record-card__heading"><div><h2>학생 활동보고서</h2><p>학생이 제출한 내용을 원문 그대로 입력합니다.</p></div></div>
          <textarea disabled={!selectedStudent} onChange={(event) => setStudentReport(event.target.value)} placeholder="학생이 작성한 활동 내용, 맡은 역할, 느낀 점과 배운 점 등을 붙여넣으세요." value={studentReport} />
        </article>
        <article className="club-record-card club-record-input-card">
          <div className="club-record-card__heading"><div><h2>교사 추가 사실</h2><p>평가나 추측보다 확인된 사실 위주로 입력합니다.</p></div></div>
          <textarea disabled={!selectedStudent} onChange={(event) => setTeacherFacts(event.target.value)} placeholder="예: 동아리 부장, 축제 부스 운영, 후배 활동 지원, 준비물 관리 등" value={teacherFacts} />
        </article>
        <article className="club-record-card club-record-reference-card">
          <div className="club-record-card__heading"><div><h2>참고 자료</h2><p>초안 작성 시 반영할 기준입니다.</p></div></div>
          <ul>
            <li><FileCheck2 aria-hidden="true" size={16} /><span>동아리 운영계획</span><small>확인 준비</small></li>
            <li><FileCheck2 aria-hidden="true" size={16} /><span>학교생활기록부 작성 지침</span><small>확인 준비</small></li>
            <li><CheckCircle2 aria-hidden="true" size={16} /><span>작성 기준 1500바이트</span><small>적용</small></li>
          </ul>
        </article>
      </div>

      <div className="club-record-column" aria-disabled={!selectedStudent}>
        <div className="club-record-column__student"><span>AI 작성 결과</span><strong>{selectedStudent?.name ?? "학생 미선택"}</strong></div>
        <article className="club-record-card club-record-result-card">
          <div className="club-record-card__heading">
            <span className="club-record-card__icon"><Sparkles aria-hidden="true" size={18} /></span>
            <div><h2>생활기록부 초안</h2><p>{selectedStudent ? `${selectedStudent.name} 학생의 동아리 활동 문장` : "좌측에서 학생을 선택하세요."}</p></div>
          </div>
          <textarea
            aria-label="생활기록부 초안"
            disabled={!selectedStudent}
            onChange={(event) => { setDraft(event.target.value); setCopied(false); }}
            placeholder="학생 활동보고서와 교사 추가 사실을 입력한 뒤 AI 초안 생성을 실행하세요."
            value={draft}
          />
          <div className="club-record-result-meta"><span>현재 바이트 수</span><strong>{byteCount.toLocaleString()} / 1,500</strong></div>
          <div className="club-record-result-actions">
            <Button disabled={!selectedStudent} onClick={generateDraft}><Sparkles aria-hidden="true" size={16} />AI 초안 생성</Button>
            <Button disabled={!selectedStudent} onClick={generateDraft} variant="secondary"><RefreshCw aria-hidden="true" size={16} />다시 생성</Button>
            <Button disabled={!draft} onClick={copyDraft} variant="secondary"><Clipboard aria-hidden="true" size={16} />{copied ? "복사됨" : "복사"}</Button>
          </div>
        </article>
      </div>
    </section>
  );
}
