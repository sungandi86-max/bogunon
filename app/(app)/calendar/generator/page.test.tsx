import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GeneratorPage from "@/app/(app)/calendar/generator/page";
import { getUserSchoolSettings } from "@/lib/neis/school-settings";

vi.mock("@/lib/neis/school-settings", () => ({ getUserSchoolSettings: vi.fn() }));
vi.mock("@/components/calendar/smart-calendar-generator", () => ({
  SmartCalendarGenerator: () => <div>generator-ready</div>,
}));

describe("Smart Calendar generator page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("guides users to settings when no school is configured", async () => {
    vi.mocked(getUserSchoolSettings).mockResolvedValue(null);
    render(await GeneratorPage());

    expect(screen.getByText("Smart Calendar를 만들려면 학교 정보를 먼저 등록해주세요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "학교 설정으로 이동" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByText("generator-ready")).not.toBeInTheDocument();
  });

  it("renders the generator when school settings exist", async () => {
    vi.mocked(getUserSchoolSettings).mockResolvedValue({
      officeCode: "B10",
      schoolCode: "7010001",
      name: "여의도고등학교",
      officeName: "서울특별시교육청",
      schoolLevel: "고등학교",
      region: "서울특별시",
      address: "서울특별시 영등포구",
      latitude: null,
      longitude: null,
      mealEnabled: true,
      weatherEnabled: true,
    });
    render(await GeneratorPage());

    expect(screen.getByText("generator-ready")).toBeInTheDocument();
  });
});
