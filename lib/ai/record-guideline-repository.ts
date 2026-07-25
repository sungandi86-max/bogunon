import { createClient } from "@/lib/supabase/server";
import {
  assertGuidelineCanBePersisted,
  countCombinedGuidelineCharacters,
  GUIDELINE_MAX_COMBINED_CHARACTERS,
  GuidelineYearTextLimitError,
  type RecordGuideline,
  type RecordGuidelineInput,
  toRecordGuideline,
} from "@/lib/ai/record-guidelines";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new RecordGuidelineAccessError();
  return { supabase, userId: user.id };
}

export class RecordGuidelineAccessError extends Error {
  constructor() {
    super("로그인이 필요합니다.");
    this.name = "RecordGuidelineAccessError";
  }
}

export async function listRecordGuidelines(): Promise<RecordGuideline[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("record_guidelines")
    .select("*")
    .eq("user_id", userId)
    .order("school_year", { ascending: false })
    .order("document_type");

  if (error) throw new Error("기준자료를 불러오지 못했습니다.");
  return (data ?? []).map(toRecordGuideline);
}

export async function upsertRecordGuideline(
  input: RecordGuidelineInput,
): Promise<RecordGuideline> {
  assertGuidelineCanBePersisted(input.extractedText);
  const { supabase, userId } = await ownedClient();
  const { data: existing, error: existingError } = await supabase
    .from("record_guidelines")
    .select("document_type,extracted_text")
    .eq("user_id", userId)
    .eq("school_year", input.schoolYear);
  if (existingError) throw new Error("기준자료를 저장하지 못했습니다.");

  const combinedCharacters = countCombinedGuidelineCharacters([
    ...(existing ?? [])
      .filter(({ document_type }) => document_type !== input.sourceType)
      .map(({ document_type, extracted_text }) => ({
        extractedText: extracted_text,
        sourceType: document_type,
      })),
    {
      extractedText: input.extractedText,
      sourceType: input.sourceType,
    },
  ]);
  if (combinedCharacters > GUIDELINE_MAX_COMBINED_CHARACTERS) {
    throw new GuidelineYearTextLimitError();
  }

  const { data, error } = await supabase
    .from("record_guidelines")
    .upsert({
      user_id: userId,
      school_year: input.schoolYear,
      document_type: input.sourceType,
      original_filename: input.originalFilename,
      mime_type: input.mimeType,
      extracted_text: input.extractedText,
      file_size: input.fileSize,
    }, { onConflict: "user_id,school_year,document_type" })
    .select("*")
    .single();

  if (error || !data) throw new Error("기준자료를 저장하지 못했습니다.");
  return toRecordGuideline(data);
}

export async function deleteRecordGuideline(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase
    .from("record_guidelines")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error("기준자료를 삭제하지 못했습니다.");
}
