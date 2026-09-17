"use client";

import { useActionState, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { deletePracticalToolAction, savePracticalToolAction, type PracticalToolActionState } from "@/app/(app)/practical-tools/actions";
import type { PracticalTool } from "@/lib/practical-tools/repository";
import type { PracticalToolIconKey } from "@/types/database";
import { PracticalToolIcon } from "@/components/practical-tools/practical-tool-icon";

const initialState: PracticalToolActionState = { status: "idle" };
const iconOptions: readonly [PracticalToolIconKey, string][] = [["online_health", "온라인 보건실"], ["spreadsheet", "Google Sheet"], ["drive", "Google Drive"], ["school_system", "학교 업무 시스템"], ["website", "웹사이트"], ["other", "기타"]];
function emptyTool(): PracticalTool { return { id: "", name: "", description: null, url: "https://", icon_key: "website", scope: "personal", owner_id: "", is_active: true, created_at: "", updated_at: "" }; }

export function PracticalToolsManager({ tools }: { readonly tools: readonly PracticalTool[] }) {
  const [editing, setEditing] = useState<PracticalTool | null>(null);
  const [state, action, pending] = useActionState(savePracticalToolAction, initialState);
  const personalTools = tools.filter((tool) => tool.scope === "personal");
  return <section className="practical-tools-manager"><div className="practical-tools-manager__toolbar"><p>실무 일정에서 바로 열어볼 개인 도구를 관리합니다.</p><button className="button button--primary" onClick={() => setEditing(emptyTool())} type="button"><Plus size={16} />내 도구 추가</button></div><div className="practical-tools-manager__list">{personalTools.map((tool) => <article key={tool.id}><div className="practical-tool-card__identity"><PracticalToolIcon iconKey={tool.icon_key} /><div><strong>{tool.name}</strong><small>{tool.description || tool.url}{!tool.is_active && " · 비활성"}</small></div></div><div className="practical-tools-manager__actions">{tool.url.startsWith("/") ? <Link href={tool.url} aria-label={`${tool.name} 열기`}><ExternalLink size={15} /></Link> : <a href={tool.url} rel="noopener noreferrer" target="_blank" aria-label={`${tool.name} 열기`}><ExternalLink size={15} /></a>}<button aria-label={`${tool.name} 수정`} onClick={() => setEditing(tool)} type="button"><Pencil size={15} /></button><form action={deletePracticalToolAction}><input name="id" type="hidden" value={tool.id} /><button aria-label={`${tool.name} 삭제`} type="submit"><Trash2 size={15} /></button></form></div></article>)}{personalTools.length === 0 && <p className="practical-tools-manager__empty">등록된 내 도구가 없습니다.</p>}</div>{editing && <form action={action} className="practical-tools-manager__form"><input name="id" type="hidden" value={editing.id} /><label>도구명<input defaultValue={editing.name} name="name" required /></label><label>URL<input defaultValue={editing.url} name="url" placeholder="https:// 또는 /내부경로" required /></label><label>설명<input defaultValue={editing.description ?? ""} name="description" /></label><label>카테고리<select defaultValue={editing.icon_key} name="iconKey">{iconOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="practical-tools-manager__checkbox"><input defaultChecked={editing.is_active} name="isActive" type="checkbox" />사용</label>{state.message && <p className={state.status === "error" ? "form-message is-error" : "form-message"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}<div><button className="button button--primary" disabled={pending} type="submit">{pending ? "저장 중..." : "저장"}</button><button className="button button--secondary" onClick={() => setEditing(null)} type="button">취소</button></div></form>}</section>;
}
