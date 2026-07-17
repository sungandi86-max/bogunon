"use client";

import { AlertTriangle, Check, LoaderCircle, Send, ShieldCheck, Sparkles, Square } from "lucide-react";
import type { RefObject } from "react";
import { useRef, useState } from "react";

import type { AssistantSurface } from "@/components/ai/assistant-context";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { Button } from "@/components/ui/button";
import { inspectStructuredPrivacy } from "@/lib/ai/privacy";

export type AssistantDraft = Record<string, unknown> & { readonly action: string };

interface AiAssistantPanelProps {
  readonly entityId?: string;
  readonly onClose: () => void;
  readonly onCreateDraft: (draft: AssistantDraft, draftId?: string) => void;
  readonly onApplied?: () => void;
  readonly open: boolean;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
  readonly surface?: AssistantSurface;
}

const examples = [
  "다음 주 월요일 결핵검진 안내 업무 만들어줘",
  "오늘 우선순위 높은 업무만 정리해줘",
  "이 업무 체크리스트 초안 만들어줘",
  "9월 학생건강검진 Workflow 초안 만들어줘",
] as const;

function messageFromPayload(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object" || !("error" in payload) || typeof payload.error !== "string") return fallback;
  return payload.error;
}

function actionLabel(action: string) {
  return ({
    create_task: "업무 초안",
    create_event: "일정 초안",
    create_workflow: "Workflow 시작 초안",
    create_checklist: "체크리스트 초안",
    create_workflow_template: "Workflow 템플릿 초안",
    summarize_today: "오늘 요약",
    summarize_period: "기간 요약",
    recommend_priority: "우선순위 추천",
    find_similar_work: "유사 업무 추천",
    duplicate_previous_work: "지난 업무 재사용 초안",
  } as Record<string, string>)[action] ?? "AI 초안";
}

