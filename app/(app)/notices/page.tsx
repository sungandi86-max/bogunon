import { PageHeader } from "@/components/layout/page-header";
import { NoticeList } from "@/components/notices/notice-list";
import { listNotices } from "@/lib/notices/repository";
export default async function NoticesPage() { const notices = await listNotices(); return <main className="page-shell notice-page"><PageHeader eyebrow="BOGUNON 소식" title="공지사항" description="서비스 안내와 업데이트를 확인합니다." /><NoticeList notices={notices} /></main>; }
