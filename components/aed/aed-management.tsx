"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { deleteAedDeviceAction, saveAedDeviceAction, type AedActionState } from "@/app/(app)/aed/actions";
import { Button } from "@/components/ui/button";
import { getAedStatus, nextInspectionDateFrom, aedStatusLabels, type AedDeviceInput } from "@/lib/aed/domain";
import type { AedDevice } from "@/lib/aed/repository";

const initialState: AedActionState = { status: "idle" };

function dateLabel(value: string | null): string {
  return value ? value.replaceAll("-", ".") : "미입력";
}

function emptyDraft(): AedDeviceInput {
  return { name: "", location: "", batteryExpiryDate: null, padExpiryDate: null, lastInspectionDate: null, nextInspectionDate: null, inspectionIntervalMonths: 0, note: "", sortOrder: 0 };
}

function draftFrom(device: AedDevice): AedDeviceInput {
  return { id: device.id, name: device.name, location: device.location, batteryExpiryDate: device.batteryExpiryDate, padExpiryDate: device.padExpiryDate, lastInspectionDate: device.lastInspectionDate, nextInspectionDate: device.nextInspectionDate, inspectionIntervalMonths: device.inspectionIntervalMonths, note: device.note, sortOrder: device.sortOrder };
}

export function AedManagement({ devices, today }: { readonly devices: readonly AedDevice[]; readonly today: string }) {
  const [editing, setEditing] = useState<AedDeviceInput | null>(null);
  const [state, action, pending] = useActionState(saveAedDeviceAction, initialState);
  const sortedDevices = [...devices].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "ko"));
  return <main className="page-canvas aed-page"><header className="page-header"><div><p>AED 점검 관리</p><h1>학교 AED를 한눈에 관리하세요.</h1></div><Button onClick={() => setEditing(emptyDraft())}><Plus aria-hidden="true" size={16} />AED 추가</Button></header><div className="aed-page__content">{sortedDevices.length === 0 ? <section className="aed-empty" aria-labelledby="aed-empty-title"><h2 id="aed-empty-title">등록된 AED가 없습니다.</h2><p>학교 AED를 등록하고 점검일과 소모품 만료일을 관리해보세요.</p><Button onClick={() => setEditing(emptyDraft())}><Plus aria-hidden="true" size={16} />첫 AED 등록</Button></section> : <div className="aed-device-list">{sortedDevices.map((device) => <AedDeviceCard device={device} key={device.id} onEdit={() => setEditing(draftFrom(device))} onDelete={() => { const formData = new FormData(); formData.set("id", device.id); void deleteAedDeviceAction(formData); }} onComplete={() => setEditing({ ...draftFrom(device), lastInspectionDate: today, nextInspectionDate: nextInspectionDateFrom(today, device.inspectionIntervalMonths) ?? device.nextInspectionDate })} today={today} />)}</div>}{editing && <AedEditor draft={editing} onClose={() => setEditing(null)} action={action} pending={pending} state={state} />}</div></main>;
}

function AedDeviceCard({ device, onDelete, onEdit, onComplete, today }: { readonly device: AedDevice; readonly onDelete: () => void; readonly onEdit: () => void; readonly onComplete: () => void; readonly today: string }) {
  const status = getAedStatus(device, today);
  return <article className={`aed-device-card aed-device-card--${status}`}><div className="aed-device-card__heading"><div><span className="aed-status">{aedStatusLabels[status]}</span><h2>{device.name}</h2><p>{device.location}</p></div><div className="aed-device-card__actions"><Button aria-label={`${device.name} 수정`} onClick={onEdit} variant="ghost"><Pencil aria-hidden="true" size={15} />수정</Button><Button aria-label={`${device.name} 삭제`} onClick={onDelete} variant="ghost"><Trash2 aria-hidden="true" size={15} />삭제</Button></div></div><dl className="aed-device-card__details"><div><dt>배터리 만료</dt><dd>{dateLabel(device.batteryExpiryDate)}</dd></div><div><dt>패드 만료</dt><dd>{dateLabel(device.padExpiryDate)}</dd></div><div><dt>최근 점검</dt><dd>{dateLabel(device.lastInspectionDate)}</dd></div><div><dt>다음 점검</dt><dd>{dateLabel(device.nextInspectionDate)}</dd></div></dl>{device.note && <p className="aed-device-card__note">{device.note}</p>}<Button onClick={onComplete} variant="secondary">점검 완료</Button></article>;
}

function AedEditor({ action, draft, onClose, pending, state }: { readonly action: (formData: FormData) => void; readonly draft: AedDeviceInput; readonly onClose: () => void; readonly pending: boolean; readonly state: AedActionState }) {
  return <section className="aed-editor" aria-labelledby="aed-editor-title"><div className="aed-editor__heading"><div><p>AED 정보</p><h2 id="aed-editor-title">{draft.id ? "AED 수정" : "AED 추가"}</h2></div><Button onClick={onClose} variant="ghost">닫기</Button></div><form action={action} className="aed-editor__form"><input name="id" type="hidden" value={draft.id ?? ""} /><input name="sortOrder" type="hidden" value={draft.sortOrder ?? 0} /><label>AED 이름 또는 별칭<input defaultValue={draft.name} name="name" required /></label><label>설치 위치<input defaultValue={draft.location} name="location" required /></label><label>배터리 만료일<input defaultValue={draft.batteryExpiryDate ?? ""} name="batteryExpiryDate" type="date" /></label><label>패드 만료일<input defaultValue={draft.padExpiryDate ?? ""} name="padExpiryDate" type="date" /></label><label>최근 점검일<input defaultValue={draft.lastInspectionDate ?? ""} name="lastInspectionDate" type="date" /></label><label>다음 점검 예정일<input defaultValue={draft.nextInspectionDate ?? ""} name="nextInspectionDate" type="date" /></label><label>점검 주기(개월)<input defaultValue={draft.inspectionIntervalMonths} min="0" name="inspectionIntervalMonths" type="number" /></label><label className="aed-editor__wide">비고<textarea defaultValue={draft.note ?? ""} name="note" rows={3} /></label>{state.message && <p className={state.status === "error" ? "form-message is-error" : "form-message"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}<div className="aed-editor__actions"><Button disabled={pending} type="submit">{pending ? "저장 중..." : "저장"}</Button><Button onClick={onClose} type="button" variant="secondary">취소</Button></div></form></section>;
}
