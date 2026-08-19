import { calculateHealthSupportInstructorManager } from "@/lib/health-support-instructors/domain";

type SettlementInstructor = {
  readonly id: string;
  readonly name: string;
  readonly subject: string;
  readonly hourlyRate: number;
  readonly monthlyInsurance: number;
  readonly monthlyHourLimit: number;
  readonly weeklyHourLimit: number;
  readonly totalBudget: number;
};

type SettlementWorkLog = {
  readonly instructorId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
};

export type HealthSupportSettlementDocumentInput = {
  readonly instructor: SettlementInstructor;
  readonly month: string;
  readonly workLogs: readonly SettlementWorkLog[];
};

type SettlementWarning =
  | { readonly kind: "weeklyWarning"; readonly isoWeekKey: string; readonly hours: number; readonly warningHours: number; readonly limitHours: number }
  | { readonly kind: "weeklyLimit"; readonly isoWeekKey: string; readonly hours: number; readonly limitHours: number }
  | { readonly kind: "monthlyLimit"; readonly month: string; readonly hours: number; readonly limitHours: number };

type MonthlyWorkDetailRow = {
  readonly date: string;
  readonly weekday: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly hours: number;
};

export type HealthSupportSettlementDocuments = {
  readonly settlement: {
    readonly instructorId: string;
    readonly instructorName: string;
    readonly subject: string;
    readonly month: string;
    readonly hourlyRate: number;
    readonly hours: number;
    readonly wages: number;
    readonly insurance: number;
    readonly total: number;
    readonly monthlyLimitWarning: boolean;
  };
  readonly paymentStatement: {
    readonly instructorId: string;
    readonly month: string;
    readonly hourlyRate: number;
    readonly hours: number;
    readonly amount: number;
  };
  readonly monthlyWorkDetail: {
    readonly instructorId: string;
    readonly month: string;
    readonly rows: readonly MonthlyWorkDetailRow[];
    readonly totalHours: number;
  };
  readonly warnings: readonly SettlementWarning[];
  readonly budget: {
    readonly total: number;
    readonly spent: number;
    readonly remaining: number;
    readonly status: "execution" | "overrun";
  };
};

export function createHealthSupportSettlementDocuments(input: HealthSupportSettlementDocumentInput): HealthSupportSettlementDocuments {
  const instructorLogs = input.workLogs.filter((log) => log.instructorId === input.instructor.id);
  const calculation = calculateHealthSupportInstructorManager({
    budget: input.instructor.totalBudget,
    hourlyRate: input.instructor.hourlyRate,
    monthlyInsuranceRate: input.instructor.monthlyInsurance,
    monthlyLimitHours: input.instructor.monthlyHourLimit,
    weeklyLimitHours: input.instructor.weeklyHourLimit,
    workLogs: instructorLogs,
  });
  const settlement = calculation.monthlySettlements.find((candidate) => candidate.instructorId === input.instructor.id && candidate.month === input.month);
  const hours = settlement?.hours ?? 0;
  const wages = settlement?.wages ?? 0;
  const insurance = settlement?.insurance ?? 0;
  const spent = settlement?.total ?? 0;
  const rows = calculation.workLogs
    .filter((log) => log.date.slice(0, 7) === input.month)
    .map((log) => ({ date: log.date, weekday: log.weekday, startTime: log.startTime, endTime: log.endTime, hours: log.hours }))
    .sort((left, right) => left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime));
  const monthIsoWeekKeys = calculation.workLogs
    .filter((log) => log.date.slice(0, 7) === input.month)
    .map((log) => log.isoWeek.key);

  return {
    settlement: {
      instructorId: input.instructor.id,
      instructorName: input.instructor.name,
      subject: input.instructor.subject,
      month: input.month,
      hourlyRate: input.instructor.hourlyRate,
      hours,
      wages,
      insurance,
      total: settlement?.total ?? 0,
      monthlyLimitWarning: settlement?.monthlyLimitWarning ?? false,
    },
    paymentStatement: { instructorId: input.instructor.id, month: input.month, hourlyRate: input.instructor.hourlyRate, hours, amount: wages },
    monthlyWorkDetail: { instructorId: input.instructor.id, month: input.month, rows, totalHours: hours },
    warnings: settlementWarnings({ calculation, instructor: input.instructor, month: input.month, monthlyHours: hours, monthIsoWeekKeys }),
    budget: {
      total: input.instructor.totalBudget,
      spent,
      remaining: input.instructor.totalBudget - spent,
      status: spent > input.instructor.totalBudget ? "overrun" : "execution",
    },
  };
}

function settlementWarnings(input: {
  readonly calculation: ReturnType<typeof calculateHealthSupportInstructorManager>;
  readonly instructor: SettlementInstructor;
  readonly month: string;
  readonly monthlyHours: number;
  readonly monthIsoWeekKeys: readonly string[];
}): readonly SettlementWarning[] {
  const weeklyWarnings = input.calculation.weeklyTotals
    .filter((total) => total.instructorId === input.instructor.id && input.monthIsoWeekKeys.includes(total.isoWeekKey) && total.status !== "normal")
    .map((total): SettlementWarning => total.status === "overflow"
      ? { kind: "weeklyLimit", isoWeekKey: total.isoWeekKey, hours: total.hours, limitHours: input.instructor.weeklyHourLimit }
      : { kind: "weeklyWarning", isoWeekKey: total.isoWeekKey, hours: total.hours, warningHours: 14, limitHours: input.instructor.weeklyHourLimit });
  const monthlyWarning: readonly SettlementWarning[] = input.monthlyHours >= input.instructor.monthlyHourLimit
    ? [{ kind: "monthlyLimit", month: input.month, hours: input.monthlyHours, limitHours: input.instructor.monthlyHourLimit }]
    : [];
  return [...weeklyWarnings, ...monthlyWarning];
}
