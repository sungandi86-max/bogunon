import { z } from "zod";

export const settingsInputSchema = z.object({
  weekStartsOn: z.literal("monday"),
  defaultEventMinutes: z.number().int().min(5).max(1440),
  eventRemindersEnabled: z.boolean(),
  taskDueRemindersEnabled: z.boolean(),
  exerciseEnabled: z.boolean(),
  writingAssistanceEnabled: z.boolean(),
  displayDensity: z.enum(["default", "comfortable", "compact"]),
});

export type UserSettingsInput = z.infer<typeof settingsInputSchema>;

export const DEFAULT_USER_SETTINGS: UserSettingsInput = {
  weekStartsOn: "monday",
  defaultEventMinutes: 30,
  eventRemindersEnabled: true,
  taskDueRemindersEnabled: true,
  exerciseEnabled: true,
  writingAssistanceEnabled: true,
  displayDensity: "default",
};
