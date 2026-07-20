import Image from "next/image";

export function SidebarOtter() {
  return <section aria-label="수다리 공지" className="sidebar-otter">
    <p>새로운 공지가 없습니다.</p>
    <Image alt="수다리" height={80} src="/brand/otter-profile.png" width={80} />
  </section>;
}
