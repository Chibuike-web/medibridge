import { z } from "zod";

export const PatientSchema = z.object({
	name: z.string(),
	age: z.number(),
	role: z.string(),
	recentEmployment: z.string(),
});

export type PatientType = z.infer<typeof PatientSchema>;



/**
 * z.object({
 * "title": z.string()
 * 
 * 
 * })
 * 
 * 
 * 
 */