"use client";

import { Monitor } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AiDocumentWriterDesktop } from "@/components/ai/ai-document-writer-desktop";
import { PageHeader } from "@/components/layout/page-header";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

export function AiDocumentWriter() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    let updateTimer: number;

    if (typeof window.matchMedia !== "function") {
      updateTimer = window.setTimeout(() => setIsDesktop(true), 0);
      return () => window.clearTimeout(updateTimer);
    }
    const query = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setIsDesktop(query.matches);
    updateTimer = window.setTimeout(update, 0);
    query.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(updateTimer);
      query.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!isDesktop) {
    return (
      <section className="ai-writer-desktop-only" aria-labelledby="ai-writer-desktop-only-title">
        <Monitor aria-hidden="true" size={34} />
        <div>
          <h1 id="ai-writer-desktop-only-title">AI 문서 작성은 PC에서 이용해주세요</h1>
          <p>여러 자료를 비교하며 작성하는 기능으로, PC 화면에 맞게 제공됩니다.</p>
        </div>
        <Link className="button button--primary" href="/briefing">오늘 화면으로 돌아가기</Link>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        description="학생 활동자료와 교사 메모를 바탕으로 초안을 만들고, 등록된 해당 학년도 학교생활기록부 기재요령에 따라 검토합니다."
        title="동아리 생활기록부 초안"
      />
      <AiDocumentWriterDesktop />
    </>
  );
}
