import { z } from "zod";

import type { TemplateDefinition } from "@/lib/work-items/workflow";
import type { ProjectColor, ProjectIcon } from "@/types/database";

export const PROJECT_ICONS = [
  { value: "folder", label: "폴더" },
  { value: "travel", label: "여행" },
  { value: "school", label: "학교" },
  { value: "calendar", label: "캘린더" },
  { value: "heart", label: "건강" },
  { value: "flag", label: "목표" },
  { value: "star", label: "중요" },
] as const satisfies readonly { readonly value: ProjectIcon; readonly label: string }[];

export const PROJECT_COLORS = [
  { value: "mint", label: "민트" },
  { value: "blue", label: "블루" },
  { value: "yellow", label: "옐로" },
  { value: "coral", label: "코랄" },
  { value: "lavender", label: "라벤더" },
  { value: "pink", label: "핑크" },
] as const satisfies readonly { readonly value: ProjectColor; readonly label: string }[];

export const PROJECT_TYPES = [
  { value: "travel", label: "여행", icon: "travel", color: "mint" },
  { value: "school", label: "학교", icon: "school", color: "blue" },
  { value: "work", label: "업무", icon: "calendar", color: "mint" },
  { value: "publication", label: "출판", icon: "star", color: "coral" },
  { value: "development", label: "개발", icon: "folder", color: "blue" },
  { value: "workout", label: "운동", icon: "heart", color: "mint" },
  { value: "personal", label: "개인", icon: "flag", color: "lavender" },
  { value: "other", label: "기타", icon: "folder", color: "yellow" },
] as const satisfies readonly {
  readonly value: string;
  readonly label: string;
  readonly icon: ProjectIcon;
  readonly color: ProjectColor;
}[];

export type ProjectType = (typeof PROJECT_TYPES)[number]["value"];

export const PROJECT_QUICK_TEMPLATES = [
  { key: "travel", label: "여행 프로젝트", description: "일정 · 예약 · 예산", name: "새 여행", type: "travel" },
  { key: "school", label: "학교 프로젝트", description: "업무 · 일정 · 메모", name: "학교 프로젝트", type: "school" },
  { key: "publication", label: "출판 프로젝트", description: "원고 · 일정 · 작업", name: "출판 프로젝트", type: "publication" },
  { key: "workout", label: "운동 프로젝트", description: "훈련 · 대회 · 기록", name: "운동 프로젝트", type: "workout" },
  { key: "blank", label: "빈 프로젝트", description: "처음부터 직접 구성", name: "", type: "other" },
] as const satisfies readonly {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly name: string;
  readonly type: ProjectType;
}[];

export function projectTypeForIcon(icon: ProjectIcon): ProjectType {
  return PROJECT_TYPES.find((option) => option.icon === icon)?.value ?? "other";
}

export function projectEventTemplate(projectId: string, projectName: string): TemplateDefinition {
  return {
    key: `project-event-${projectId}`,
    name: `${projectName} 일정`,
    kind: "event",
    area: "personal",
    category: "event",
    title: "",
    description: "",
    priority: "normal",
    estimatedMinutes: 30,
    recommendedTiming: "날짜 선택",
    recurrenceFrequency: null,
    checklist: [],
    memo: "",
    isAllDay: true,
    projectId,
  };
}

const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed || null;
};

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "프로젝트 이름을 입력해 주세요.").max(120),
  icon: z.enum(["folder", "calendar", "school", "heart", "flag", "star", "travel"]),
  color: z.enum(["mint", "blue", "yellow", "coral", "lavender", "pink"]),
  description: z.preprocess(emptyToNull, z.string().max(1000).nullable()),
  start_date: z.preprocess(emptyToNull, z.iso.date().nullable()),
  end_date: z.preprocess(emptyToNull, z.iso.date().nullable()),
}).refine(
  ({ start_date: startDate, end_date: endDate }) => !startDate || !endDate || endDate >= startDate,
  { message: "종료일은 시작일 이후로 선택해 주세요.", path: ["end_date"] },
);

export type ProjectInput = z.infer<typeof projectInputSchema>;

export function projectInputFromFormData(formData: FormData): ProjectInput {
  return projectInputSchema.parse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color"),
    description: formData.get("description"),
    start_date: formData.get("startDate"),
    end_date: formData.get("endDate"),
  });
}
