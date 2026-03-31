import { z } from "zod";

export const hospitalDetailsSchema = z.object({
	hospitalName: z.string().min(1, "Hospital name is required"),
	hospitalAddress: z.string().min(1, "Hospital address is required"),
});

export type HospitalDetailsType = z.infer<typeof hospitalDetailsSchema>;
