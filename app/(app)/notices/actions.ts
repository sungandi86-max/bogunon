"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { NOTICE_CATEGORIES } from "@/lib/notices/model";
import { deleteNotice, markNoticeRead, saveNotice } from "@/lib/notices/repository";

const noticeSchema = z.object({ id: z.string().uuid().nullable(), title: z.string().trim().min(1).max(160), summary: z.string().trim().max(300).nullable(), content: z.string().trim().min(1).max(10000), category: z.enum(NOTICE_CATEGORIES), isPublished: z.boolean(), isImportant: z.boolean(), publishStartAt: z.string().datetime().nullable(), publishEndAt: z.string().datetime().nullable() }).refine((value) => !value.publishStartAt || !value.publishEndAt || value.publishEndAt >= value.publishStartAt, { message: "게시 종료일은 시작일보다 빠를 수 없습니다." });
const optionalDate = (value: FormDataEntryValue | null) => { if (typeof value !== "string" || !value) return null; const date = new Date(`${value}:00+09:00`); return Number.isNaN(date.getTime()) ? "invalid" : date.toISOString(); };
export async function saveNoticeAction(formData: FormData): Promise<void> { const rawId = formData.get("id"); const rawSummary = formData.get("summary"); const parsed = noticeSchema.parse({ id: typeof rawId === "string" && rawId ? rawId : null, title: formData.get("title"), summary: typeof rawSummary === "string" && rawSummary.trim() ? rawSummary : null, content: formData.get("content"), category: formData.get("category"), isPublished: formData.get("isPublished") === "on", isImportant: formData.get("isImportant") === "on", publishStartAt: optionalDate(formData.get("publishStartAt")), publishEndAt: optionalDate(formData.get("publishEndAt")) }); await saveNotice(parsed.id, parsed); revalidatePath("/admin/notices"); revalidatePath("/notices"); }
export async function deleteNoticeAction(formData: FormData): Promise<void> { await deleteNotice(z.string().uuid().parse(formData.get("id"))); revalidatePath("/admin/notices"); revalidatePath("/notices"); }
export async function markNoticeReadAction(formData: FormData): Promise<void> { await markNoticeRead(z.string().uuid().parse(formData.get("id"))); revalidatePath("/notices"); }
