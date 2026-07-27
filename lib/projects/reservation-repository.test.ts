import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  })),
}));

import {
  deleteProjectReservation,
  saveProjectReservation,
} from "@/lib/projects/reservation-repository";

const input = {
  projectId: "11111111-1111-4111-8111-111111111111",
  type: "hotel" as const,
  title: "MJ Resort",
  reservationDate: "2026-08-05",
  startTime: "15:00",
  endTime: null,
  company: "MJ Resort",
  confirmationNumber: "BOOK-1",
  location: "제주",
  phone: null,
  website: "https://example.com",
  memo: "체크인 확인",
  syncCalendar: true,
  syncExpense: true,
  updateLinkedExpense: true,
  expenseAmount: 180_000,
  expenseCategory: "accommodation" as const,
  expensePaymentStatus: "planned" as const,
};

describe("project reservation repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("uses the atomic reservation RPC without copying confirmation details into event arguments", async () => {
    mocks.rpc.mockResolvedValue({ data: "reservation-1", error: null });

    await expect(saveProjectReservation(input)).resolves.toBe("reservation-1");

    expect(mocks.rpc).toHaveBeenCalledWith("save_project_reservation_with_expense", {
      p_reservation_id: null,
      p_sync_calendar: true,
      p_sync_expense: true,
      p_update_expense: true,
      p_expense_values: {
        amount: 180_000,
        category: "accommodation",
        expense_date: "2026-08-05",
        memo: "체크인 확인",
        payment_status: "planned",
        title: "MJ Resort",
      },
      p_values: {
        project_id: input.projectId,
        type: "hotel",
        title: "MJ Resort",
        reservation_date: "2026-08-05",
        start_time: "15:00",
        end_time: null,
        company: "MJ Resort",
        confirmation_number: "BOOK-1",
        location: "제주",
        phone: null,
        website: "https://example.com",
        memo: "체크인 확인",
      },
    });
  });

  it("passes the user's linked-event deletion choice to one atomic RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(deleteProjectReservation({
      deleteLinkedExpense: true,
      deleteLinkedEvent: true,
      projectId: input.projectId,
      reservationId: "22222222-2222-4222-8222-222222222222",
    })).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith("delete_project_reservation_with_expense", {
      p_delete_linked_expense: true,
      p_delete_linked_event: true,
      p_reservation_id: "22222222-2222-4222-8222-222222222222",
    });
  });
});
