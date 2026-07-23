import { ACADEMIC_TEMPLATE } from "@/lib/calendar-generator/templates/academic-template";
import { HEALTH_TEMPLATE } from "@/lib/calendar-generator/templates/health-template";
import { HOLIDAY_TEMPLATE } from "@/lib/calendar-generator/templates/holiday-template";

export { ACADEMIC_TEMPLATE, ACADEMIC_TEMPLATE_RULES } from "@/lib/calendar-generator/templates/academic-template";
export { HEALTH_TEMPLATE, HEALTH_TEMPLATE_RULES } from "@/lib/calendar-generator/templates/health-template";
export { FIXED_HOLIDAY_RULES, HOLIDAY_TEMPLATE, VARIABLE_HOLIDAY_KEYS } from "@/lib/calendar-generator/templates/holiday-template";

export const BUILT_IN_CALENDAR_TEMPLATES = [
  HOLIDAY_TEMPLATE,
  ACADEMIC_TEMPLATE,
  HEALTH_TEMPLATE,
] as const;
