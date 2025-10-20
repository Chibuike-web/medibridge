import { z } from "zod";

export const hospitalDetailsSchema = z.object({
	hospitalName: z.string().min(1, "Hospital name is required"),
	hospitalAddress: z.string().min(1, "Hospital address is required"),
	primaryContactName: z.string().min(1, "Primary contact name is required"),
	primaryContactEmail: z
		.string()
		.min(1, "Primary contact email is required")
		.min(6, "Enter a valid email address")
		.refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address")
		.refine((val) => val.endsWith(".org"), { message: "Email must end with .org" }),
	primaryContactPhoneNumber: z
		.string()
		.min(1, "Primary contact phone is required")
		.refine(
			(val) => /^[0-9]{11}$/.test(val),
			"Phone number must be 11 digits and contain digits only"
		),
});

export type HospitalDetailsType = z.infer<typeof hospitalDetailsSchema>;
