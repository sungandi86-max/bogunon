"use client";

import { ShieldCheck } from "lucide-react";
import type { RefObject } from "react";

interface CreateItemFormProps {
  readonly titleRef: RefObject<HTMLInputElement | null>;
}

const areas = [
  ["health", "보건업무"],
  ["school", "학교일정"],
  ["exercise", "운동"],
  ["personal", "개인"],
  ["project", "프로젝트 업무"],
] as const;

export function CreateItemForm({ titleRef }: CreateItemFormProps) {
  return (
    <form>
      <fieldset className="create-type-options">
        <legend>영역</legend>
        <div className="type-grid">
          {areas.map(([value, label], index) => (
            <label className="type-option" key={value}>
              <input defaultChecked={index === 0} name="area" type="radio" value={value} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label className="field-label" htmlFor="create-kind">항목 종류</label>
        <select defaultValue="task" id="create-kind">
          <option value="task">할 일</option>
          <option value="event">일정</option>
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="create-title">제목</label>
        <input id="create-title" placeholder="업무 또는 일정 제목" ref={titleRef} type="text" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="create-date">수행일</label>
        <input id="create-date" type="date" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="create-memo">메모</label>
        <textarea id="create-memo" placeholder="비식별 업무 상태만 기록하세요." />
      </div>
      <div className="privacy-notice">
        <ShieldCheck aria-hidden="true" size={17} />
        <span>학생 이름, 학번, 질병명, 상담 내용 등 개인 건강정보를 입력하지 마세요. 업무 상태와 비식별 수량만 기록해 주세요.</span>
      </div>
      <p className="static-note" id="phase-one-save-note">현재 화면은 정적 UI이며 데이터는 저장되지 않습니다.</p>
    </form>
  );
}
