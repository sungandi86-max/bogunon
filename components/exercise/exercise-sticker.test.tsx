import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExerciseSticker } from "@/components/exercise/exercise-sticker";

const sticker = { icon_key: "badminton" as const, label: "배드민턴", color_key: "mint" as const };

describe("ExerciseSticker", () => {
  it("maps the stable icon key to a local SVG asset", () => {
    const { container } = render(<ExerciseSticker sticker={sticker} size="lg" />);
    expect(container.querySelector("img")).toHaveAttribute("src", expect.stringContaining("/stickers/exercise/badminton.svg"));
  });

  it("announces selected, completed, disabled, and removable states without relying on color", () => {
    render(<ExerciseSticker completed disabled removable selected sticker={sticker} />);
    expect(screen.getByRole("img", { name: /배드민턴 운동 스티커, 선택됨, 완료, 비활성, 제거 가능/ })).toBeInTheDocument();
  });
});
