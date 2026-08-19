import { z } from "zod";

import { parseHealthSupportWorkLog } from "@/lib/health-support-instructors/domain";
import { createClient } from "@/lib/supabase/server";

function isCalendarDate(value: string): boolean {
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function nonnegativeDecimal(maximum: number) {
  return z.number().finite().min(0).max(maximum).refine((value) => Number(value.toFixed(2)) === value, "Must use at most two decimal places");
}

function positiveDecimal(maximum: number) {
  return nonnegativeDecimal(maximum).refine((value) => value > 0, "Must be greater than zero");
}

const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isCalendarDate, "Invalid calendar date");
const instructorIdSchema = z.string().uuid();
const weeklyHoursSchema = nonnegativeDecimal(168), hourlyRateSchema = nonnegativeDecimal(9_999_999_999.99), monthlyInsuranceSchema = nonnegativeDecimal(9_999_999_999.99);
const monthlyHourLimitSchema = positiveDecimal(744), weeklyHourLimitSchema = positiveDecimal(168), totalBudgetSchema = nonnegativeDecimal(999_999_999_999.99);

const instructorInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(160),
  weeklyHours: weeklyHoursSchema,
  hourlyRate: hourlyRateSchema,
  monthlyInsurance: monthlyInsuranceSchema,
  monthlyHourLimit: monthlyHourLimitSchema,
  weeklyHourLimit: weeklyHourLimitSchema,
  totalBudget: totalBudgetSchema,
  operationStartDate: calendarDateSchema,
  operationEndDate: calendarDateSchema,
}).refine((values) => values.operationStartDate <= values.operationEndDate, {
  message: "Operation end date must not be before its start date",
  path: ["operationEndDate"],
});

const workLogNoteSchema = z.string().trim().max(2_000).nullable();

