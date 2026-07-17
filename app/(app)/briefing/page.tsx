import { BriefingScreen } from "@/components/briefing/briefing-screen";
import { monthRange, todayInSeoul } from "@/lib/work-items/date";
import { listEvents, listTasks } from "@/lib/work-items/repository";

export default async function BriefingPage() {
  const today = todayInSeoul();
  const month = today.slice(0, 7);
  const { first, last } = monthRange(today);
  const [tasks, events] = await Promise.all([listTasks(), listEvents(first, last)]);
  return <BriefingScreen events={events} month={month} tasks={tasks} today={today} />;
}
