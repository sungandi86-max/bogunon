import { inspectPrivacy } from "@/lib/ai/privacy";

export interface AiContextCandidate {
  readonly id: string;
  readonly kind: "task" | "event" | "workflow" | "workflow_template";
  readonly title: string;
  readonly detail: string | null;
  readonly date: string | null;
  readonly surface: string;
}

export interface BoundedContextOptions {
  readonly surface: string;
  readonly entityId?: string;
  readonly maxItems?: number;
  readonly maxCharacters?: number;
}

export interface BoundedContextSelection {
  readonly items: readonly AiContextCandidate[];
  readonly characterCount: number;
  readonly warnings: readonly string[];
}

const DEFAULT_MAX_ITEMS = 20;
const DEFAULT_MAX_CHARACTERS = 6_000;

function candidateLength(candidate: AiContextCandidate): number {
  return [candidate.id, candidate.kind, candidate.title, candidate.detail, candidate.date, candidate.surface]
    .filter((value) => value !== null)
    .join("|").length;
}

export function selectBoundedContext(
  candidates: readonly AiContextCandidate[],
  options: BoundedContextOptions,
): BoundedContextSelection {
  const safeCandidates = candidates.filter((candidate) => {
    const inspection = inspectPrivacy(`${candidate.title} ${candidate.detail ?? ""}`);
    return inspection.allowed;
  });
  const removedCount = candidates.length - safeCandidates.length;
  const ranked = safeCandidates.toSorted((left, right) => {
    const leftEntity = left.id === options.entityId ? 1 : 0;
    const rightEntity = right.id === options.entityId ? 1 : 0;
    if (leftEntity !== rightEntity) return rightEntity - leftEntity;
    const leftSurface = left.surface === options.surface ? 1 : 0;
    const rightSurface = right.surface === options.surface ? 1 : 0;
    if (leftSurface !== rightSurface) return rightSurface - leftSurface;
    return (right.date ?? "").localeCompare(left.date ?? "");
  });
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
  const maxCharacters = options.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
  const items: AiContextCandidate[] = [];
  let characterCount = 0;
  for (const candidate of ranked) {
    if (items.length >= maxItems) break;
    const length = candidateLength(candidate);
    if (characterCount + length > maxCharacters) continue;
    items.push(candidate);
    characterCount += length;
  }
  return {
    items,
    characterCount,
    warnings: removedCount === 0
      ? []
      : [`민감정보가 포함된 컨텍스트 ${removedCount}건을 제외했습니다.`],
  };
}
