import { z } from "zod";

import type { ProjectColor, ProjectIcon } from "@/types/database";

export const PROJECT_ICONS = [
  { value: "folder", label: "폴더" },
  { value: "calendar", label: "캘린더" },
  { value: "school", label: "학교" },
  { value: "heart", label: "건강" },
  { value: "flag", label: "목표" },
  { value: "star", label: "중요" },
  { value: "travel", label: "여행" },
] as const satisfies readonly { readonly value: ProjectIcon; readonly label: string }[];

export const PROJECT_COLORS = [
  { value: "mint", label: "민트" },
  { value: "blue", label: "블루" },
  { value: "yellow", label: "옐로" },
  { value: "coral", label: "코랄" },
  { value: "lavender", label: "라벤더" },
  { value: "pink", label: "핑크" },
] as const satisfies readonly { readonly value: ProjectColor; readonly label: string }[];

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
