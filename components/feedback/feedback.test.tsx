import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingRows } from "@/components/feedback/loading-rows";
import { SectionError } from "@/components/feedback/section-error";

describe("feedback components", () => {
  it("renders independent empty, loading, and error states", () => {
    render(
      <>
        <EmptyState title="등록된 업무가 없습니다." description="첫 업무를 추가하세요." />
        <LoadingRows count={2} />
        <SectionError />
      </>,
    );

    expect(screen.getByRole("heading", { name: "등록된 업무가 없습니다." })).toBeInTheDocument();
    expect(screen.getByLabelText("목록을 불러오는 중")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("데이터를 불러오지 못했습니다.");
  });
});
