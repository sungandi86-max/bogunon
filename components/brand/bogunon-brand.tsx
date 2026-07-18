import Image from "next/image";
import Link from "next/link";

interface BogunonBrandProps {
  readonly className?: string;
  readonly href?: string;
  readonly priority?: boolean;
  readonly size?: "compact" | "default" | "large";
}

export function BogunonBrand({ className = "", href = "/briefing", priority = false, size = "default" }: BogunonBrandProps) {
  const content = (
    <>
      <Image alt="" aria-hidden="true" className="bogunon-brand__symbol" height={size === "large" ? 48 : 32} priority={priority} src="/brand/bogunon-symbol.png" width={size === "large" ? 48 : 32} />
      <Image alt="BOGUNON" className="bogunon-brand__wordmark" height={size === "large" ? 38 : 30} priority={priority} src="/brand/bogunon-wordmark.png" width={size === "large" ? 164 : 130} />
    </>
  );

  return <Link aria-label="BOGUNON" className={`bogunon-brand bogunon-brand--${size} ${className}`.trim()} href={href}>{content}</Link>;
}
