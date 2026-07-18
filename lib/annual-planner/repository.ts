import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { AnnualPlannerPreset } from "@/lib/annual-planner/health-yearly-presets";
import type { Database } from "@/types/database";

const customItemInputSchema = z.object({
  month: z.number().int().min(1).max(12),
  title: z.string().trim().min(1).max(120),
  itemKind: z.enum(["task", "event"]),
  description: z.string().trim().max(2000).nullable(),
  estimatedMinutes: z.number().int().min(1).max(1440).nullable(),
  checklist: z.array(z.string().trim().min(1).max(200)).max(30),
});
const customItemRowSchema = z.object({
  id: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  title: z.string().min(1),
  item_kind: z.enum(["task", "event"]),
  description: z.string().nullable(),
  estimated_minutes: z.number().int().nullable(),
  checklist_json: z.array(z.string()),
});

export type AnnualPlannerCustomItemInput = z.infer<typeof customItemInputSchema>;
type AnnualPlannerCustomItemInsert = Database["public"]["Tables"]["annual_planner_custom_items"]["Insert"];

class AnnualPlannerRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnnualPlannerRepositoryError";
  }
}

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AnnualPlannerRepositoryError("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listAnnualPlannerCustomItems(): Promise<AnnualPlannerPreset[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("annual_planner_custom_items")
    .select("*")
    .eq("user_id", userId)
    .order("month")
    .order("sort_order")
    .order("created_at");
  if (error?.code === "PGRST205" || error?.code === "42P01") return [];
  if (error) throw new AnnualPlannerRepositoryError("연간 플래너의 내 업무를 불러오지 못했습니다.");
  return data.flatMap((rawItem) => {
    const parsedItem = customItemRowSchema.safeParse(rawItem);
    if (!parsedItem.success) return [];
    const item = parsedItem.data;
    return [{
      id: `custom-${item.id}`,
      month: item.month,
      title: item.title,
      kind: item.item_kind,
      recommendedPeriod: `${item.month}월 중`,
      estimatedMinutes: item.estimated_minutes ?? 30,
      recurrence: null,
      checklist: item.checklist_json,
      description: item.description ?? "내 학교 일정에 맞게 추가한 업무입니다.",
      suggestedCategory: "other",
      source: "custom",
    } satisfies AnnualPlannerPreset];
  });
}

export async function createAnnualPlannerCustomItem(input: AnnualPlannerCustomItemInput): Promise<string> {
  const values = customItemInputSchema.parse(input);
  const { supabase, userId } = await ownedClient();
  const insert: AnnualPlannerCustomItemInsert = {
    user_id: userId,
    month: values.month,
    title: values.title,
    item_kind: values.itemKind,
    description: values.description,
    estimated_minutes: values.estimatedMinutes,
    checklist_json: values.checklist,
  };
  const { data, error } = await supabase
    .from("annual_planner_custom_items")
    .insert(insert)
    .select("id")
    .single();
  if (error) throw new AnnualPlannerRepositoryError("연간 플래너에 내 업무를 추가하지 못했습니다.");
  return data.id;
}
