import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MealCard } from "@/components/briefing/meal-card";
import { WeatherCard } from "@/components/briefing/weather-card";
import { fetchTodayMeal } from "@/lib/neis/meals";
import type { UserSchoolSettings } from "@/lib/neis/types";

vi.mock("@/lib/neis/meals", () => ({ fetchTodayMeal: vi.fn() }));

const school: UserSchoolSettings = {
  officeCode: "B10",
  schoolCode: "7010082",
  name: "여의도고등학교",
  officeName: "서울특별시교육청",
  schoolLevel: "고등학교",
  region: "서울특별시",
  address: "서울특별시 영등포구 국제금융로7길 37",
  latitude: null,
  longitude: null,
  mealEnabled: true,
  weatherEnabled: true,
};

describe("briefing school daily cards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("links missing school states to the stable settings section", async () => {
    render(await MealCard({ date: "2026-07-23", school: null }));
    render(<WeatherCard school={null} />);
    for (const link of screen.getAllByRole("link", { name: "학교 설정" })) {
      expect(link).toHaveAttribute("href", "/settings#school-information");
    }
  });

  it("shows the school name and real meal result when enabled", async () => {
    vi.mocked(fetchTodayMeal).mockResolvedValueOnce({ status: "ready", date: "2026-07-23", menu: ["현미밥"], calories: "650 Kcal" });
    render(await MealCard({ date: "2026-07-23", school }));
    expect(screen.getByText(/여의도고등학교/)).toBeInTheDocument();
    expect(screen.getByText("현미밥")).toBeInTheDocument();
  });

  it("shows disabled cards and a settings path instead of hiding them", async () => {
    const disabled = { ...school, mealEnabled: false, weatherEnabled: false };
    render(await MealCard({ date: "2026-07-23", school: disabled }));
    render(<WeatherCard school={disabled} />);
    expect(screen.getByText("오늘의 급식 사용이 꺼져 있습니다.")).toBeInTheDocument();
    expect(screen.getByText("오늘의 날씨 사용이 꺼져 있습니다.")).toBeInTheDocument();
    expect(fetchTodayMeal).not.toHaveBeenCalled();
  });

  it("labels enabled weather as pending without fake weather data", () => {
    render(<WeatherCard school={school} />);
    expect(screen.getByText("학교 지역 날씨 연동을 준비하고 있습니다.")).toBeInTheDocument();
    expect(screen.getByText(/서울특별시/)).toBeInTheDocument();
  });
});
