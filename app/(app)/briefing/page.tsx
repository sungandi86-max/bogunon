import { BriefingScreen } from "@/components/briefing/briefing-screen";
import { monthRange, todayInSeoul } from "@/lib/work-items/date";
import { ensureRecurringTasks, listEvents, listTasks } from "@/lib/work-items/repository";
import { listHealthWorkflowData } from "@/lib/workflows/repository";

export default async function BriefingPage() {
  const today = todayInSeoul();
  const month = today.slice(0, 7);
  const { first, last } = monthRange(today);
  await ensureRecurringTasks(today);
  const [tasks, events, workflow] = await Promise.all([listTasks(), listEvents(first, last), listHealthWorkflowData()]);
  return <BriefingScreen events={events} month={month} tasks={tasks} today={today} workflow={workflow} />;
}
