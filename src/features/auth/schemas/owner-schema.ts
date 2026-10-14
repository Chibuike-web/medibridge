import { z } from "zod";

export const ownerSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "Email is required")
		.pipe(z.email({ error: "Enter a valid email address" })),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password is too long"),
});

export type OwnerType = z.infer<typeof ownerSchema>;
