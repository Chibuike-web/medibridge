import z from "zod";

export const signInSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.min(6, "Enter a valid email address")
		.refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address")
		.refine((val) => val.endsWith(".org"), { message: "Email must end with .org" }),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean().optional(),
});

export type SignInType = z.infer<typeof signInSchema>;
