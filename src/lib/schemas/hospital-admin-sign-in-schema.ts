import z from "zod";

export const hospitalAdminSignInSchema = z.object({
	adminEmail: z
		.string()
		.min(1, "Admin email is required")
		.min(6, "Enter a valid email address")
		.refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address")
		.refine((val) => val.endsWith(".org"), { message: "Email must end with .org" }),
	adminPassword: z.string().min(1, "Admin password is required"),
	rememberMe: z.boolean().optional(),
});

export type HospitalAdminSignInType = z.infer<typeof hospitalAdminSignInSchema>;
