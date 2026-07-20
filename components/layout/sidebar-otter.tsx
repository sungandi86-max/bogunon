import Image from "next/image";

export function SidebarOtter() {
  return <section aria-label="수다리 공지" className="sidebar-otter">
    <div className="sidebar-otter__notice">
      <p>새로운 공지가 없습니다.</p>
    </div>
    <div className="sidebar-otter__mascot">
      <Image alt="수다리" height={990} sizes="(max-width: 1023px) 64px, 150px" src="/images/sidebar-otter.png" width={794} />
    </div>
  </section>;
}
