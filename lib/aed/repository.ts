import { createClient } from "@/lib/supabase/server";
import type { AedDeviceRow } from "@/types/database";

export class AedRepositoryError extends Error {
  readonly name = "AedRepositoryError";
}

export type AedDevice = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly location: string;
  readonly batteryExpiryDate: string | null;
  readonly padExpiryDate: string | null;
  readonly lastInspectionDate: string | null;
  readonly nextInspectionDate: string | null;
  readonly inspectionIntervalMonths: number;
  readonly note: string | null;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

function mapDevice(row: AedDeviceRow): AedDevice {
  return { id: row.id, userId: row.user_id, name: row.name, location: row.location, batteryExpiryDate: row.battery_expiry_date, padExpiryDate: row.pad_expiry_date, lastInspectionDate: row.last_inspection_date, nextInspectionDate: row.next_inspection_date, inspectionIntervalMonths: row.inspection_interval_months, note: row.note, sortOrder: row.sort_order, createdAt: row.created_at, updatedAt: row.updated_at };
}

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AedRepositoryError("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listAedDevices(): Promise<AedDevice[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("aed_devices").select("*").eq("user_id", userId).order("sort_order").order("name");
  if (error) throw new AedRepositoryError("AED 정보를 불러오지 못했습니다.");
  return data.map(mapDevice);
}

export async function createAedDevice(userId: string, values: { readonly name: string; readonly location: string; readonly batteryExpiryDate: string | null; readonly padExpiryDate: string | null; readonly lastInspectionDate: string | null; readonly nextInspectionDate: string | null; readonly inspectionIntervalMonths: number; readonly note: string | null; readonly sortOrder?: number }): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.from("aed_devices").insert({ user_id: userId, name: values.name, location: values.location, battery_expiry_date: values.batteryExpiryDate, pad_expiry_date: values.padExpiryDate, last_inspection_date: values.lastInspectionDate, next_inspection_date: values.nextInspectionDate, inspection_interval_months: values.inspectionIntervalMonths, note: values.note, sort_order: values.sortOrder ?? 0 });
  if (error) throw new AedRepositoryError("AED 정보를 저장하지 못했습니다.");
}

export async function updateAedDevice(id: string, values: { readonly name: string; readonly location: string; readonly batteryExpiryDate: string | null; readonly padExpiryDate: string | null; readonly lastInspectionDate: string | null; readonly nextInspectionDate: string | null; readonly inspectionIntervalMonths: number; readonly note: string | null; readonly sortOrder?: number }): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("aed_devices").update({ name: values.name, location: values.location, battery_expiry_date: values.batteryExpiryDate, pad_expiry_date: values.padExpiryDate, last_inspection_date: values.lastInspectionDate, next_inspection_date: values.nextInspectionDate, inspection_interval_months: values.inspectionIntervalMonths, note: values.note, ...(values.sortOrder === undefined ? {} : { sort_order: values.sortOrder }) }).eq("id", id).eq("user_id", userId);
  if (error) throw new AedRepositoryError("AED 정보를 수정하지 못했습니다.");
}

export async function deleteAedDevice(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("aed_devices").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new AedRepositoryError("AED 정보를 삭제하지 못했습니다.");
}
