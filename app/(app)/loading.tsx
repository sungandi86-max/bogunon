import Image from "next/image";

export default function AppLoading() {
  return <main aria-busy="true" aria-label="BOGUNON 불러오는 중" className="app-loading"><Image alt="" aria-hidden="true" height={56} priority src="/brand/bogunon-symbol.png" width={56} /><span>BOGUNON</span></main>;
}
