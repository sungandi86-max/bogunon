import type { TaskCategory } from "@/types/database";

export const TASK_CATEGORY_OPTIONS = [
  { value: "studentHealthScreening", label: "학생건강검진" },
  { value: "additionalScreening", label: "별도검사" },
  { value: "infectiousDisease", label: "감염병" },
  { value: "firstAid", label: "응급처치" },
  { value: "medication", label: "약품관리" },
  { value: "officialDocument", label: "공문" },
  { value: "training", label: "연수" },
  { value: "event", label: "행사" },
  { value: "counseling", label: "상담" },
  { value: "other", label: "기타" },
] as const satisfies readonly { readonly value: TaskCategory; readonly label: string }[];

export const TASK_CATEGORY_LABELS = {
  studentHealthScreening: "학생건강검진",
  additionalScreening: "별도검사",
  infectiousDisease: "감염병",
  firstAid: "응급처치",
  medication: "약품관리",
  officialDocument: "공문",
  training: "연수",
  event: "행사",
  counseling: "상담",
  other: "기타",
} as const satisfies Readonly<Record<TaskCategory, string>>;
