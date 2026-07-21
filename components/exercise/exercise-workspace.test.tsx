import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExerciseWorkspace } from "@/components/exercise/exercise-workspace";
import { serializeExerciseMetadata } from "@/lib/exercise/domain";
import type { EventRow, ExerciseLogRow, ExerciseRecordType, ExerciseStickerRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  attach: vi.fn(async (): Promise<import("@/app/(app)/exercise-sticker-actions").ExerciseCreateActionState> => ({ status: "success", outcome: "created", message: "저장", logId: "20000000-0000-4000-8000-000000000002", recordType: "lesson" })),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/app/(app)/exercise-sticker-actions", () => ({
  attachExerciseStickerAction: mocks.attach,
  removeExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "운동 스티커를 떼었어요." })),
  updateExerciseStickerDetailsAction: vi.fn(async () => ({ status: "success", message: "운동 기록을 저장했어요." })),
  saveCustomExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "내 스티커를 만들었어요." })),
  removeCustomExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "내 스티커를 삭제했어요." })),
  saveLessonReviewAction: vi.fn(async () => ({ status: "success", message: "레슨 리뷰를 저장했어요." })),
  deleteLessonReviewAction: vi.fn(async () => ({ status: "success", message: "레슨 리뷰를 삭제했어요." })),
  saveCompetitionReviewAction: vi.fn(async () => ({ status: "success", message: "대회 리뷰를 저장했어요." })),
  deleteCompetitionReviewAction: vi.fn(async () => ({ status: "success", message: "대회 리뷰를 삭제했어요." })),
}));

type MockPickerProps = {
  readonly date: string;
  readonly onCreated?: (log: { readonly logId: string; readonly recordType: ExerciseRecordType }) => void;
};
type MockReviewLog = ExerciseLogRow & {
  readonly lessonReview?: { readonly lesson_focus: string | null } | null;
  readonly competitionReview?: { readonly event_category: string | null; readonly final_result: string | null } | null;
};

vi.mock("@/components/exercise/exercise-sticker-picker", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    ExerciseStickerPicker({ date, onCreated }: MockPickerProps) {
      const [message, setMessage] = React.useState<string | null>(null);

      async function saveRecord(): Promise<void> {
        const state = await mocks.attach();
        setMessage(state.message ?? null);
        if (state.status === "success" && state.outcome === "created") onCreated?.({ logId: state.logId, recordType: state.recordType });
      }

      return <form aria-label="운동 기록 폼">
        <label><span>운동 날짜</span><input aria-label="운동 날짜" name="exerciseDate" readOnly value={date} /></label>
        <label><input defaultChecked name="recordType" type="radio" value="exercise" />일반 운동</label>
        <label><input name="recordType" type="radio" value="lesson" />레슨</label>
        <label><input name="recordType" type="radio" value="competition" />대회</label>
        <button onClick={saveRecord} type="button">운동 기록 저장</button>
        {message && <p>{message}</p>}
      </form>;
    },
  };
});

vi.mock("@/components/exercise/exercise-review-panel", () => ({
  ExerciseReviewPanel({ active }: { readonly active: { readonly recordType: Exclude<ExerciseRecordType, "exercise"> } }) {
    return <p>{active.recordType === "lesson" ? "아직 작성된 레슨 리뷰가 없습니다." : "아직 작성된 대회 리뷰가 없습니다."}</p>;
  },
}));

vi.mock("@/components/exercise/custom-exercise-sticker-form", () => ({ CustomExerciseStickerForm: () => null }));

vi.mock("@/components/exercise/exercise-card", () => ({
  ExerciseCard({ record }: { readonly record: { readonly memo: string | null; readonly title: string } }) {
    return <article>{record.memo ?? record.title}</article>;
  },
}));

vi.mock("@/components/exercise/exercise-log-details", () => ({
  ExerciseLogDetails({ logs, stickers }: { readonly logs: readonly MockReviewLog[]; readonly stickers: readonly ExerciseStickerRow[] }) {
    return <div>{logs.map((item) => {
      const label = stickers.find((candidate) => candidate.id === item.sticker_id)?.label ?? item.sticker_id;
      const lesson = item.lessonReview ?? null;
      const competition = item.competitionReview ?? null;
      return <article key={item.id}>
        <p>{label}</p>
        {item.record_type === "lesson" && <p>레슨</p>}
        {item.record_type === "competition" && <p>대회</p>}
        {lesson?.lesson_focus && <p className="exercise-log-summary__line">{lesson.lesson_focus}</p>}
        {competition?.event_category && <p>{competition.event_category}</p>}
        {competition?.final_result && <p>{competition.final_result}</p>}
        {(lesson || competition) && <>
          <span className="exercise-log-detail__summary" />
          <span className="exercise-log-detail__summary" />
        </>}
      </article>;
    })}</div>;
  },
}));