const instructorRowSchema = z.object({
  id: instructorIdSchema,
  user_id: z.string().uuid(),
  name: z.string(),
  subject: z.string(),
  weekly_hours: weeklyHoursSchema,
  hourly_rate: hourlyRateSchema,
  monthly_insurance: monthlyInsuranceSchema,
  monthly_hour_limit: monthlyHourLimitSchema,
  weekly_hour_limit: weeklyHourLimitSchema,
  total_budget: totalBudgetSchema,
  operation_start_date: calendarDateSchema,
  operation_end_date: calendarDateSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

const workLogRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  instructor_id: instructorIdSchema,
  work_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  note: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type HealthSupportInstructorInput = z.output<typeof instructorInputSchema>;
export type HealthSupportInstructor = HealthSupportInstructorInput & { readonly id: string };
export type HealthSupportWorkLogMutation = z.output<typeof parseHealthSupportWorkLogMutationSchema>;
export type HealthSupportWorkLog = HealthSupportWorkLogMutation & { readonly id: string };
export type HealthSupportWorkLogDraft = HealthSupportWorkLogMutation;

const parseHealthSupportWorkLogMutationSchema = z.object({
  instructorId: instructorIdSchema,
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  note: workLogNoteSchema,
}).superRefine((values, context) => {
  const parsed = parseHealthSupportWorkLog(values);
  if (parsed.success) return;
  for (const issue of parsed.error.issues) {
    context.addIssue({ code: "custom", message: issue.message, path: issue.path });
  }
});

type HealthSupportInstructorWrite = {
  readonly name: string; readonly subject: string; readonly weekly_hours: number; readonly hourly_rate: number;
  readonly monthly_insurance: number; readonly monthly_hour_limit: number; readonly weekly_hour_limit: number;
  readonly total_budget: number; readonly operation_start_date: string; readonly operation_end_date: string;
};
type HealthSupportWorkLogWrite = {
  readonly instructor_id: string; readonly work_date: string; readonly start_time: string; readonly end_time: string; readonly note: string | null;
};
type HealthSupportWrite = HealthSupportInstructorWrite | HealthSupportWorkLogWrite | (HealthSupportInstructorWrite & { readonly user_id: string }) | (HealthSupportWorkLogWrite & { readonly user_id: string });

type HealthSupportQueryResult = { readonly data: unknown; readonly error: unknown };

type HealthSupportResultQuery = {
  readonly single: () => Promise<HealthSupportQueryResult>;
  readonly then: (resolve: (result: HealthSupportQueryResult) => unknown) => Promise<unknown>;
};

type HealthSupportFilterQuery = {
  readonly eq: (column: string, value: string) => HealthSupportFilterQuery;
  readonly order: (column: string, options?: { readonly ascending?: boolean }) => HealthSupportFilterQuery;
  readonly then: (resolve: (result: HealthSupportQueryResult) => unknown) => Promise<unknown>;
};

type HealthSupportMutationQuery = {
  readonly select: (columns: string) => HealthSupportResultQuery;
  readonly eq: (column: string, value: string) => HealthSupportMutationQuery;
  readonly then: (resolve: (result: HealthSupportQueryResult) => unknown) => Promise<unknown>;
};

export type HealthSupportInitialQuery = {
  readonly select: (columns: string) => HealthSupportFilterQuery;
  readonly insert: (values: HealthSupportWrite) => HealthSupportMutationQuery;
  readonly update: (values: HealthSupportWrite) => HealthSupportMutationQuery;
  readonly delete: () => HealthSupportMutationQuery;
};

export type HealthSupportQuery = {
  readonly select: (columns: string) => HealthSupportQuery;
  readonly insert: (values: HealthSupportWrite) => HealthSupportQuery;
  readonly update: (values: HealthSupportWrite) => HealthSupportQuery;
  readonly delete: () => HealthSupportQuery;
  readonly eq: (column: string, value: string) => HealthSupportQuery;
  readonly order: (column: string, options?: { readonly ascending?: boolean }) => HealthSupportQuery;
  readonly single: () => Promise<HealthSupportQueryResult>;
  readonly then: (resolve: (result: HealthSupportQueryResult) => unknown) => Promise<unknown>;
};

export type HealthSupportGateway = {
  readonly userId: string;
  readonly from: (table: "health_support_instructors" | "health_support_work_logs") => HealthSupportInitialQuery;
};

function isHealthSupportInitialQuery(value: unknown): value is HealthSupportInitialQuery {
  if (!value || typeof value !== "object") return false;
  return ["select", "insert", "update", "delete"].every((method) => typeof Reflect.get(value, method) === "function");
}

export class HealthSupportInstructorRepositoryError extends Error {
  readonly name = "HealthSupportInstructorRepositoryError";
}

function mapInstructor(row: unknown): HealthSupportInstructor {
  const parsed = instructorRowSchema.parse(row);
  return {
    id: parsed.id,
    name: parsed.name,
    subject: parsed.subject,
    weeklyHours: parsed.weekly_hours,
    hourlyRate: parsed.hourly_rate,
    monthlyInsurance: parsed.monthly_insurance,
    monthlyHourLimit: parsed.monthly_hour_limit,
    weeklyHourLimit: parsed.weekly_hour_limit,
    totalBudget: parsed.total_budget,
    operationStartDate: parsed.operation_start_date,
    operationEndDate: parsed.operation_end_date,
  };
}

function mapWorkLog(row: unknown): HealthSupportWorkLog {
  const parsed = workLogRowSchema.parse(row);
  return {
    id: parsed.id,
    instructorId: parsed.instructor_id,
    date: parsed.work_date,
    startTime: parsed.start_time,
    endTime: parsed.end_time,
    note: parsed.note,
  };
}

function instructorWriteValues(values: HealthSupportInstructorInput): HealthSupportInstructorWrite {
  return {
    name: values.name,
    subject: values.subject,
    weekly_hours: values.weeklyHours,
    hourly_rate: values.hourlyRate,
    monthly_insurance: values.monthlyInsurance,
    monthly_hour_limit: values.monthlyHourLimit,
    weekly_hour_limit: values.weeklyHourLimit,
    total_budget: values.totalBudget,
    operation_start_date: values.operationStartDate,
    operation_end_date: values.operationEndDate,
  };
}

function workLogWriteValues(values: HealthSupportWorkLogMutation): HealthSupportWorkLogWrite {
  return {
    instructor_id: values.instructorId,
    work_date: values.date,
    start_time: values.startTime,
    end_time: values.endTime,
    note: values.note,
  };
}

export function parseHealthSupportInstructorInput(input: unknown): HealthSupportInstructorInput {
  return instructorInputSchema.parse(input);
}

export function parseHealthSupportWorkLogMutation(input: unknown) {
  return parseHealthSupportWorkLogMutationSchema.safeParse(input);
}

export function cloneWorkLogDraft(source: HealthSupportWorkLog, date: string): HealthSupportWorkLogDraft {
  return parseHealthSupportWorkLogMutationSchema.parse({ ...source, date });
}

export function quickFillWorkLogDraft(source: HealthSupportWorkLog, date: string): HealthSupportWorkLogDraft {
  return cloneWorkLogDraft(source, date);
}

export function createHealthSupportRepository(gateway: HealthSupportGateway) {
  return {
    async listInstructors(): Promise<readonly HealthSupportInstructor[]> {
      const result = await gateway.from("health_support_instructors").select("*").eq("user_id", gateway.userId).order("created_at");
      if (result.error) throw new HealthSupportInstructorRepositoryError("Unable to load instructor settings");
      return z.array(instructorRowSchema).parse(result.data).map(mapInstructor);
    },
    async createInstructor(input: unknown): Promise<HealthSupportInstructor> {
      const values = parseHealthSupportInstructorInput(input);
      const result = await gateway.from("health_support_instructors").insert({ user_id: gateway.userId, ...instructorWriteValues(values) }).select("*").single();
      if (result.error) throw new HealthSupportInstructorRepositoryError("Unable to save instructor settings");
      return mapInstructor(result.data);
    },
    async updateInstructor(id: string, input: unknown): Promise<HealthSupportInstructor> {
      const values = parseHealthSupportInstructorInput(input);
      const result = await gateway.from("health_support_instructors").update(instructorWriteValues(values)).eq("id", id).eq("user_id", gateway.userId).select("*").single();
      if (result.error) throw new HealthSupportInstructorRepositoryError("Unable to update instructor settings");
      return mapInstructor(result.data);
    },
    async deleteInstructor(id: string): Promise<void> {
      const result = await gateway.from("health_support_instructors").delete().eq("id", id).eq("user_id", gateway.userId);
      if (result.error) throw new HealthSupportInstructorRepositoryError("Unable to delete instructor settings");
    },
    async listWorkLogs(instructorId?: string): Promise<readonly HealthSupportWorkLog[]> {
      let query = gateway.from("health_support_work_logs").select("*").eq("user_id", gateway.userId).order("work_date", { ascending: false }).order("start_time", { ascending: false });
      if (instructorId) query = query.eq("instructor_id", instructorId);
      const result = await query;
      if (result.error) throw new HealthSupportInstructorRepositoryError("Unable to load work logs");
      return z.array(workLogRowSchema).parse(result.data).map(mapWorkLog);
    },
    async createWorkLog(input: unknown): Promise<HealthSupportWorkLog> {
      const parsed = parseHealthSupportWorkLogMutation(input);
      if (!parsed.success) throw parsed.error;
      const result = await gateway.from("health_support_work_logs").insert({ user_id: gateway.userId, ...workLogWriteValues(parsed.data) }).select("*").single();
      if (result.error) throw new HealthSupportInstructorRepositoryError("Unable to save work log");
      return mapWorkLog(result.data);
    },
    async updateWorkLog(id: string, input: unknown): Promise<HealthSupportWorkLog> {
      const parsed = parseHealthSupportWorkLogMutation(input);
      if (!parsed.success) throw parsed.error;
      const result = await gateway.from("health_support_work_logs").update(workLogWriteValues(parsed.data)).eq("id", id).eq("user_id", gateway.userId).select("*").single();
      if (result.error) throw new HealthSupportInstructorRepositoryError("Unable to update work log");
      return mapWorkLog(result.data);
    },
    async deleteWorkLog(id: string): Promise<void> {
      const result = await gateway.from("health_support_work_logs").delete().eq("id", id).eq("user_id", gateway.userId);
      if (result.error) throw new HealthSupportInstructorRepositoryError("Unable to delete work log");
    },
  };
}

async function ownedGateway(): Promise<HealthSupportGateway> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new HealthSupportInstructorRepositoryError("Sign in is required");
  const from: unknown = Reflect.get(supabase, "from");
  if (typeof from !== "function") throw new HealthSupportInstructorRepositoryError("Unable to access instructor storage");
  return {
    userId: user.id,
    from: (table) => {
      const query: unknown = from.call(supabase, table);
      if (!isHealthSupportInitialQuery(query)) throw new HealthSupportInstructorRepositoryError("Unable to access instructor storage");
      return query;
    },
  };
}

export async function listHealthSupportInstructors(): Promise<readonly HealthSupportInstructor[]> { return createHealthSupportRepository(await ownedGateway()).listInstructors(); }
export async function createHealthSupportInstructor(input: unknown): Promise<HealthSupportInstructor> { return createHealthSupportRepository(await ownedGateway()).createInstructor(input); }
export async function updateHealthSupportInstructor(id: string, input: unknown): Promise<HealthSupportInstructor> { return createHealthSupportRepository(await ownedGateway()).updateInstructor(id, input); }
export async function deleteHealthSupportInstructor(id: string): Promise<void> { return createHealthSupportRepository(await ownedGateway()).deleteInstructor(id); }
export async function listHealthSupportWorkLogs(instructorId?: string): Promise<readonly HealthSupportWorkLog[]> { return createHealthSupportRepository(await ownedGateway()).listWorkLogs(instructorId); }
export async function createHealthSupportWorkLog(input: unknown): Promise<HealthSupportWorkLog> { return createHealthSupportRepository(await ownedGateway()).createWorkLog(input); }
export async function updateHealthSupportWorkLog(id: string, input: unknown): Promise<HealthSupportWorkLog> { return createHealthSupportRepository(await ownedGateway()).updateWorkLog(id, input); }
export async function deleteHealthSupportWorkLog(id: string): Promise<void> { return createHealthSupportRepository(await ownedGateway()).deleteWorkLog(id); }
