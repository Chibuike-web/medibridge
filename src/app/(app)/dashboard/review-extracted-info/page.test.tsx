import { cleanup, render, screen } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server.browser";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PatientExtractionRecord } from "@/db/schemas/patient/patient-extraction";
import ReviewExtractedInfo from "./page";

const {
	verifySessionMock,
	getOrganizationContextMock,
	getExtractionMock,
	redirectMock,
	notFoundMock,
} = vi.hoisted(() => ({
	verifySessionMock: vi.fn(),
	getOrganizationContextMock: vi.fn(),
	getExtractionMock: vi.fn(),
	redirectMock: vi.fn((path: string) => {
		throw new Error(`REDIRECT:${path}`);
	}),
	notFoundMock: vi.fn(() => {
		throw new Error("NOT_FOUND");
	}),
}));

vi.mock("@/lib/api/verify-session", () => ({ verifySession: verifySessionMock }));
vi.mock("@/lib/api/get-organization-id", () => ({
	getOrganizationContext: getOrganizationContextMock,
}));
vi.mock("@/lib/api/get-patient-extraction-by-id", () => ({
	getPatientExtractionById: getExtractionMock,
}));
vi.mock("@/features/patients/server/save-patients-action", () => ({ savePatientsAction: vi.fn() }));
vi.mock("next/navigation", () => ({
	redirect: redirectMock,
	notFound: notFoundMock,
	useRouter: () => ({ replace: vi.fn() }),
}));

function savedRecord(firstName: string): PatientExtractionRecord {
	return {
		documentId: `${firstName}.pdf`,
		personalInfo: {
			firstName,
			lastName: "Okafor",
			middleName: null,
			patientId: null,
			dateOfBirth: null,
			sex: null,
			age: null,
			maritalStatus: null,
			nationalId: null,
		},
		contactInfo: {
			phoneNumber: null,
			emailAddress: null,
			residentialAddress: null,
			stateOfOrigin: null,
			countryOfOrigin: null,
		},
		emergencyInfo: {
			firstName: null,
			middleName: null,
			lastName: null,
			relationship: null,
			phone: null,
		},
		physicalInfo: { height: null, weight: null, bloodGroup: null, genotype: null },
	};
}

async function renderReviewPage(
	query: { extractionId?: string | string[] } = { extractionId: "saved" },
) {
	const stream = await renderToReadableStream(
		<ReviewExtractedInfo searchParams={Promise.resolve(query)} />,
		{ onError: () => {} },
	);
	await stream.allReady;
	render(<div dangerouslySetInnerHTML={{ __html: await new Response(stream).text() }} />);
}

describe("review saved patient extractions", () => {
	beforeEach(() => {
		verifySessionMock.mockResolvedValue({ user: { id: "user-1", emailVerified: true } });
		getOrganizationContextMock.mockResolvedValue({
			organizationId: "hospital-1",
			isOrganizationVerified: true,
		});
		getExtractionMock.mockResolvedValue({ id: "saved", extractedData: [savedRecord("Ada")] });
	});

	test("loads saved information into the review form using the extraction ID in the URL", async () => {
		await renderReviewPage();
		expect(screen.getByRole("button", { name: "Ada Okafor" })).toBeVisible();
		expect(screen.getByRole("heading", { name: "Review Patient Information" })).toBeVisible();
		expect(getExtractionMock).toHaveBeenCalledWith("saved");
	});

	test("shows the original and retried documents together without duplicating repeated IDs", async () => {
		getExtractionMock.mockImplementation(async (id: string) => ({
			id,
			extractedData: [savedRecord(id === "original" ? "Ada" : "Bola")],
		}));
		await renderReviewPage({ extractionId: ["original", "retry", "original"] });
		expect(screen.getAllByRole("button", { name: "Ada Okafor" })).toHaveLength(1);
		expect(screen.getByRole("button", { name: "Bola Okafor" })).toBeVisible();
	});

	test("returns to uploads when the review URL has no extraction ID", async () => {
		await renderReviewPage({});
		expect(redirectMock).toHaveBeenCalledWith("/dashboard/add-new-patient");
		expect(getExtractionMock).not.toHaveBeenCalled();
	});

	test("shows not found instead of a partial review when any extraction is missing or inaccessible", async () => {
		await renderReviewPage();
		expect(screen.getByRole("button", { name: "Ada Okafor" })).toBeVisible();
		cleanup();
		getExtractionMock.mockImplementation(async (id: string) =>
			id === "unavailable" ? null : { id, extractedData: [savedRecord("Ada")] },
		);
		await renderReviewPage({ extractionId: ["saved", "unavailable"] });
		expect(notFoundMock).toHaveBeenCalled();
		expect(screen.queryByRole("button", { name: "Ada Okafor" })).not.toBeInTheDocument();
	});

	test("rejects an empty extraction ID in a multi-extraction URL", async () => {
		await renderReviewPage({ extractionId: ["saved", " "] });
		expect(notFoundMock).toHaveBeenCalled();
		expect(getExtractionMock).not.toHaveBeenCalled();
	});

	test.each([
		{ state: "unverified email", destination: "/email-verified?error=unverified" },
		{ state: "missing hospital membership", destination: "/sign-in" },
		{ state: "hospital awaiting approval", destination: "/verify" },
		{ state: "signed out", destination: "/sign-in" },
	])("routes $state before loading saved patient information", async ({ state, destination }) => {
		await renderReviewPage();
		expect(screen.getByRole("button", { name: "Ada Okafor" })).toBeVisible();
		cleanup();
		getExtractionMock.mockClear();

		if (state === "unverified email") {
			verifySessionMock.mockResolvedValue({ user: { id: "user-1", emailVerified: false } });
		} else if (state === "missing hospital membership") {
			getOrganizationContextMock.mockResolvedValue(null);
		} else if (state === "hospital awaiting approval") {
			getOrganizationContextMock.mockResolvedValue({
				organizationId: "hospital-1",
				isOrganizationVerified: false,
			});
		} else {
			verifySessionMock.mockImplementation(() => redirectMock("/sign-in"));
		}

		await renderReviewPage();
		expect(redirectMock).toHaveBeenCalledWith(destination);
		expect(screen.queryByRole("button", { name: "Ada Okafor" })).not.toBeInTheDocument();
		expect(getExtractionMock).not.toHaveBeenCalled();
	});
});
