import { AedManagement } from "@/components/aed/aed-management";
import { listAedDevices } from "@/lib/aed/repository";
import { todayInSeoul } from "@/lib/work-items/date";

export default async function AedPage() {
  const devices = await listAedDevices().catch(() => []);
  return <AedManagement devices={devices} today={todayInSeoul()} />;
}
