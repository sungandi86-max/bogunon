"use client";
import { Megaphone } from "lucide-react";
import { useState, useTransition } from "react";
import type { Notice } from "@/lib/notices/model";
import { markNoticeReadAction } from "@/app/(app)/notices/actions";
import { NOTICE_CATEGORY_LABELS, noticeSummary } from "@/lib/notices/model";

export function NoticeList({ notices }: { readonly notices: readonly Notice[] }) {
  if (!notices.length) return <section className="notice-empty"><Megaphone aria-hidden="true" /><h2>등록된 공지가 없습니다.</h2><p>새 소식이 게시되면 이곳에서 확인할 수 있습니다.</p></section>;
  return <div className="notice-list">{notices.map((notice) => <NoticeItem key={notice.id} notice={notice} />)}</div>;
}

function NoticeItem({ notice }: { readonly notice: Notice }) { const [read, setRead] = useState(notice.isRead); const [pending, startTransition] = useTransition(); const openDetail = () => { if (read || pending) return; setRead(true); const data = new FormData(); data.set("id", notice.id); startTransition(async () => { try { await markNoticeReadAction(data); } catch { setRead(false); } }); }; return <details className={`notice-item${notice.isImportant ? " notice-item--important" : ""}${read ? " notice-item--read" : ""}`} onToggle={(event) => { if (event.currentTarget.open) openDetail(); }}><summary aria-label={`${notice.title} 공지 상세 열기`}><span><small>{NOTICE_CATEGORY_LABELS[notice.category]}{notice.isImportant ? " · 중요 공지" : ""}</small><strong>{notice.title}</strong><em>{noticeSummary(notice)}</em></span>{!read && <b>NEW</b>}</summary><p>{notice.content}</p><footer><time dateTime={notice.publishStartAt ?? notice.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(notice.publishStartAt ?? notice.createdAt))}</time>{pending && <span>읽음 처리 중…</span>}</footer></details>; }
