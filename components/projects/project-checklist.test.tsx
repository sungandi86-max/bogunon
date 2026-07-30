import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectChecklist } from "@/components/projects/project-checklist";
import type { ProjectChecklistItemRow } from "@/types/database";

const createChecklistItemAction = vi.fn();
const deleteChecklistItemAction = vi.fn();
const deleteCompletedChecklistItemsAction = vi.fn();
const reorderProjectChecklistItemsAction = vi.fn();
const updateChecklistItemAction = vi.fn();

vi.mock("@/app/(app)/projects/checklist-actions", () => ({
  createChecklistItemAction: (...args: readonly unknown[]) => createChecklistItemAction(...args),
  deleteChecklistItemAction: (...args: readonly unknown[]) => deleteChecklistItemAction(...args),
  deleteCompletedChecklistItemsAction: (...args: readonly unknown[]) => deleteCompletedChecklistItemsAction(...args),
  reorderProjectChecklistItemsAction: (...args: readonly unknown[]) => reorderProjectChecklistItemsAction(...args),
  updateChecklistItemAction: (...args: readonly unknown[]) => updateChecklistItemAction(...args),
}));

const completedItem: ProjectChecklistItemRow = {
    id: "item-1",
    user_id: "user-1",
    project_id: "project-1",
    title: "항공권 확인",
    is_completed: true,
    sort_order: 0,
    due_date: "2026-07-27",
    created_at: "",
    updated_at: "",
};

const activeItem: ProjectChecklistItemRow = {
    id: "item-2",
    user_id: "user-1",
    project_id: "project-1",
    title: "라켓 챙기기",
    is_completed: false,
    sort_order: 1,
    due_date: null,
    created_at: "",
    updated_at: "",
};

const initialItems: readonly ProjectChecklistItemRow[] = [completedItem, activeItem];

describe("ProjectChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds an item with Enter and updates the completion count", async () => {
    createChecklistItemAction.mockResolvedValue({
      status: "success",
      message: "체크리스트 항목을 추가했습니다.",
      item: { ...activeItem, id: "item-3", title: "충전기 챙기기", sort_order: 2 },
    });
    render(<ProjectChecklist initialItems={initialItems} projectId="project-1" today="2026-07-27" />);

    expect(screen.getByRole("heading", { name: "체크리스트 1/2" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "새 체크리스트 항목" }), {
      target: { value: "충전기 챙기기" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "새 체크리스트 항목" }), { key: "Enter" });

    expect(await screen.findByText("충전기 챙기기")).toBeInTheDocument();
    expect(createChecklistItemAction).toHaveBeenCalledWith({
      dueDate: null,
      projectId: "project-1",
      title: "충전기 챙기기",
    });
  });

  it("toggles completion and hides completed items without losing the count", async () => {
    updateChecklistItemAction.mockResolvedValue({
      status: "success",
      message: "체크리스트를 수정했습니다.",
      item: { ...activeItem, is_completed: true },
    });
    render(<ProjectChecklist initialItems={initialItems} projectId="project-1" today="2026-07-27" />);

    fireEvent.click(screen.getByRole("checkbox", { name: "라켓 챙기기 완료" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "체크리스트 2/2" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "완료 항목 숨기기" }));
    expect(screen.queryByText("항공권 확인")).not.toBeInTheDocument();
    expect(screen.getByText("완료 항목 2개를 숨겼습니다.")).toBeInTheDocument();
  });

  it("supports title editing, due status, mobile movement, and confirmed bulk deletion", async () => {
    updateChecklistItemAction.mockImplementation(async (input: { readonly title?: string }) => ({
      status: "success",
      message: "체크리스트를 수정했습니다.",
      item: { ...activeItem, title: input.title ?? activeItem.title },
    }));
    reorderProjectChecklistItemsAction.mockResolvedValue({ status: "success", message: "순서를 저장했습니다." });
    deleteCompletedChecklistItemsAction.mockResolvedValue({
      status: "success",
      message: "완료 항목을 삭제했습니다.",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ProjectChecklist initialItems={initialItems} projectId="project-1" today="2026-07-27" />);

    expect(screen.getByText("오늘 마감")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "라켓 챙기기 수정" }));
    fireEvent.change(screen.getByRole("textbox", { name: "체크리스트 제목 수정" }), {
      target: { value: "배드민턴 라켓" },
    });
    fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
    expect(await screen.findByText("배드민턴 라켓")).toBeInTheDocument();

    const row = screen.getByText("배드민턴 라켓").closest("li");
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "배드민턴 라켓 위로 이동" }));
    await waitFor(() => expect(reorderProjectChecklistItemsAction).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "완료 항목 삭제" }));
    await waitFor(() => expect(deleteCompletedChecklistItemsAction).toHaveBeenCalledWith({ projectId: "project-1" }));
    expect(screen.queryByText("항공권 확인")).not.toBeInTheDocument();
  });

  it("persists desktop drag ordering while keeping mobile controls available", async () => {
    reorderProjectChecklistItemsAction.mockResolvedValue({ status: "success", message: "순서를 저장했습니다." });
    render(
      <ProjectChecklist
        desktopDragEnabled
        initialItems={initialItems}
        projectId="project-1"
        today="2026-07-27"
      />,
    );

    const source = screen.getByText("라켓 챙기기").closest("li");
    const target = screen.getByText("항공권 확인").closest("li");
    expect(source).not.toBeNull();
    expect(target).not.toBeNull();
    fireEvent.dragStart(source as HTMLElement);
    fireEvent.dragOver(target as HTMLElement);
    fireEvent.drop(target as HTMLElement);
    fireEvent.dragEnd(source as HTMLElement);

    await waitFor(() => expect(reorderProjectChecklistItemsAction).toHaveBeenCalledWith({
      itemIds: ["item-2", "item-1"],
      projectId: "project-1",
    }));
    expect(reorderProjectChecklistItemsAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "라켓 챙기기 아래로 이동" })).toBeInTheDocument();
  });

  it("offers project-type recommendations and adds all without requiring manual entry", async () => {
    createChecklistItemAction
      .mockResolvedValueOnce({
        status: "success",
        message: "체크리스트 항목을 추가했습니다.",
        item: { ...activeItem, id: "travel-1", title: "캐리어", sort_order: 0 },
      })
      .mockResolvedValueOnce({
        status: "success",
        message: "체크리스트 항목을 추가했습니다.",
        item: { ...activeItem, id: "travel-2", title: "충전기", sort_order: 1 },
      })
      .mockResolvedValueOnce({
        status: "success",
        message: "체크리스트 항목을 추가했습니다.",
        item: { ...activeItem, id: "travel-3", title: "보조배터리", sort_order: 2 },
      })
      .mockResolvedValueOnce({
        status: "success",
        message: "체크리스트 항목을 추가했습니다.",
        item: { ...activeItem, id: "travel-4", title: "신분증", sort_order: 3 },
      });

    render(
      <ProjectChecklist
        initialItems={[]}
        projectId="project-1"
        projectType="travel"
        today="2026-07-27"
      />,
    );

    expect(screen.getByText("추천 체크리스트")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "추천 항목 모두 추가" }));

    await waitFor(() => expect(createChecklistItemAction).toHaveBeenCalledTimes(4));
    expect(createChecklistItemAction).toHaveBeenNthCalledWith(1, {
      dueDate: null,
      projectId: "project-1",
      title: "캐리어",
    });
    expect(await screen.findByText("신분증")).toBeInTheDocument();
  });
});
