import "server-only";

import { createHash } from "node:crypto";

import type { NoticeInput, UserRole } from "@/lib/notices/model";
import { isAdminRole } from "@/lib/notices/model";
import { SupabaseAdminConfigurationError, createAdminClient } from "@/lib/supabase/admin";
import type { NoticeRow } from "@/types/database";

export type SystemNoticeInput = NoticeInput & { readonly version: string };
export type SystemNoticeAuthorRole = "admin" | "owner";

const failureMessages = {
  "admin-client-unavailable": "Supabase admin client is unavailable.",
  "author-lookup-failed": "System notice author lookup failed.",
  "author-not-authorized": "System notice author must be an admin or owner.",
  "author-not-found": "System notice author profile was not found.",
  "duplicate-notices": "Multiple system notices already exist for this version.",
  "invalid-author-id": "SYSTEM_NOTICE_AUTHOR_ID must be a UUID.",
  "invalid-title": "System notice title must match the release version.",
  "invalid-version": "System notice version is invalid.",
  "missing-author-id": "SYSTEM_NOTICE_AUTHOR_ID is required.",
  "notice-conflict": "A system notice already exists for this version with different content.",
  "notice-insert-failed": "System notice insert failed.",
  "notice-lookup-failed": "System notice lookup failed.",
} as const;

export type SystemNoticeErrorCode = keyof typeof failureMessages;

export type SystemNoticeError = {
  readonly code: SystemNoticeErrorCode;
  readonly message: string;
};

export type SystemNoticeResult =
  | { readonly ok: true; readonly action: "inserted" }
  | { readonly ok: true; readonly action: "noop"; readonly noticeId: string }
  | SystemNoticeFailure;

export type SystemNoticeAuthorValidationResult =
  | { readonly ok: true; readonly authorId: string; readonly role: SystemNoticeAuthorRole }
  | SystemNoticeFailure;

type SystemNoticeFailure = { readonly ok: false; readonly error: SystemNoticeError };
type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
type SystemNoticeLookupResult = { readonly ok: true; readonly notices: readonly ExistingNoticeRow[] } | SystemNoticeFailure;

type ValidatedSystemNoticeAuthor = {
  readonly ok: true;
  readonly authorId: string;
  readonly role: SystemNoticeAuthorRole;
  readonly supabase: SupabaseAdminClient;
};

const systemNoticeNamespace = "bogunon-system-notice:v1";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const versionPattern = /^[0-9A-Za-z][0-9A-Za-z.+_-]*$/;

function failure(code: SystemNoticeErrorCode): SystemNoticeFailure {
  return { ok: false, error: { code, message: failureMessages[code] } };
}

export async function validateSystemNoticeAuthor(): Promise<SystemNoticeAuthorValidationResult> {
  const result = await validateSystemNoticeAuthorWithClient();
  if (!result.ok) return result;
  return { ok: true, authorId: result.authorId, role: result.role };
}

export async function ensureSystemNotice(input: SystemNoticeInput): Promise<SystemNoticeResult> {
  const validated = validateSystemNotice(input);
  if (!validated.ok) return failure(validated.code);

  const author = await validateSystemNoticeAuthorWithClient();
  if (!author.ok) return author;

  const lookup = await findExistingSystemNotices(author.supabase, validated.expectedTitle);
  if (!lookup.ok) return lookup;

  const existingResult = resolveExistingSystemNotice(input, lookup.notices);
  if (existingResult) return existingResult;

  const { error: insertError } = await author.supabase.from("notices").insert(toNoticeInsert(input, author.authorId));
  if (isUniqueViolation(insertError)) return resolveUniqueViolation(author.supabase, validated.expectedTitle, input);
  if (insertError) return failure("notice-insert-failed");

  return { ok: true, action: "inserted" };
}

function validateSystemNotice(
  input: SystemNoticeInput,
): { readonly ok: true; readonly expectedTitle: string } | { readonly ok: false; readonly code: SystemNoticeErrorCode } {
  if (!versionPattern.test(input.version)) return { ok: false, code: "invalid-version" };

  const expectedTitle = `BOGUNON ${input.version} 업데이트`;
  if (expectedTitle.length > 160) return { ok: false, code: "invalid-version" };
  if (input.title !== expectedTitle) return { ok: false, code: "invalid-title" };

  return { ok: true, expectedTitle };
}

