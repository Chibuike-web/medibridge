import z from "zod";

export const acceptInviteSchema = z.object({
	password: z.string().min(1, "Password is required"),
});

export type AcceptInviteType = z.infer<typeof acceptInviteSchema>;
