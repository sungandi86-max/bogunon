import type { PracticalToolIconKey, PracticalToolScope } from "@/types/database";

export function validatePracticalToolScope(scope: PracticalToolScope, iconKey: PracticalToolIconKey, isAdmin: boolean): string | null {
  if (iconKey === "online_health" && scope === "public") return "온라인 보건실은 개인 도구로만 등록할 수 있습니다.";
  if (scope === "public" && !isAdmin) return "공용 도구는 관리자만 등록할 수 있습니다.";
  return null;
}
