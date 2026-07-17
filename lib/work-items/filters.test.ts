import { describe, expect, it } from "vitest";

import { filterEvents, filterTasks } from "@/lib/work-items/filters";
import type { EventRow, TaskRow } from "@/types/database";

const taskBase: TaskRow = {
  id: "task-1",
  user_id: "user-1",
  title: "약품 점검",
  area: "healthWork",
  status: "planned",
  priority: "high",
  category: "medication",
  scheduled_date: "2026-07-17",
  due_date: "2026-07-17",
  follow_up_date: null,
  memo: "응급약품 유효기간 확인",
  completed_at: null,
  recurrence_frequency: "monthly",
  recurrence_source_id: null,
  recurrence_date: "2026-07-17",
  recurrence_generated_through: "2026-07-17",
  created_at: "2026-07-17T00:00:00Z",
  updated_at: "2026-07-17T00:00:00Z",
};

const eventBase: EventRow = {
  id: "event-1",
  user_id: "user-1",
  title: "보건교육",
  area: "healthWork",
  start_date: "2026-07-17",
  end_date: "2026-07-17",
  is_all_day: false,
  start_time: "14:00:00",
  end_time: null,
  memo: "교직원 CPR",
  created_at: "2026-07-17T00:00:00Z",
  updated_at: "2026-07-17T00:00:00Z",
};

describe("work item filters", () => {
  it("matches task memo text while combining category, completion, period, and priority", () => {
    const completed: TaskRow = {
      ...taskBase,
      id: "task-2",
      status: "completed",
      completed_at: "2026-07-17T02:00:00Z",
    };
    const result = filterTasks(
      [taskBase, completed],
      {
        query: "유효기간",
        category: "medication",
        completion: "open",
        period: "today",
        priority: "high",
      },
      "2026-07-17",
    );
    expect(result.map((task) => task.id)).toEqual(["task-1"]);
  });

  it("matches event memo text immediately within the selected period", () => {
    expect(filterEvents([eventBase], "CPR", "today", "2026-07-17")).toEqual([eventBase]);
    expect(filterEvents([eventBase], "CPR", "today", "2026-07-18")).toEqual([]);
  });
});
