import type { ProjectType } from "@/lib/projects/domain";

export type WorkspaceRecommendationIcon =
  | "activity"
  | "book"
  | "calendar"
  | "car"
  | "file"
  | "hotel"
  | "plane"
  | "search"
  | "trophy"
  | "users";

export type WorkspaceRecommendation = {
  readonly icon: WorkspaceRecommendationIcon;
  readonly title: string;
};

const scheduleRecommendations: Readonly<Partial<Record<ProjectType, readonly WorkspaceRecommendation[]>>> = {
  travel: [
    { icon: "plane", title: "공항 출발" },
    { icon: "hotel", title: "숙소 체크인" },
    { icon: "car", title: "렌터카 수령" },
  ],
  school: [
    { icon: "file", title: "공문 확인" },
    { icon: "users", title: "회의" },
    { icon: "calendar", title: "제출 마감" },
  ],
  publication: [
    { icon: "book", title: "원고 작성" },
    { icon: "search", title: "교정" },
    { icon: "file", title: "PDF 검수" },
  ],
  workout: [
    { icon: "activity", title: "레슨" },
    { icon: "trophy", title: "대회" },
    { icon: "activity", title: "개인훈련" },
  ],
};

const checklistRecommendations: Readonly<Partial<Record<ProjectType, readonly string[]>>> = {
  travel: ["캐리어", "충전기", "보조배터리", "신분증"],
  school: ["자료 준비", "출력물", "참석자 확인"],
  publication: ["원고", "이미지", "교정"],
  workout: ["라켓", "셔틀콕", "운동화"],
};

export function scheduleRecommendationsFor(type: ProjectType): readonly WorkspaceRecommendation[] {
  return scheduleRecommendations[type] ?? [];
}

export function checklistRecommendationsFor(type: ProjectType): readonly string[] {
  return checklistRecommendations[type] ?? [];
}
