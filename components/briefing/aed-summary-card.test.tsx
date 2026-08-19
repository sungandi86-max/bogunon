import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AedSummaryCard } from "@/components/briefing/aed-summary-card";
import type { AedDevice } from "@/lib/aed/repository";

const base: AedDevice = { id: "aed-1", userId: "user-1", name: "1층 AED", location: "보건실 옆", batteryExpiryDate: "2027-01-01", padExpiryDate: "2027-01-01", lastInspectionDate: "2026-07-19", nextInspectionDate: "2026-09-01", inspectionIntervalMonths: 1, note: null, sortOrder: 1, createdAt: "2026-07-19T00:00:00Z", updatedAt: "2026-07-19T00:00:00Z" };

describe("AED Today summary", () => {
  it("shows an action-first empty state", () => {
    render(<AedSummaryCard devices={[]} today="2026-08-19" />);
    expect(screen.getByRole("heading", { name: "AED 점검" })).toBeInTheDocument();
    expect(screen.getByText("등록된 AED가 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AED 등록" })).toHaveAttribute("href", "/aed");
  });

  it("prioritizes an urgent device and leaves weather out of the card", () => {
    const expired = { ...base, id: "aed-2", name: "4층 AED", padExpiryDate: "2026-08-01", sortOrder: 2 };
    render(<AedSummaryCard devices={[base, expired]} today="2026-08-19" />);
    const list = screen.getByRole("list");
    expect(list.firstElementChild).toHaveTextContent("4층 AED");
    expect(list.firstElementChild).toHaveTextContent("만료");
    expect(screen.queryByText("오늘의 날씨")).not.toBeInTheDocument();
  });
});
