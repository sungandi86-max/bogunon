import { PageHeader } from "@/components/layout/page-header";
import { AdminNoticeManager } from "@/components/notices/admin-notice-manager";
import { isAdminRole } from "@/lib/notices/model";
import { getCurrentProfile, listNotices } from "@/lib/notices/repository";
export default async function AdminNoticesPage() { const profile = await getCurrentProfile(); if (!isAdminRole(profile.role)) return <main className="page-shell"><section className="notice-empty" role="alert"><h1>접근 권한이 없습니다.</h1><p>공지 관리는 관리자와 최고 관리자만 사용할 수 있습니다.</p></section></main>; const notices = await listNotices(); return <main className="page-shell"><PageHeader eyebrow="관리자" title="공지 관리" description="공지 작성, 게시 기간, 중요 여부를 관리합니다." /><AdminNoticeManager currentTime={new Date().toISOString()} notices={notices} /></main>; }
