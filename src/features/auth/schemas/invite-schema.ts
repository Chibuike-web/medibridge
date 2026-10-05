import z from "zod";

export const inviteSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "Email is required")
		.min(6, "Enter a valid email address")
		.max(254, "Email address is too long")
		.refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address"),
});

export type InviteType = z.infer<typeof inviteSchema>;