function createSafeAdminClient():
  | { readonly ok: true; readonly supabase: SupabaseAdminClient }
  | { readonly ok: false; readonly code: "admin-client-unavailable" } {
  try {
    return { ok: true, supabase: createAdminClient() };
  } catch (error) {
    if (error instanceof SupabaseAdminConfigurationError) return { ok: false, code: "admin-client-unavailable" };
    throw error;
  }
}

async function findExistingSystemNotices(supabase: SupabaseAdminClient, expectedTitle: string): Promise<SystemNoticeLookupResult> {
  const { data: notices, error } = await supabase
    .from("notices")
    .select("id,title,summary,content,category,is_published,is_important,publish_start_at,publish_end_at,created_by")
    .eq("title", expectedTitle)
    .limit(2);
  if (error) return failure("notice-lookup-failed");
  return { ok: true, notices: notices ?? [] };
}

async function resolveUniqueViolation(supabase: SupabaseAdminClient, expectedTitle: string, input: SystemNoticeInput): Promise<SystemNoticeResult> {
  const lookup = await findExistingSystemNotices(supabase, expectedTitle);
  if (!lookup.ok) return lookup;
  return resolveExistingSystemNotice(input, lookup.notices) ?? failure("notice-insert-failed");
}

function resolveExistingSystemNotice(input: SystemNoticeInput, notices: readonly ExistingNoticeRow[]): SystemNoticeResult | null {
  if (notices.length > 1) return failure("duplicate-notices");

  const existingNotice = notices[0];
  if (!existingNotice) return null;

  return noticeContentMatchesInput(existingNotice, input)
    ? { ok: true, action: "noop", noticeId: existingNotice.id }
    : failure("notice-conflict");
}

async function validateSystemNoticeAuthorWithClient(): Promise<ValidatedSystemNoticeAuthor | SystemNoticeFailure> {
  const authorId = process.env["SYSTEM_NOTICE_AUTHOR_ID"];
  if (!authorId) return failure("missing-author-id");
  if (!uuidPattern.test(authorId)) return failure("invalid-author-id");

  const client = createSafeAdminClient();
  if (!client.ok) return failure(client.code);

  const { data: profile, error: profileError } = await client.supabase.from("profiles").select("id,role").eq("id", authorId).maybeSingle();

  if (profileError) return failure("author-lookup-failed");
  if (!profile) return failure("author-not-found");
  if (!isAdminRole(profile.role)) return failure("author-not-authorized");

  return { ok: true, authorId, role: toSystemNoticeAuthorRole(profile.role), supabase: client.supabase };
}

function toSystemNoticeAuthorRole(role: UserRole): SystemNoticeAuthorRole {
  if (role === "owner") return "owner";
  return "admin";
}

function noticeContentMatchesInput(row: ExistingNoticeContentRow, input: SystemNoticeInput): boolean {
  return (
    row.title === input.title &&
    row.summary === input.summary &&
    row.content === input.content &&
    row.category === input.category &&
    row.is_published === input.isPublished &&
    row.is_important === input.isImportant &&
    row.publish_start_at === input.publishStartAt &&
    row.publish_end_at === input.publishEndAt
  );
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

function systemNoticeId(version: string): string {
  const normalizedVersion = version.trim().toLowerCase();
  const hex = createHash("sha256").update(`${systemNoticeNamespace}:${normalizedVersion}`).digest("hex");
  const variant = ((Number.parseInt(hex.charAt(16), 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

type ExistingNoticeRow = ExistingNoticeContentRow & Pick<NoticeRow, "id" | "created_by">;
type ExistingNoticeContentRow = Pick<NoticeRow, "title" | "summary" | "content" | "category" | "is_published" | "is_important" | "publish_start_at" | "publish_end_at">;

function toNoticeInsert(input: SystemNoticeInput, authorId: string): NoticeInputRow {
  return {
    id: systemNoticeId(input.version),
    title: input.title,
    summary: input.summary,
    content: input.content,
    category: input.category,
    is_published: input.isPublished,
    is_important: input.isImportant,
    publish_start_at: input.publishStartAt,
    publish_end_at: input.publishEndAt,
    created_by: authorId,
  };
}

type NoticeInputRow = {
  readonly id: string;
  readonly title: string;
  readonly summary: string | null;
  readonly content: string;
  readonly category: NoticeInput["category"];
  readonly is_published: boolean;
  readonly is_important: boolean;
  readonly publish_start_at: string | null;
  readonly publish_end_at: string | null;
  readonly created_by: string;
};
