import { MedicationManagement } from "@/components/medications/medication-management";
import { listMedicationData } from "@/lib/medications/repository";
import { todayInSeoul } from "@/lib/work-items/date";

export default async function MedicationsPage() {
  const data = await listMedicationData().catch(() => ({ items: [], lots: [], plans: [], receipts: [], budgets: [] }));
  return <MedicationManagement {...data} today={todayInSeoul()} />;
}
