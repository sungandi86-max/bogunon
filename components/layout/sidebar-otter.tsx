import Image from "next/image";
import Link from "next/link";
import type { Notice } from "@/lib/notices/model";
import { noticeSummary, unreadBadge } from "@/lib/notices/model";

export function SidebarOtter({ notices = [] }: { readonly notices?: readonly Notice[] }) {
  const unread = notices.filter((notice) => !notice.isRead);
  const latest = unread[0];
  return <section aria-label="수다리 공지" className="sidebar-otter">
    <Link className="sidebar-otter__notice" href="/notices">
      {latest ? <><strong>{latest.title}</strong><p>{noticeSummary(latest)}</p></> : <p>새로운 공지가 없습니다.</p>}
      {unread.length > 0 && <span aria-label={`읽지 않은 공지 ${unread.length}개`}>{unreadBadge(unread.length)}</span>}
    </Link>
    <div className="sidebar-otter__mascot">
      <Image alt="수다리" height={990} sizes="(max-width: 1023px) 64px, 150px" src="/images/sidebar-otter.png" width={794} />
    </div>
  </section>;
}
