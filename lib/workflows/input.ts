import type { Json } from "@/types/database";

export function toJson(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(toJson);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, toJson(item)]));
  }
  throw new Error("JSON으로 저장할 수 없는 값입니다.");
}

function objectArray(value: Json, label: string): readonly Record<string, Json | undefined>[] {
  if (!Array.isArray(value) || value.some((item) => item === null || Array.isArray(item) || typeof item !== "object")) {
    throw new Error(`${label} 형식을 확인해 주세요.`);
  }
  return value;
}

export function parseWorkflowSteps(value: unknown): Json {
  const json = toJson(value);
  const steps = objectArray(json, "Workflow 단계");
  if (!steps.length || steps.some((step) => typeof step["name"] !== "string" || !step["name"].trim())) {
    throw new Error("Workflow에는 이름이 있는 단계가 하나 이상 필요합니다.");
  }
  if (steps.some((step) => !Array.isArray(step["checklist"]) || !Array.isArray(step["links"]))) {
    throw new Error("단계 체크리스트와 링크 형식을 확인해 주세요.");
  }
  for (const step of steps) parseWorkflowLinks(step["links"]);
  return json;
}

export function parseWorkflowLinks(value: unknown): Json {
  const json = toJson(value);
  const links = objectArray(json, "관련 링크");
  if (links.some((link) => typeof link["title"] !== "string" || !link["title"].trim()
    || typeof link["url"] !== "string" || !/^https?:\/\/[^\s]+$/.test(link["url"]))) {
    throw new Error("관련 링크는 제목과 http 또는 https 주소가 필요합니다.");
  }
  return json;
}

export function parseWorkflowFollowups(value: unknown): Json {
  const json = toJson(value);
  const rules = objectArray(json, "후속 업무 규칙");
  if (rules.some((rule) => typeof rule["title"] !== "string" || !rule["title"].trim()
    || !["step_completed", "workflow_completed"].includes(String(rule["triggerType"] ?? rule["trigger_type"])))) {
    throw new Error("후속 업무 규칙을 확인해 주세요.");
  }
  return json;
}
