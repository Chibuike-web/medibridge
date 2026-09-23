import z from "zod";

export const createInvitedAdminSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password is too long"),
});

export type CreateInvitedAdminType = z.infer<typeof createInvitedAdminSchema>;
