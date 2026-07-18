import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card">
        <Image alt="" aria-hidden="true" height={64} priority src="/brand/bogunon-symbol.png" width={64} />
        <h1>BOGUNON</h1>
        <p>인터넷 연결을 확인해주세요.<br />연결되면 다시 사용할 수 있습니다.</p>
        <Link className="button button--secondary" href="/">다시 시도</Link>
      </section>
    </main>
  );
}
