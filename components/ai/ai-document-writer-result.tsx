"use client";

import {
  AlertTriangle,
  Check,
  Clipboard,
  Info,
  PencilLine,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { Ref } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiDocumentWriterResult } from "@/lib/ai/document-writer";
import type { SchoolRecordReviewIssue } from "@/lib/ai/school-record-review";

interface AiDocumentWriterResultProps {
  readonly bytes: number;
  readonly characters: number;
  readonly copyMessage: string;
  readonly draft: string;
  readonly hasGuideline: boolean;
  readonly isSubmitting: boolean;
  readonly issues: readonly SchoolRecordReviewIssue[];
  readonly noTeacherMemo: boolean;
  readonly onApply: (issue: SchoolRecordReviewIssue) => void;
  readonly onCopy: () => void;
  readonly onDraftChange: (value: string) => void;
  readonly onEdit: () => void;
  readonly onKeep: (issue: SchoolRecordReviewIssue) => void;
  readonly onRegenerate: () => void;
  readonly result: AiDocumentWriterResult | null;
  readonly resultRef: Ref<HTMLElement>;
}

const LEVEL_LABELS = {
  error: "오류",
  check: "확인 필요",
  suggestion: "개선 제안",
} as const;

export function AiDocumentWriterResultPanel({
  bytes,
  characters,
  copyMessage,
  draft,
  hasGuideline,
  isSubmitting,
  issues,
  noTeacherMemo,
  onApply,
  onCopy,
  onDraftChange,
  onEdit,
  onKeep,
  onRegenerate,
  result,
  resultRef,
}: AiDocumentWriterResultProps) {
  const [activeTab, setActiveTab] = useState<"draft" | "review">("draft");
  if (!result) {
    return (
      <section className="ai-writer-empty" aria-labelledby="ai-writer-empty-title">
        <Sparkles aria-hidden="true" size={28} />
        <div>
          <h2 id="ai-writer-empty-title">작성할 자료를 입력해 주세요</h2>
          <p>왼쪽에 익명화된 활동 자료와 교사 메모를 입력하면 초안과 점검 결과가 표시됩니다.</p>
        </div>
      </section>
    );
  }

  const counts = {
    error: issues.filter(({ level }) => level === "error").length,
    check: issues.filter(({ level }) => level === "check").length,
    suggestion: issues.filter(({ level }) => level === "suggestion").length,
  };
  const exceedsLimit = bytes > 1_500;
  return (
    <section className="ai-writer-result" aria-label="초안 작성 결과" ref={resultRef}>
      <div className="ai-writer-tabs" role="tablist" aria-label="초안 결과 보기">
        <button
          aria-selected={activeTab === "draft"}
          onClick={() => setActiveTab("draft")}
          role="tab"
          type="button"
        >
          생성된 초안
        </button>
        <button
          aria-selected={activeTab === "review"}
          onClick={() => setActiveTab("review")}
          role="tab"
          type="button"
        >
          생기부 기재 점검
          {issues.length > 0 && <span>{issues.length}</span>}
        </button>
      </div>

      {activeTab === "draft" ? (
        <div className="ai-writer-result__panel" role="tabpanel">
          <header>
            <div>
              <Badge tone={result.mode === "mock" ? "neutral" : "success"}>
                {result.mode === "mock" ? "예시 초안" : "AI 초안"}
              </Badge>
              <h2>생성된 초안</h2>
            </div>
            <dl className="ai-writer-result__counts">
              <div><dt>글자 수</dt><dd>{characters.toLocaleString("ko-KR")}자</dd></div>
              <div><dt>UTF-8</dt><dd>{bytes.toLocaleString("ko-KR")}바이트</dd></div>
            </dl>
          </header>
          {result.mode === "mock" && (
            <p className="ai-writer-message">
              현재 AI 연결 없이 예시 초안이 표시됐습니다. 실제 운영에서는 AI 연결 설정을 확인해 주세요.
            </p>
          )}
          <label className="ai-writer-result__editor">
            <span>초안 내용</span>
            <textarea
              aria-label="생성된 초안 편집"
              onChange={(event) => onDraftChange(event.target.value)}
              rows={12}
              spellCheck
              value={draft}
            />
          </label>
          <p
            className={`ai-writer-limit ${exceedsLimit ? "ai-writer-limit--warning" : ""}`}
            role={exceedsLimit ? "alert" : undefined}
          >
            {exceedsLimit
              ? <AlertTriangle aria-hidden="true" size={18} />
              : <Check aria-hidden="true" size={18} />}
            {exceedsLimit
              ? "1500바이트를 초과했습니다. 내용을 줄여주세요."
              : "1500바이트 이내입니다."}
          </p>
          {noTeacherMemo && (
            <p className="ai-writer-message ai-writer-message--notice">
              <AlertTriangle aria-hidden="true" size={18} />
              교사 메모가 없어 학생 제출자료 중심으로 작성된 초안입니다.
              교사가 직접 관찰한 내용을 확인하여 수정하세요.
            </p>
          )}
          {result.insufficiencyNotice && (
            <p className="ai-writer-message ai-writer-message--notice">
              <AlertTriangle aria-hidden="true" size={18} />
              {result.insufficiencyNotice}
            </p>
          )}
          <div className="ai-writer-result__actions">
            <Button onClick={onCopy}>
              <Clipboard aria-hidden="true" size={18} />
              초안 복사
            </Button>
            <Button disabled={isSubmitting} onClick={onRegenerate} variant="secondary">
              <RefreshCw aria-hidden="true" size={18} />
              다시 생성
            </Button>
            <Button onClick={onEdit} variant="ghost">
              <PencilLine aria-hidden="true" size={18} />
              입력으로 돌아가기
            </Button>
          </div>
          {copyMessage && (
            <p
              className={`ai-writer-message ${
                copyMessage === "초안을 복사했습니다."
                  ? "ai-writer-message--success"
                  : "ai-writer-message--error"
              }`}
              role="status"
            >
              {copyMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="ai-writer-result__panel" role="tabpanel">
          <div className="ai-writer-review-summary">
            {(["error", "check", "suggestion"] as const).map((level) => (
              <div key={level}>
                <span>{LEVEL_LABELS[level]}</span>
                <strong>{counts[level]}건</strong>
              </div>
            ))}
          </div>
          {!hasGuideline && (
            <p className="ai-writer-message ai-writer-message--notice">
              <Info aria-hidden="true" size={18} />
              공식 기준자료가 없어 기재요령 기반 판정은 실행하지 않았습니다.
            </p>
          )}
          {issues.length === 0 ? (
            <p className="ai-writer-review-empty">
              현재 자동 점검에서 발견된 항목이 없습니다. 최종 기재 전 교사가 다시 확인해 주세요.
            </p>
          ) : (
            <div className="ai-writer-review-list">
              {issues.map((issue) => (
                <article className="ai-writer-review-item" key={issue.id}>
                  <header>
                    <Badge tone={issue.level === "error" ? "deadline" : "neutral"}>
                      {LEVEL_LABELS[issue.level]}
                    </Badge>
                    <strong>{issue.category}</strong>
                  </header>
                  <dl>
                    <div><dt>발견된 표현</dt><dd>{issue.expression}</dd></div>
                    <div><dt>검토 이유</dt><dd>{issue.reason}</dd></div>
                    <div>
                      <dt>기재요령 근거</dt>
                      <dd>{issue.guidelineBasis ?? "등록된 공식 기준자료에서 근거를 확인하지 못했습니다."}</dd>
                    </div>
                    <div>
                      <dt>수정 제안</dt>
                      <dd>
                        {issue.suggestion === ""
                          ? "해당 표현을 삭제해 주세요."
                          : issue.suggestion ?? "교사가 사실과 근거를 확인해 주세요."}
                      </dd>
                    </div>
                  </dl>
                  <div className="ai-writer-review-item__actions">
                    {issue.suggestion !== null && (
                      <Button onClick={() => onApply(issue)} variant="secondary">제안 적용</Button>
                    )}
                    <Button onClick={() => onKeep(issue)} variant="ghost">그대로 유지</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