vi.mock("@/components/exercise/exercise-sticker-calendar", () => ({
  ExerciseStickerCalendar({ logs, month, onSelectDate, selectedDate, stickers }: {
    readonly logs: readonly ExerciseLogRow[];
    readonly month: string;
    readonly onSelectDate: (date: string) => void;
    readonly selectedDate: string;
    readonly stickers: readonly ExerciseStickerRow[];
  }) {
    const [year, monthValue, day] = selectedDate.split("-");
    const firstSticker = stickers[0];
    return <section>
      <h2>{`${year}. ${monthValue}. ${day}`}</h2>
      <button onClick={() => onSelectDate(`${month}-19`)} type="button">19</button>
      {firstSticker && <button aria-label={`18 ${firstSticker.label} 운동 스티커`} type="button">
        <span aria-label={`${firstSticker.label} 운동 스티커`} className="exercise-sticker--sm" role="img" />
        <span>{firstSticker.label}</span>
      </button>}
      {logs.length > 0 && <p>이번 달 운동 1일 · 연속 1일</p>}
      {logs.length > 2 && <span>+1</span>}
      {logs.some((item) => item.record_type === "lesson") && <span>레슨</span>}
    </section>;
  },
}));

const sticker: ExerciseStickerRow = { id: "10000000-0000-4000-8000-000000000001", user_id: null, label: "배드민턴", icon_key: "badminton", color_key: "mint", display_order: 10, is_default: true, created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };
const log: ExerciseLogRow & { readonly lessonReview: null; readonly competitionReview: null } = { id: "20000000-0000-4000-8000-000000000001", user_id: "user-1", sticker_id: sticker.id, exercise_date: "2026-07-18", duration_minutes: null, note: null, record_type: "exercise", lessonReview: null, competitionReview: null, created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };
const event: EventRow = { id: "event-1", user_id: "user-1", title: "배드민턴", area: "exercise", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "19:00:00", end_time: "20:30:00", memo: "[QA-EX] 운동 전용 폼 저장 및 새로고침 검증", description: serializeExerciseMetadata({ durationMinutes: 90, intensity: "moderate", location: "학교 체육관", recurrence: "weekly", status: "planned" }), created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };

afterEach(() => {
  vi.clearAllMocks();
  mocks.attach.mockResolvedValue({ status: "success", outcome: "created", message: "저장", logId: "20000000-0000-4000-8000-000000000002", recordType: "lesson" });
});

