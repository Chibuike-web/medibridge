import { expect, test, vi } from "vitest";
import { getInvitationPreviewService } from "./get-invitation-preview-service";

vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: () => ({
			from: () => ({
				innerJoin: () => ({
					leftJoin: () => ({
						where: () => ({
							limit: async () => [
								{
									email: "admin@stmaryhospital.org",
									hasAccount: null,
									isOrganizationVerified: true,
									organizationName: "St Mary Hospital",
								},
							],
						}),
					}),
				}),
			}),
		}),
	},
}));

test("returns the invited email and organization for a pending invitation", async () => {
	const result = await getInvitationPreviewService("invitation-1");

	expect(result).toEqual({
		status: "success",
		email: "admin@stmaryhospital.org",
		hasAccount: false,
		organizationName: "St Mary Hospital",
	});
});
