"use client";
import type { Notice } from "@/lib/notices/model";
import { NOTICE_CATEGORIES } from "@/lib/notices/model";
import {
  deleteNoticeAction,
  saveNoticeAction,
} from "@/app/(app)/notices/actions";
import { NoticeSubmitButton } from "@/components/notices/submit-button";
import { useMemo, useState } from "react";
import { NOTICE_CATEGORY_LABELS } from "@/lib/notices/model";
const KOREA_TIME_OFFSET_MS = 9 * 60 * 60 * 1000;
const localValue = (value: string | null) =>
  value
    ? new Date(Date.parse(value) + KOREA_TIME_OFFSET_MS)
        .toISOString()
        .slice(0, 16)
    : "";
type AdminFilter = "all" | "active" | "scheduled" | "ended" | "hidden";
function statusOf(notice: Notice, now: number): Exclude<AdminFilter, "all"> {
  if (!notice.isPublished) return "hidden";
  if (notice.publishStartAt && Date.parse(notice.publishStartAt) > now)
    return "scheduled";
  if (notice.publishEndAt && Date.parse(notice.publishEndAt) < now)
    return "ended";
  return "active";
}
const STATUS_LABELS: Readonly<Record<Exclude<AdminFilter, "all">, string>> = {
  active: "게시 중",
  scheduled: "예약",
  ended: "종료",
  hidden: "숨김",
};

export function AdminNoticeManager({
  currentTime,
  notices,
}: {
  readonly currentTime: string;
  readonly notices: readonly Notice[];
}) {
  const [filter, setFilter] = useState<AdminFilter>("all");
  const [query, setQuery] = useState("");
  const now = Date.parse(currentTime);
  const filtered = useMemo(
    () =>
      notices.filter(
        (notice) =>
          (filter === "all" || statusOf(notice, now) === filter) &&
          `${notice.title} ${notice.content}`
            .toLocaleLowerCase("ko-KR")
            .includes(query.trim().toLocaleLowerCase("ko-KR")),
      ),
    [filter, notices, now, query],
  );
  return (
    <div className="admin-notices">
      <form action={saveNoticeAction} className="notice-editor">
        <h2>새 공지 작성</h2>
        <label>
          제목
          <input maxLength={160} name="title" required />
        </label>
        <label>
          요약
          <input maxLength={300} name="summary" />
        </label>
        <label>
          카테고리
          <select name="category">
            {NOTICE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {NOTICE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        <label>
          내용
          <textarea maxLength={10000} name="content" required rows={7} />
        </label>
        <div className="notice-editor__checks">
          <label>
            <input name="isImportant" type="checkbox" />
            중요 공지
          </label>
          <label>
            <input name="isPublished" type="checkbox" />
            게시
          </label>
        </div>
        <div className="notice-editor__dates">
          <label>
            게시 시작
            <input name="publishStartAt" type="datetime-local" />
          </label>
          <label>
            게시 종료
            <input name="publishEndAt" type="datetime-local" />
          </label>
        </div>
        <div className="notice-editor__actions">
          <NoticeSubmitButton>공지 저장</NoticeSubmitButton>
          <button className="button button--secondary" type="reset">
            작성 취소
          </button>
        </div>
      </form>
      <section className="admin-notice-list">
        <div className="admin-notice-list__toolbar">
          <h2>공지 목록</h2>
          <input
            aria-label="공지 검색"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목 또는 내용 검색"
            type="search"
            value={query}
          />
        </div>
        <div
          className="admin-notice-filters"
          role="group"
          aria-label="공지 상태 필터"
        >
          {(["all", "active", "scheduled", "ended", "hidden"] as const).map(
            (value) => (
              <button
                aria-pressed={filter === value}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value === "all" ? "전체" : STATUS_LABELS[value]}
              </button>
            ),
          )}
        </div>
        {filtered.length === 0 && (
          <p className="admin-notice-list__empty">
            아직 작성된 공지가 없습니다.
          </p>
        )}
        {filtered.map((notice) => {
          const status = statusOf(notice, now);
          return (
            <details key={notice.id}>
              <summary>
                <span>
                  <strong>{notice.title}</strong>
                  <small>
                    {NOTICE_CATEGORY_LABELS[notice.category]} ·{" "}
                    {STATUS_LABELS[status]}
                    {notice.isImportant ? " · 중요" : ""}
                  </small>
                </span>
                <span>
                  {new Intl.DateTimeFormat("ko-KR", {
                    dateStyle: "short",
                    timeZone: "Asia/Seoul",
                  }).format(new Date(notice.createdAt))}
                </span>
              </summary>
              <form
                action={saveNoticeAction}
                className="notice-editor notice-editor--compact"
              >
                <input name="id" type="hidden" value={notice.id} />
                <label>
                  제목
                  <input
                    defaultValue={notice.title}
                    maxLength={160}
                    name="title"
                    required
                  />
                </label>
                <label>
                  요약
                  <input
                    defaultValue={notice.summary ?? ""}
                    maxLength={300}
                    name="summary"
                  />
                </label>
                <label>
                  카테고리
                  <select defaultValue={notice.category} name="category">
                    {NOTICE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {NOTICE_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  내용
                  <textarea
                    defaultValue={notice.content}
                    maxLength={10000}
                    name="content"
                    required
                    rows={5}
                  />
                </label>
                <div className="notice-editor__checks">
                  <label>
                    <input
                      defaultChecked={notice.isImportant}
                      name="isImportant"
                      type="checkbox"
                    />
                    중요 공지
                  </label>
                  <label>
                    <input
                      defaultChecked={notice.isPublished}
                      name="isPublished"
                      type="checkbox"
                    />
                    게시
                  </label>
                </div>
                <div className="notice-editor__dates">
                  <label>
                    게시 시작
                    <input
                      defaultValue={localValue(notice.publishStartAt)}
                      name="publishStartAt"
                      type="datetime-local"
                    />
                  </label>
                  <label>
                    게시 종료
                    <input
                      defaultValue={localValue(notice.publishEndAt)}
                      name="publishEndAt"
                      type="datetime-local"
                    />
                  </label>
                </div>
                <div className="notice-editor__actions">
                  <NoticeSubmitButton>수정 저장</NoticeSubmitButton>
                </div>
              </form>
              <form
                action={deleteNoticeAction}
                className="notice-delete-form"
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      "삭제하면 되돌릴 수 없습니다. 이 공지를 삭제할까요?",
                    )
                  )
                    event.preventDefault();
                }}
              >
                <input name="id" type="hidden" value={notice.id} />
                <NoticeSubmitButton className="button button--secondary">
                  삭제
                </NoticeSubmitButton>
              </form>
            </details>
          );
        })}
      </section>
    </div>
  );
}
