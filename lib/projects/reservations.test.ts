import { describe, expect, it } from "vitest";

import {
  reservationInputSchema,
  reservationToEventValues,
} from "@/lib/projects/reservations";

const baseInput = {
  projectId: "11111111-1111-4111-8111-111111111111",
  type: "flight",
  title: "김포 → 제주",
  reservationDate: "2026-08-04",
  startTime: "09:00",
  endTime: "10:10",
  company: "제주항공",
  confirmationNumber: "ABC123",
  location: "김포공항",
  phone: null,
  website: null,
  memo: null,
  syncCalendar: true,
} as const;

describe("project reservation domain", () => {
  it("accepts every supported reservation type", () => {
    const types = [
      "flight",
      "hotel",
      "rental_car",
      "restaurant",
      "badminton",
      "transportation",
      "ticket",
      "custom",
    ] as const;

    for (const type of types) {
      expect(reservationInputSchema.parse({ ...baseInput, type }).type).toBe(type);
    }
  });

  it("requires a start time when an end time is provided", () => {
    const parsed = reservationInputSchema.safeParse({
      ...baseInput,
      startTime: null,
      endTime: "10:10",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects an end time that is not later than the start time", () => {
    const parsed = reservationInputSchema.safeParse({
      ...baseInput,
      startTime: "10:10",
      endTime: "09:00",
    });

    expect(parsed.success).toBe(false);
  });

  it("allows only HTTP or HTTPS reservation websites", () => {
    expect(reservationInputSchema.safeParse({
      ...baseInput,
      website: "javascript:alert(1)",
    }).success).toBe(false);
    expect(reservationInputSchema.safeParse({
      ...baseInput,
      website: "https://example.com/reservation",
    }).success).toBe(true);
  });

  it("maps only calendar-safe reservation fields to a project event", () => {
    const values = reservationToEventValues(reservationInputSchema.parse(baseInput));

    expect(values).toEqual({
      project_id: baseInput.projectId,
      title: baseInput.title,
      area: "project",
      start_date: baseInput.reservationDate,
      end_date: baseInput.reservationDate,
      is_all_day: false,
      start_time: "09:00",
      end_time: "10:10",
      location: "김포공항",
      color_key: "mint",
      memo: null,
      description: null,
    });
    expect(JSON.stringify(values)).not.toContain(baseInput.confirmationNumber);
  });

  it("creates an all-day event when no time is supplied", () => {
    const values = reservationToEventValues(reservationInputSchema.parse({
      ...baseInput,
      startTime: null,
      endTime: null,
    }));

    expect(values.is_all_day).toBe(true);
    expect(values.start_time).toBeNull();
  });
});
