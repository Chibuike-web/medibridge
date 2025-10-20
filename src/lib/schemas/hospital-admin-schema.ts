import { z } from "zod";

export const hospitalAdminSchema = z.object({
	adminName: z.string().min(1, "Admin name is required"),
	adminEmail: z
		.string()
		.min(1, "Admin email is required")
		.min(6, "Enter a valid email address")
		.refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address")
		.refine((val) => val.endsWith(".org"), { message: "Email must end with .org" }),
	adminPassword: z.string().min(1, "Admin password is required"),
	checkbox: z.literal(true, "You must agree to the Terms of Use and Privacy Policy"),
});

export type HospitalAdminType = z.infer<typeof hospitalAdminSchema>;
