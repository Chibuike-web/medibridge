// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { createHospitalService } from "./create-hospital-service";

const {
	createOrganizationMock,
	getSessionMock,
	headersMock,
	insertMock,
	insertValuesMock,
	selectMock,
	queryResultMock,
	readdirMock,
	setActiveOrganizationMock,
} = vi.hoisted(() => ({
	createOrganizationMock: vi.fn(),
	getSessionMock: vi.fn(),
	headersMock: vi.fn(),
	insertMock: vi.fn(),
	insertValuesMock: vi.fn(),
	selectMock: vi.fn(),
	queryResultMock: vi.fn(),
	readdirMock: vi.fn(),
	setActiveOrganizationMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("node:fs/promises", () => ({ readdir: readdirMock }));
vi.mock("@/lib/better-auth/auth", () => ({
	auth: {
		api: {
			createOrganization: createOrganizationMock,
			getSession: getSessionMock,
			setActiveOrganization: setActiveOrganizationMock,
		},
	},
	db: { insert: insertMock, select: selectMock },
}));

describe("createHospitalService", () => {
	beforeEach(() => {
		headersMock.mockResolvedValue(new Headers());
		getSessionMock.mockResolvedValue(null);
		insertMock.mockReturnValue({ values: insertValuesMock });
		insertValuesMock.mockResolvedValue(undefined);
		createOrganizationMock.mockResolvedValue({ id: "organization-1" });
		setActiveOrganizationMock.mockResolvedValue({ id: "organization-1" });
		selectMock.mockReturnValue({
			from: () => ({ where: () => ({ limit: queryResultMock }) }),
		});
		queryResultMock.mockResolvedValue([]);
		readdirMock.mockResolvedValue(["accreditation-upload.pdf"]);
	});

	test("does not create an organization when the owner has no authenticated session", async () => {
		const result = await createHospitalService({
			hospitalName: "St Mary's Hospital",
			hospitalAddress: "12 Health Street",
		});

		expect(result).toEqual({
			status: "failed",
			error: "You must sign in to submit hospital details.",
		});
		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
	});

	test("does not create hospital records until the owner verifies their email", async () => {
		getSessionMock.mockResolvedValue({
			user: {
				id: "owner-1",
				name: "Sarah Thompson",
				email: "sarah@stmary.org",
				emailVerified: false,
			},
		});

		const result = await createHospitalService({
			hospitalName: "St Mary's Hospital",
			hospitalAddress: "12 Health Street",
		});

		expect(result).toEqual({
			status: "failed",
			error: "Verify your email before submitting hospital details.",
		});
		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
	});

	test("does not let a verified invited account outside .org create a hospital", async () => {
		getSessionMock.mockResolvedValue({
			user: {
				id: "invited-admin-1",
				name: "Invited Administrator",
				email: "administrator@gmail.com",
				emailVerified: true,
			},
		});

		const result = await createHospitalService({
			hospitalName: "St Mary's Hospital",
			hospitalAddress: "12 Health Street",
		});

		expect(result).toEqual({
			status: "failed",
			error: "Use your official hospital email address (.org).",
		});
		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
	});

	test.each(["sarah@stmary.org", "SARAH@STMARY.ORG"])(
		"creates hospital records for a verified owner with email %s",
		async (email) => {
			getSessionMock.mockResolvedValue({
				user: {
					id: "owner-1",
					name: "Sarah Thompson",
					email,
					emailVerified: true,
				},
			});

			const result = await createHospitalService({
				hospitalName: "St Mary's Hospital",
				hospitalAddress: "12 Health Street",
			});

			expect(result).toEqual({ status: "success", message: "Hospital data successfully saved" });
			expect(createOrganizationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.objectContaining({
						name: "St Mary's Hospital",
						userId: "owner-1",
					}),
				}),
			);
			expect(setActiveOrganizationMock).toHaveBeenCalledWith({
				body: { organizationId: "organization-1" },
				headers: expect.any(Headers),
			});
			expect(insertValuesMock).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: "organization-1",
					hospitalName: "St Mary's Hospital",
					hospitalAddress: "12 Health Street",
					hospitalOwnerName: "Sarah Thompson",
					hospitalOwnerEmail: email,
					documentPath: "owner-1/accreditation-upload.pdf",
				}),
			);
		},
	);

	test("does not create an organization until the owner uploads an accreditation document", async () => {
		getSessionMock.mockResolvedValue({
			user: {
				id: "owner-1",
				name: "Sarah Thompson",
				email: "sarah@stmary.org",
				emailVerified: true,
			},
		});
		readdirMock.mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));

		const result = await createHospitalService({
			hospitalName: "St Mary's Hospital",
			hospitalAddress: "12 Health Street",
		});

		expect(result).toEqual({
			status: "failed",
			error: "Upload your accreditation document before submitting.",
		});
		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
	});

	test("does not create another hospital when this owner has already submitted details", async () => {
		getSessionMock.mockResolvedValue({
			user: {
				id: "owner-1",
				name: "Sarah Thompson",
				email: "sarah@stmary.org",
				emailVerified: true,
			},
		});
		queryResultMock.mockResolvedValue([{ id: "existing-hospital" }]);

		const result = await createHospitalService({
			hospitalName: "St Mary's Hospital",
			hospitalAddress: "12 Health Street",
		});

		expect(result).toEqual({
			status: "failed",
			error: "Hospital details have already been submitted.",
		});
		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
	});

	test("does not create a hospital for an administrator who already belongs to one", async () => {
		getSessionMock.mockResolvedValue({
			user: {
				id: "admin-1",
				name: "Hospital Administrator",
				email: "admin@stmary.org",
				emailVerified: true,
			},
		});
		queryResultMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "membership-1" }]);

		const result = await createHospitalService({
			hospitalName: "Another Hospital",
			hospitalAddress: "4 Clinic Road",
		});

		expect(result).toEqual({
			status: "failed",
			error: "Your account already belongs to a hospital. An account can only join one hospital.",
		});
		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
	});

	test("gives two hospitals with the same name different URL-safe slugs", async () => {
		getSessionMock.mockResolvedValue({
			user: {
				id: "owner-1",
				name: "Sarah Thompson",
				email: "sarah@stmary.org",
				emailVerified: true,
			},
		});

		await createHospitalService({
			hospitalName: "St Mary's Hospital",
			hospitalAddress: "12 Health Street",
		});
		await createHospitalService({
			hospitalName: "St Mary's Hospital",
			hospitalAddress: "4 Clinic Road",
		});

		const [firstSlug, secondSlug] = createOrganizationMock.mock.calls.map(
			([request]) => request.body.slug,
		);
		expect(firstSlug).toMatch(/^st-mary-s-hospital-[a-z0-9-]+$/);
		expect(secondSlug).toMatch(/^st-mary-s-hospital-[a-z0-9-]+$/);
		expect(firstSlug).not.toBe(secondSlug);
	});
});