export function AiAssistantPanel({ entityId, onApplied, onClose, onCreateDraft, open, returnFocusRef, surface = "global" }: AiAssistantPanelProps) {
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<AssistantDraft | null>(null);
  const [draftText, setDraftText] = useState("");
  const [mode, setMode] = useState<"mock" | "openai" | null>(null);
  const [draftId, setDraftId] = useState<string>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saveHistory, setSaveHistory] = useState(false);
  const [warnings, setWarnings] = useState<readonly string[]>([]);
  const [recentRequests, setRecentRequests] = useState<readonly string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  async function requestDraft() {
    if (!input.trim() || pending) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(true);
    setError("");
    setDraft(null);
    setDraftId(undefined);
    setWarnings([]);
    setConfirmed(false);
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: input.trim(), context: { surface, ...(entityId ? { entityId } : {}) }, saveHistory }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(messageFromPayload(payload, "AI 초안을 만들지 못했습니다."));
      if (!payload || typeof payload !== "object" || !("action" in payload) || !payload.action || typeof payload.action !== "object" || !("action" in payload.action) || typeof payload.action.action !== "string") {
        throw new Error("AI 응답 형식을 확인하지 못했습니다.");
      }
      const nextDraft = payload.action as AssistantDraft;
      setDraft(nextDraft);
      setDraftText(JSON.stringify(nextDraft, null, 2));
      setMode("mode" in payload && payload.mode === "openai" ? "openai" : "mock");
      setDraftId("draftId" in payload && typeof payload.draftId === "string" ? payload.draftId : undefined);
      setWarnings("warnings" in payload && Array.isArray(payload.warnings) ? payload.warnings.filter((item): item is string => typeof item === "string") : []);
      setRecentRequests((items) => [input.trim(), ...items.filter((item) => item !== input.trim())].slice(0, 4));
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setError(requestError instanceof Error ? requestError.message : "AI 요청 중 오류가 발생했습니다.");
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      setPending(false);
    }
  }

  function updateDraft(value: string) {
    setDraftText(value);
    setError("");
    try {
      const parsed: unknown = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || !("action" in parsed) || typeof parsed.action !== "string") throw new Error();
      setDraft(parsed as AssistantDraft);
    } catch {
      setDraft(null);
      setError("수정한 초안의 JSON 형식을 확인해 주세요.");
    }
  }

  async function confirmDraft() {
    if (!draft) return;
    const privacy = inspectStructuredPrivacy(draft);
    if (!privacy.allowed) {
      setError(`학생 개인정보와 건강 민감정보를 제거해 주세요. (${privacy.warnings.join(", ")})`);
      return;
    }
    if (draft.action === "create_task" || draft.action === "create_event") {
      onCreateDraft(draft, draftId);
      return;
    }
    if (["create_workflow", "create_checklist", "create_workflow_template", "duplicate_previous_work", "recommend_priority"].includes(draft.action)) {
      setPending(true);
      setError("");
      try {
        const query = draftId ? `?draftId=${encodeURIComponent(draftId)}` : "";
        const response = await fetch(`/api/ai/apply${query}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(messageFromPayload(payload, "AI 초안을 적용하지 못했습니다."));
        setConfirmed(true);
        onApplied?.();
      } catch (applyError) {
        setError(applyError instanceof Error ? applyError.message : "AI 초안을 적용하지 못했습니다.");
      } finally {
        setPending(false);
      }
      return;
    }
    setConfirmed(true);
  }

  async function clearHistory() {
    setError("");
    try {
      const response = await fetch("/api/ai/history", { method: "DELETE" });
      if (!response.ok) {
        const payload: unknown = await response.json();
        setError(messageFromPayload(payload, "저장된 AI 요청 기록을 삭제하지 못했습니다."));
        return;
      }
      setRecentRequests([]);
      setSaveHistory(false);
    } catch {
      setError("저장된 AI 요청 기록을 삭제하지 못했습니다.");
    }
  }

  const createsWorkItem = draft?.action === "create_task" || draft?.action === "create_event";
  const appliesDraft = ["create_workflow", "create_checklist", "create_workflow_template", "duplicate_previous_work", "recommend_priority"].includes(draft?.action ?? "");
  return <ResponsiveDetailPanel initialFocusRef={inputRef} onClose={onClose} open={open} {...(returnFocusRef ? { returnFocusRef } : {})} title="AI 업무 도우미">
    <div className="ai-assistant">
      <div className="ai-privacy-notice"><ShieldCheck aria-hidden="true" size={18} /><div><strong>학생 개인정보와 건강 민감정보는 입력하지 마세요.</strong><span>전송 전 민감 패턴을 검사하며, 현재 요청에 필요한 최소 업무 데이터만 사용합니다.</span></div></div>
      <div className="field"><label className="field-label" htmlFor="ai-assistant-input">AI 요청</label><textarea id="ai-assistant-input" maxLength={1200} onChange={(event) => setInput(event.target.value)} placeholder="업무 생성, 요약 또는 추천을 요청하세요." ref={inputRef} rows={draft ? 3 : 4} value={input} /></div>
      {!draft && <div className="ai-examples" aria-label="요청 예시">{examples.map((example) => <button key={example} onClick={() => setInput(example)} type="button">{example}</button>)}</div>}
      {!draft && recentRequests.length > 0 && <div className="ai-recent"><div><strong>최근 요청</strong>{saveHistory && <button onClick={clearHistory} type="button">저장 기록 삭제</button>}</div>{recentRequests.map((request) => <button key={request} onClick={() => setInput(request)} type="button">{request}</button>)}</div>}
      <label className="checkbox-field"><input checked={saveHistory} onChange={(event) => setSaveHistory(event.target.checked)} type="checkbox" />요청 기록 저장 <small>기본값: 저장 안 함</small></label>
      <div className="ai-request-actions">
        {pending ? <Button onClick={() => requestRef.current?.abort()} variant="secondary"><Square aria-hidden="true" size={14} />요청 취소</Button> : <Button disabled={!input.trim()} onClick={requestDraft}><Send aria-hidden="true" size={16} />초안 만들기</Button>}
        {pending && <span className="ai-loading" role="status"><LoaderCircle aria-hidden="true" size={16} />최소 데이터를 선별하고 있습니다.</span>}
      </div>
      {error && <p className="ai-error" role="alert"><AlertTriangle aria-hidden="true" size={16} />{error}</p>}
      {warnings.length > 0 && <ul className="ai-warnings" aria-label="AI 요청 안내">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
      {draft && <section className="ai-preview" aria-labelledby="ai-preview-title"><header><div><span><Sparkles aria-hidden="true" size={15} />{mode === "openai" ? "AI 제안" : "규칙 기반 제안"}</span><h3 id="ai-preview-title">구조화된 미리보기</h3></div><strong>{actionLabel(draft.action)}</strong></header><p>저장 전에 내용을 수정하고 확인하세요. 이 단계에서는 DB가 변경되지 않습니다.</p><textarea aria-label="AI 구조화 초안" onChange={(event) => updateDraft(event.target.value)} rows={14} spellCheck={false} value={draftText} /><div className="ai-preview__actions"><Button onClick={() => { setDraft(null); setDraftText(""); }} variant="secondary">초안 취소</Button><Button disabled={!draft || pending} onClick={confirmDraft}><Check aria-hidden="true" size={16} />{createsWorkItem ? "생성 폼에서 확인" : appliesDraft ? "확인 후 적용" : "제안 확인"}</Button></div></section>}
      {confirmed && <p className="ai-confirmed" role="status"><Check aria-hidden="true" size={16} />{appliesDraft ? "확인한 초안을 기존 원자적 저장 경로로 적용했습니다." : "제안을 확인했습니다. 데이터 기반 사실과 AI 추천을 구분해 검토하세요."}</p>}
    </div>
  </ResponsiveDetailPanel>;
}
