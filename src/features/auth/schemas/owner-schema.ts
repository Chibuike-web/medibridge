import { z } from "zod";

export const ownerSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "Email is required")
		.min(6, "Enter a valid email address")
		.refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address")
		.refine((val) => val.endsWith(".org"), { message: "Email must end with .org" }),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password is too long"),
});

export type OwnerType = z.infer<typeof ownerSchema>;
