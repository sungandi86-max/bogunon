import { smartCalendarEventIdentity } from "@/lib/calendar-generator/generation-planner";
import type {
  SmartCalendarDuplicateDecision,
  SmartCalendarExistingEvent,
} from "@/lib/calendar-generator/generation-types";

export type SmartCalendarSaveItem = {
  readonly clientId: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly area: "schoolSchedule" | "healthWork";
  readonly description: string;
  readonly selected: boolean;
  readonly duplicateDecision: SmartCalendarDuplicateDecision;
};

export type SmartCalendarInsertResult =
  | { readonly ok: true; readonly eventId: string }
  | { readonly ok: false; readonly message: string };

export type SmartCalendarEventStore = {
  readonly listExisting: () => Promise<readonly SmartCalendarExistingEvent[]>;
  readonly insert: (item: SmartCalendarSaveItem) => Promise<SmartCalendarInsertResult>;
};

export type SmartCalendarItemResult =
  | { readonly clientId: string; readonly title: string; readonly status: "created"; readonly eventId: string }
  | { readonly clientId: string; readonly title: string; readonly status: "duplicate-excluded"; readonly eventId: string }
  | { readonly clientId: string; readonly title: string; readonly status: "user-excluded" }
  | { readonly clientId: string; readonly title: string; readonly status: "failed"; readonly message: string };

export type SmartCalendarSaveResult = {
  readonly results: readonly SmartCalendarItemResult[];
  readonly summary: {
    readonly created: number;
    readonly duplicates: number;
    readonly excluded: number;
    readonly failed: number;
  };
};

export async function persistSmartCalendarItems(request: {
  readonly items: readonly SmartCalendarSaveItem[];
  readonly store: SmartCalendarEventStore;
}): Promise<SmartCalendarSaveResult> {
  const existing = new Map(
    (await request.store.listExisting()).map((event) => [smartCalendarEventIdentity(event), event]),
  );
  const results: SmartCalendarItemResult[] = [];
  for (const item of request.items) {
    if (!item.selected) {
      results.push({ clientId: item.clientId, title: item.title, status: "user-excluded" });
      continue;
    }
    const identity = smartCalendarEventIdentity(item);
    const duplicate = existing.get(identity);
    if (duplicate !== undefined && item.duplicateDecision !== "force") {
      results.push({
        clientId: item.clientId,
        title: item.title,
        status: "duplicate-excluded",
        eventId: duplicate.id,
      });
      continue;
    }
    let inserted: SmartCalendarInsertResult;
    try {
      inserted = await request.store.insert(item);
    } catch (error) {
      results.push({
        clientId: item.clientId,
        title: item.title,
        status: "failed",
        message: error instanceof Error ? error.message : "일정을 저장하지 못했습니다.",
      });
      continue;
    }
    if (!inserted.ok) {
      results.push({ clientId: item.clientId, title: item.title, status: "failed", message: inserted.message });
      continue;
    }
    results.push({ clientId: item.clientId, title: item.title, status: "created", eventId: inserted.eventId });
    existing.set(identity, {
      id: inserted.eventId,
      title: item.title,
      startDate: item.startDate,
      endDate: item.endDate,
    });
  }
  return {
    results,
    summary: {
      created: results.filter((item) => item.status === "created").length,
      duplicates: results.filter((item) => item.status === "duplicate-excluded").length,
      excluded: results.filter((item) => item.status === "user-excluded").length,
      failed: results.filter((item) => item.status === "failed").length,
    },
  };
}
