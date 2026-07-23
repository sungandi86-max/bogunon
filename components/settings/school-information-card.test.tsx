import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearUserSchoolSettingsAction,
  saveUserSchoolSettingsAction,
} from "@/app/(app)/settings/school-actions";
import { searchNeisSchoolsAction } from "@/app/(app)/neis-academic-calendar-actions";
import { SchoolInformationCard } from "@/components/settings/school-information-card";

vi.mock("@/app/(app)/settings/school-actions", () => ({
  clearUserSchoolSettingsAction: vi.fn(),
  saveUserSchoolSettingsAction: vi.fn(),
}));
vi.mock("@/app/(app)/neis-academic-calendar-actions", () => ({
  searchNeisSchoolsAction: vi.fn(),
}));

const school = {
  officeCode: "B10",
  schoolCode: "7010082",
  name: "여의도고등학교",
  type: "고등학교",
  region: "서울특별시",
  officeName: "서울특별시교육청",
  address: "서울특별시 영등포구 국제금융로7길 37",
};

const savedSchool = {
  officeCode: school.officeCode,
  schoolCode: school.schoolCode,
  name: school.name,
  officeName: school.officeName,
  schoolLevel: school.type,
  region: school.region,
  address: school.address,
  latitude: null,
  longitude: null,
  mealEnabled: true,
  weatherEnabled: false,
};

describe("SchoolInformationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchNeisSchoolsAction).mockResolvedValue({ status: "success", schools: [school] });
    vi.mocked(saveUserSchoolSettingsAction).mockResolvedValue({ status: "success", message: "학교 설정이 저장되었습니다." });
    vi.mocked(clearUserSchoolSettingsAction).mockResolvedValue({ status: "success", message: "학교 정보를 초기화했습니다." });
  });

  it("searches, selects, and saves a school with toggle preferences", async () => {
    render(<SchoolInformationCard initialSchool={null} />);
    expect(screen.getByPlaceholderText("학교명을 입력하세요")).toBeInTheDocument();
    expect(screen.getByText("예) 여의도고등학교")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("학교 검색"), { target: { value: "여의도고" } });
    fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));
    fireEvent.click(await screen.findByRole("button", { name: "여의도고등학교 선택" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "오늘 화면에 날씨 표시" }));
    fireEvent.click(screen.getByRole("button", { name: "학교 정보 저장" }));

    await waitFor(() => expect(saveUserSchoolSettingsAction).toHaveBeenCalledWith(expect.objectContaining({
      schoolCode: "7010082",
      mealEnabled: true,
      weatherEnabled: false,
    })));
    expect(await screen.findByText("학교 설정이 저장되었습니다.")).toBeInTheDocument();
  });

  it("presents the revised toggle copy and change-save-reset action flow", () => {
    const { container } = render(<SchoolInformationCard initialSchool={savedSchool} />);
    expect(screen.getByText("오늘 화면에 급식 표시")).toBeInTheDocument();
    expect(screen.getByText("급식 카드 표시 여부를 설정합니다.")).toBeInTheDocument();
    expect(screen.getByText("오늘 화면에 날씨 표시")).toBeInTheDocument();
    expect(screen.getByText("날씨 카드 표시 여부를 설정합니다.")).toBeInTheDocument();

    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>(".school-settings-actions button"));
    expect(buttons.map((button) => button.textContent)).toEqual([
      "학교 변경",
      "학교 정보 저장",
      "학교 정보 초기화",
    ]);
    expect(buttons[0]).toHaveClass("button--secondary");
    expect(buttons[1]).toHaveClass("button--primary");
    expect(buttons[2]).toHaveClass("button--danger");
  });

  it("shows a search failure", async () => {
    vi.mocked(searchNeisSchoolsAction).mockResolvedValueOnce({ status: "error", code: "network-error", message: "NEIS 서비스에 연결하지 못했습니다." });
    render(<SchoolInformationCard initialSchool={null} />);
    fireEvent.change(screen.getByLabelText("학교 검색"), { target: { value: "여의도고" } });
    fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("NEIS 서비스에 연결하지 못했습니다.");
  });

  it("loads, changes, and resets an existing school after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    render(<SchoolInformationCard initialSchool={savedSchool} />);
    expect(screen.getByText("7010082")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "학교 변경" }));
    expect(screen.getByLabelText("학교 검색")).toBeInTheDocument();

    render(<SchoolInformationCard initialSchool={savedSchool} />);
    fireEvent.click(screen.getAllByRole("button", { name: "학교 정보 초기화" })[0]!);
    await waitFor(() => expect(clearUserSchoolSettingsAction).toHaveBeenCalledOnce());
  });

  it("prevents duplicate save clicks while a request is pending", async () => {
    let resolveSave!: (value: { status: "success"; message: string }) => void;
    vi.mocked(saveUserSchoolSettingsAction).mockReturnValueOnce(new Promise((resolve) => { resolveSave = resolve; }));
    render(<SchoolInformationCard initialSchool={savedSchool} />);
    fireEvent.click(screen.getByRole("button", { name: "학교 정보 저장" }));
    expect(screen.getByRole("button", { name: "저장 중…" })).toBeDisabled();
    resolveSave({ status: "success", message: "학교 설정이 저장되었습니다." });
    await screen.findByText("학교 설정이 저장되었습니다.");
  });
});
