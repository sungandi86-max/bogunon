import { z } from "zod";

export const quickLinkIconKeys = ["document", "spreadsheet", "drive", "school", "admin", "health", "web", "other"] as const;
export type QuickLinkIconKey = (typeof quickLinkIconKeys)[number];

export const quickLinkInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  url: z.string().trim().url().refine((value) => /^https?:$/i.test(new URL(value).protocol), "http 또는 https 주소만 사용할 수 있습니다."),
  iconKey: z.enum(quickLinkIconKeys),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

export function isSafeQuickLinkUrl(value: string): boolean {
  try {
    return /^https?:$/i.test(new URL(value).protocol);
  } catch {
    return false;
  }
}
