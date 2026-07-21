import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { DEFAULT_EXERCISE_STICKERS } from "@/lib/exercise/stickers";

const sticker = { icon_key: "badminton" as const, label: "배드민턴", color_key: "mint" as const };
const renderedIconSizes = [
  ["xs", "16"],
  ["sm", "20"],
  ["md", "24"],
  ["lg", "32"],
] as const;

type PathPoint = [number, number];

function isPathCommand(token: string): boolean {
  return /^[A-Za-z]$/.test(token);
}

function pathPoints(pathData: string): readonly PathPoint[] {
  const tokens = pathData.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const points: PathPoint[] = [];
  let index = 0;
  let command = "";
  let current: PathPoint = [0, 0];

  function hasNumber(): boolean {
    const token = tokens[index];
    return token !== undefined && !isPathCommand(token);
  }

  function readNumber(): number {
    const token = tokens[index];
    if (token === undefined || isPathCommand(token)) throw new Error(`Expected path number at token ${index}`);
    index += 1;
    return Number(token);
  }

  function pushPoint(x: number, y: number): void {
    current = [x, y];
    points.push(current);
  }

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) break;
    if (isPathCommand(token)) {
      command = token;
      index += 1;
    }

    if (command === "M" || command === "L") {
      while (hasNumber()) {
        pushPoint(readNumber(), readNumber());
        if (command === "M") command = "L";
      }
    } else if (command === "l") {
      while (hasNumber()) pushPoint(current[0] + readNumber(), current[1] + readNumber());
    } else if (command === "v") {
      while (hasNumber()) pushPoint(current[0], current[1] + readNumber());
    } else if (command === "a") {
      while (hasNumber()) {
        readNumber();
        readNumber();
        readNumber();
        readNumber();
        readNumber();
        pushPoint(current[0] + readNumber(), current[1] + readNumber());
      }
    } else if (command === "Z" || command === "z") {
      continue;
    } else {
      throw new Error(`Unsupported path command ${command}`);
    }
  }

  return points;
}

function widestDistance(points: readonly PathPoint[]): number {
  let widest = 0;
  for (const first of points) {
    for (const second of points) {
      widest = Math.max(widest, Math.hypot(first[0] - second[0], first[1] - second[1]));
    }
  }
  return widest;
}

function horizontalSpread(points: readonly PathPoint[]): number {
  const xCoordinates = points.map(([x]) => x);
  return Math.max(...xCoordinates) - Math.min(...xCoordinates);
}

function verticalSpread(points: readonly PathPoint[]): number {
  const yCoordinates = points.map(([, y]) => y);
  return Math.max(...yCoordinates) - Math.min(...yCoordinates);
}

function pointsForPart(container: HTMLElement, part: string): readonly PathPoint[] {
  return [...container.querySelectorAll(`[data-shuttlecock-part="${part}"]`)]
    .flatMap((path) => pathPoints(path.getAttribute("d") ?? ""));
}

