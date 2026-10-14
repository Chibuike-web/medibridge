import { describe, expect, test } from "vitest";
import { ownerSchema } from "./owner-schema";

describe("owner registration email validation", () => {
	test.each([
		" SARAH@GMAIL.COM ",
		"sarah@clinic.com",
		"sarah@hospital.co.uk",
		"sarah@hospital.org",
	])("accepts and normalizes a valid email on any domain: %s", (email) => {
		const result = ownerSchema.parse({
			name: "Sarah Thompson",
			email,
			password: "secure-password",
		});

		expect(result.email).toBe(email.trim().toLowerCase());
	});

	test.each(["a@b..com", "a@b", "invalid-email", "sarah@hospital"])(
		"rejects an invalid email with the same field message: %s",
		(email) => {
			const result = ownerSchema.safeParse({
				name: "Sarah Thompson",
				email,
				password: "secure-password",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual([
					expect.objectContaining({ path: ["email"], message: "Enter a valid email address" }),
				]);
			}
		},
	);

	test("asks for an email when the field is blank", () => {
		const result = ownerSchema.safeParse({
			name: "Sarah Thompson",
			email: " ",
			password: "secure-password",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual([
				expect.objectContaining({ path: ["email"], message: "Email is required" }),
			]);
		}
	});
});
