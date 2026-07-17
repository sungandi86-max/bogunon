import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SectionErrorProps {
  readonly onRetry?: () => void;
}

export function SectionError({ onRetry }: SectionErrorProps) {
  return (
    <div className="section-error" role="alert">
      <CircleAlert aria-hidden="true" size={18} />
      <div>
        <h3>데이터를 불러오지 못했습니다.</h3>
        <p>인터넷 연결을 확인한 뒤 다시 시도해 주세요.</p>
        {onRetry && <Button variant="ghost" onClick={onRetry}>다시 시도</Button>}
      </div>
    </div>
  );
}
