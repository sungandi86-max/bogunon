import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsForm } from "@/components/settings/settings-form";
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/domain";

vi.mock("@/app/(app)/settings/actions", () => ({ saveSettingsAction: vi.fn(async () => ({ status: "success", message: "설정을 저장했습니다." })) }));

describe("SettingsForm", () => {
  it("shows defaults and connected account without a false empty state", () => {
    render(<SettingsForm email="teacher@example.com" initialValues={DEFAULT_USER_SETTINGS} />);
    expect(screen.getByLabelText("시작 요일")).toHaveValue("monday");
    expect(screen.getByLabelText("기본 일정 시간")).toHaveValue("30");
    expect(screen.getByText("teacher@example.com")).toBeInTheDocument();
    expect(screen.getByText("동기화됨")).toBeInTheDocument();
    expect(screen.queryByText("저장된 설정이 없습니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("계정 연결 후 설정을 저장할 수 있습니다.")).not.toBeInTheDocument();
  });
});