describe("ExerciseWorkspace", () => {
  it("opens the reusable exercise record sheet from the navigation route", () => {
    render(<ExerciseWorkspace events={[]} initialOpen logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    expect(screen.getByRole("dialog", { name: "오늘 운동 기록" })).toBeInTheDocument();
    expect(screen.getByLabelText("운동 날짜")).toHaveValue("2026-07-18");
    expect(screen.getByRole("radio", { name: "일반 운동" })).toBeChecked();
    expect(screen.getByRole("button", { name: "운동 기록 저장" })).toBeInTheDocument();
    expect(screen.queryByLabelText("강도")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("장소")).not.toBeInTheDocument();
  });

  it("opens the same sticker picker from the page action", () => {
    render(<ExerciseWorkspace events={[]} logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("button", { name: "운동 기록" }));
    expect(screen.getByRole("dialog", { name: "오늘 운동 기록" })).toBeInTheDocument();
  });

  it("opens the matching review drawer only after a created lesson and returns focus when closed", async () => {
    render(<ExerciseWorkspace events={[]} logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    const createButton = screen.getByRole("button", { name: "운동 기록" });
    fireEvent.click(createButton);
    fireEvent.click(screen.getByRole("radio", { name: "레슨" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));

    expect(await screen.findByRole("dialog", { name: "레슨 리뷰" })).toBeInTheDocument();
    expect(screen.getByText("아직 작성된 레슨 리뷰가 없습니다.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "패널 닫기" }));
    await waitFor(() => expect(createButton).toHaveFocus());
  });

  it("opens the competition review drawer after a created competition", async () => {
    mocks.attach.mockResolvedValueOnce({ status: "success", outcome: "created", message: "저장", logId: "20000000-0000-4000-8000-000000000004", recordType: "competition" });
    render(<ExerciseWorkspace events={[]} initialOpen logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("radio", { name: "대회" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));
    expect(await screen.findByRole("dialog", { name: "대회 리뷰" })).toBeInTheDocument();
    expect(screen.getByText("아직 작성된 대회 리뷰가 없습니다.")).toBeInTheDocument();
  });

  it("closes drawers with Escape and backdrop and returns focus", async () => {
    const { container } = render(<ExerciseWorkspace events={[]} logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    const createButton = screen.getByRole("button", { name: "운동 기록" });
    fireEvent.click(createButton);
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(createButton).toHaveFocus());
    expect(screen.queryByRole("dialog", { name: "오늘 운동 기록" })).not.toBeInTheDocument();

    fireEvent.click(createButton);
    const backdrop = container.querySelector(".overlay");
    expect(backdrop).not.toBeNull();
    if (backdrop) fireEvent.mouseDown(backdrop);
    await waitFor(() => expect(createButton).toHaveFocus());
    expect(screen.queryByRole("dialog", { name: "오늘 운동 기록" })).not.toBeInTheDocument();
  });

  it("keeps the create drawer open and does not open review on a duplicate", async () => {
    mocks.attach.mockResolvedValueOnce({ status: "success", outcome: "duplicate", message: "이미 기록됨" });
    render(<ExerciseWorkspace events={[]} initialOpen logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("radio", { name: "대회" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));

    expect(screen.getByRole("dialog", { name: "오늘 운동 기록" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "대회 리뷰" })).not.toBeInTheDocument();
  });

  it("keeps the create drawer open when the action rejects malformed input", async () => {
    mocks.attach.mockResolvedValueOnce({ status: "error", message: "운동 종류, 날짜와 기록 유형을 확인해 주세요." });
    render(<ExerciseWorkspace events={[]} initialOpen logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("radio", { name: "레슨" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));

    expect(screen.getByRole("dialog", { name: "오늘 운동 기록" })).toBeInTheDocument();
    expect(screen.getByText("운동 종류, 날짜와 기록 유형을 확인해 주세요.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "레슨 리뷰" })).not.toBeInTheDocument();
  });

  it("renders saved stickers on the calendar and keeps optional details behind the record", () => {
    render(<ExerciseWorkspace events={[]} logs={[log]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    const calendarDay = screen.getByRole("button", { name: /18.*배드민턴 운동 스티커/ });
    expect(within(calendarDay).getByRole("img", { name: "배드민턴 운동 스티커" })).toHaveClass("exercise-sticker--sm");
    expect(screen.getAllByText("배드민턴").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("배드민턴 했다!")).not.toBeInTheDocument();
    expect(screen.getByText("이번 달 운동 1일 · 연속 1일")).toBeInTheDocument();
  });

  it("shows review highlights with fixed semantic rows and clamps long Korean copy", () => {
    const lesson = { ...log, id: "lesson-log", record_type: "lesson" as const, lessonReview: { exercise_log_id: "lesson-log", record_type: "lesson" as const, lesson_focus: "드라이브 연결 동작을 아주 길게 반복해서 연습한 기록", learned: null, mistakes: null, coach_feedback: null, next_goal: null, memo: null, created_at: log.created_at, updated_at: log.updated_at } };
    const competition = { ...log, id: "competition-log", record_type: "competition" as const, competitionReview: { exercise_log_id: "competition-log", record_type: "competition" as const, competition_name: null, location: null, event_category: "여자복식 40C", grade: null, partner: null, total_games: 3, wins: 2, losses: 1, final_result: "준우승", strengths: null, improvements: null, next_goal: null, memo: null, created_at: log.created_at, updated_at: log.updated_at } };
    const { container } = render(<ExerciseWorkspace events={[]} logs={[lesson, competition]} month="2026-07" recentLogs={[lesson, competition]} stickers={[sticker]} today="2026-07-18" />);
    expect(screen.getAllByText("레슨").length).toBeGreaterThan(0);
    expect(screen.getAllByText("대회").length).toBeGreaterThan(0);
    expect(screen.getAllByText("드라이브 연결 동작을 아주 길게 반복해서 연습한 기록")[0]).toHaveClass("exercise-log-summary__line");
    expect(screen.getAllByText("여자복식 40C").length).toBeGreaterThan(0);
    expect(screen.getAllByText("준우승").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".exercise-log-detail__summary")).toHaveLength(4);
  });

  it("keeps +N and type badges when several record types share a date", () => {
    const lesson = { ...log, id: "lesson-log", record_type: "lesson" as const };
    const competition = { ...log, id: "competition-log", record_type: "competition" as const };
    render(<ExerciseWorkspace events={[]} logs={[log, lesson, competition]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getAllByText("레슨").length).toBeGreaterThan(0);
  });

  it("keeps the selected-date panel inside the visible month after month navigation", () => {
    const { rerender } = render(<ExerciseWorkspace events={[]} logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("button", { name: "19" }));
    rerender(<ExerciseWorkspace events={[]} logs={[]} month="2026-08" stickers={[sticker]} today="2026-07-18" />);
    expect(screen.getByRole("heading", { name: "2026. 08. 01" })).toBeInTheDocument();
  });

  it("preserves legacy event-based exercise records in a separate section", () => {
    render(<ExerciseWorkspace events={[event]} logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    expect(screen.getByRole("heading", { name: "기존 운동 일정" })).toBeInTheDocument();
    expect(screen.getByText("[QA-EX] 운동 전용 폼 저장 및 새로고침 검증")).toBeInTheDocument();
  });
});