describe("ExerciseSticker", () => {
  it("renders stable icon keys as currentColor line icons without image assets", () => {
    const { container } = render(<ExerciseSticker sticker={sticker} size="lg" />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("stroke", "currentColor");
  });

  it("maps the legacy badminton lesson key to the same glyph without adding a record type", () => {
    const { container: badminton } = render(<ExerciseSticker sticker={sticker} />);
    const { container: lessonKey } = render(<ExerciseSticker sticker={{ ...sticker, icon_key: "badminton_lesson" }} />);
    expect(lessonKey.querySelector("svg")?.innerHTML).toBe(badminton.querySelector("svg")?.innerHTML);
    expect(lessonKey.querySelector("[data-record-type]")).not.toBeInTheDocument();
  });

  it.each(renderedIconSizes)("renders the %s sticker shuttlecock glyph at %spx", (size, pixels) => {
    const { container } = render(<ExerciseSticker sticker={sticker} size={size} />);
    const svg = container.querySelector('[data-exercise-icon="badminton"]');
    expect(svg).toHaveAttribute("width", pixels);
    expect(svg).toHaveAttribute("height", pixels);
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("uses one option-2 currentColor shuttlecock with three simple feather faces and two motion lines", () => {
    const { container } = render(<ExerciseSticker sticker={sticker} />);
    const svg = container.querySelector('[data-exercise-icon="badminton"]');
    const cork = container.querySelectorAll('[data-shuttlecock-part="cork"]');
    const featherFaces = container.querySelectorAll('[data-shuttlecock-part="feather-face"]');
    const featherSeparators = container.querySelectorAll('[data-shuttlecock-part="feather-separation"]');
    const motionLines = container.querySelectorAll('[data-shuttlecock-part="motion-line"]');

    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("stroke-linecap", "round");
    expect(svg).toHaveAttribute("stroke-linejoin", "round");
    expect(svg).toHaveAttribute("stroke-width", "1.8");
    expect(cork).toHaveLength(1);
    expect(featherFaces).toHaveLength(3);
    expect(featherSeparators).toHaveLength(2);
    expect(motionLines).toHaveLength(2);
    expect(container.querySelectorAll("img")).toHaveLength(0);

    const corkPoints = pointsForPart(container, "cork");
    const featherPoints = pointsForPart(container, "feather-face");
    const separatorPoints = pointsForPart(container, "feather-separation");
    const speedLinePoints = pointsForPart(container, "motion-line");

    expect(widestDistance(corkPoints)).toBeGreaterThan(4);
    expect(widestDistance(corkPoints)).toBeLessThan(5);
    expect(horizontalSpread(featherPoints)).toBeGreaterThan(17);
    expect(verticalSpread(featherPoints)).toBeGreaterThan(13);
    expect(separatorPoints.every(([x, y]) => x > 8 && x < 18 && y > 7 && y < 16)).toBe(true);
    expect(speedLinePoints.every(([x, y]) => x < 8 && y > 18)).toBe(true);
  });

  it("keeps the cork short and flares the feather crown at small calendar sizes", () => {
    const { container } = render(<ExerciseSticker sticker={sticker} size="sm" />);

    const corkPath = container.querySelector('[data-shuttlecock-part="cork"]')?.getAttribute("d") ?? "";
    const featherPoints = [...container.querySelectorAll('[data-shuttlecock-part="feather-face"]')]
      .flatMap((path) => pathPoints(path.getAttribute("d") ?? ""));

    expect(widestDistance(pathPoints(corkPath))).toBeGreaterThan(4);
    expect(widestDistance(pathPoints(corkPath))).toBeLessThan(5);
    expect(horizontalSpread(featherPoints)).toBeGreaterThan(17);
  });

  it("uses the accessible fallback glyph for an unknown persisted icon key", () => {
    const { container } = render(<ExerciseSticker sticker={{ ...sticker, icon_key: "future_icon" }} />);
    expect(container.querySelector('[data-exercise-icon="other"]')).toBeInTheDocument();
  });

  it("renders every persisted default icon key as a currentColor glyph", () => {
    const expectedRenderedKeys = {
      badminton: "badminton",
      badminton_lesson: "badminton",
      walking: "walking",
      running: "running",
      strength: "strength",
      stretching: "stretching",
      cycling: "cycling",
      swimming: "swimming",
      other: "other",
    } as const;

    for (const item of DEFAULT_EXERCISE_STICKERS) {
      const { container, unmount } = render(<ExerciseSticker sticker={{ icon_key: item.iconKey, label: item.label }} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("stroke", "currentColor");
      expect(svg).toHaveAttribute("data-exercise-icon", expectedRenderedKeys[item.iconKey]);
      unmount();
    }
  });

  it("announces selected, completed, disabled, and removable states without relying on color", () => {
    render(<ExerciseSticker completed disabled removable selected sticker={sticker} />);
    expect(screen.getByRole("img", { name: /배드민턴 운동 스티커, 선택됨, 완료, 비활성, 제거 가능/ })).toBeInTheDocument();
  });
});
