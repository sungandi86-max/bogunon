import type {
  EventRow,
  ProjectChecklistItemRow,
  ProjectExpenseRow,
  ProjectFileRow,
  ProjectReservationRow,
  ProjectRow,
} from "@/types/database";
import { reservationEndDate } from "@/lib/projects/reservations";

const TRAVEL_RESERVATION_TYPES = new Set<ProjectReservationRow["type"]>([
  "flight",
  "hotel",
  "rental_car",
]);

type TravelTodayInput = {
  readonly checklistItems: readonly ProjectChecklistItemRow[];
  readonly events: readonly EventRow[];
  readonly expenses: readonly ProjectExpenseRow[];
  readonly files: readonly ProjectFileRow[];
  readonly project: ProjectRow;
  readonly reservations: readonly ProjectReservationRow[];
  readonly today: string;
};

export type TravelToday = {
  readonly checklistItems: readonly ProjectChecklistItemRow[];
  readonly dayLabel: string;
  readonly events: readonly EventRow[];
  readonly files: readonly ProjectFileRow[];
  readonly nextEvent: EventRow | undefined;
  readonly paidAmount: number;
  readonly plannedAmount: number;
  readonly reservations: readonly ProjectReservationRow[];
};

function dateToDay(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

function compareEventTime(left: EventRow, right: EventRow): number {
  if (left.is_all_day !== right.is_all_day) return left.is_all_day ? -1 : 1;
  return (left.start_time ?? "99:99:99").localeCompare(right.start_time ?? "99:99:99");
}

export function isTravelProject(
  project: ProjectRow,
  reservations: readonly ProjectReservationRow[],
): boolean {
  if (project.icon === "travel") return true;
  const searchable = `${project.name} ${project.description ?? ""}`.toLocaleLowerCase("ko-KR");
  if (/(여행|휴가|제주|travel|trip)/u.test(searchable)) return true;
  return reservations.some((reservation) => TRAVEL_RESERVATION_TYPES.has(reservation.type));
}

export function projectTravelDayLabel(project: ProjectRow, today: string): string {
  if (!project.start_date) return "기간 미정";
  const startDifference = dateToDay(project.start_date) - dateToDay(today);
  if (startDifference > 0) return `D-${startDifference}`;
  if (project.end_date && today > project.end_date) return "여행 종료";
  return `여행 ${Math.abs(startDifference) + 1}일차`;
}

export function buildTravelToday(input: TravelTodayInput): TravelToday {
  const todayReservations = input.reservations
    .filter((reservation) => (
      reservation.reservation_date <= input.today
      && reservationEndDate(reservation) >= input.today
    ))
    .sort((left, right) => (
      (left.start_time ?? "99:99:99").localeCompare(right.start_time ?? "99:99:99")
    ));
  const todayReservationIds = new Set(todayReservations.map((reservation) => reservation.id));
  const todayExpenses = input.expenses.filter((expense) => (
    expense.expense_date === input.today
    || (expense.reservation_id !== null && todayReservationIds.has(expense.reservation_id))
  ));

  return {
    checklistItems: input.checklistItems.filter((item) => (
      !item.is_completed && item.due_date === input.today
    )),
    dayLabel: projectTravelDayLabel(input.project, input.today),
    events: input.events
      .filter((event) => event.start_date <= input.today && event.end_date >= input.today)
      .sort(compareEventTime),
    files: input.files.filter((file) => (
      file.reservation_id !== null && todayReservationIds.has(file.reservation_id)
    )),
    nextEvent: input.events
      .filter((event) => event.start_date > input.today)
      .sort((left, right) => (
        left.start_date.localeCompare(right.start_date) || compareEventTime(left, right)
      ))[0],
    paidAmount: todayExpenses
      .filter((expense) => expense.payment_status === "paid")
      .reduce((total, expense) => total + expense.amount, 0),
    plannedAmount: todayExpenses
      .filter((expense) => expense.payment_status === "planned")
      .reduce((total, expense) => total + expense.amount, 0),
    reservations: todayReservations,
  };
}
