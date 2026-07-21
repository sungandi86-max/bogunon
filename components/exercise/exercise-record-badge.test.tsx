import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExerciseRecordBadge } from "@/components/exercise/exercise-record-badge";

describe("ExerciseRecordBadge", () => {
  it("does not render a badge for a quick exercise", () => {
    const { container } = render(<ExerciseRecordBadge recordType="exercise" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders accessible lesson and competition labels", () => {
    const { rerender } = render(<ExerciseRecordBadge recordType="lesson" />);
    expect(screen.getByText("레슨")).toHaveAttribute("data-record-type", "lesson");
    rerender(<ExerciseRecordBadge compact recordType="competition" />);
    expect(screen.getByText("대회")).toHaveAttribute("data-record-type", "competition");
  });
});
