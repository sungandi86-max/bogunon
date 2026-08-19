import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickLinksCard } from "@/components/briefing/quick-links-card";
import type { QuickLink } from "@/lib/quick-links/repository";

const link: QuickLink = { id: "link-1", userId: "user-1", name: "NEIS", url: "https://neis.example", iconKey: "admin", sortOrder: 0, isVisible: true, createdAt: "", updatedAt: "" };

describe("QuickLinksCard", () => {
  it("shows visible links in a new-tab-safe desktop card", () => {
    render(<QuickLinksCard links={[link, { ...link, id: "link-2", name: "숨김", isVisible: false }]} />);
    expect(screen.getByRole("heading", { name: "자주 쓰는 링크" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "NEIS" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "NEIS" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText("숨김")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "링크 관리" }).length).toBeGreaterThan(0);
  });
});
