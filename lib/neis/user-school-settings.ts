import { z } from "zod";

export const userSchoolSettingsSchema = z.object({
  officeCode: z.string().trim().min(1).max(20),
  schoolCode: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  officeName: z.string().trim().min(1).max(100),
  schoolLevel: z.string().trim().min(1).max(50).nullable(),
  region: z.string().trim().min(1).max(100).nullable(),
  address: z.string().trim().min(1).max(300).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  mealEnabled: z.boolean(),
  weatherEnabled: z.boolean(),
});
