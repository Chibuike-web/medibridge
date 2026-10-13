import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server.browser";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PatientExtractionDocument } from "@/db/schemas/patient/patient-extraction";
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

function readyDocument(firstName: string): PatientExtractionDocument {
	return {
		documentId: `${firstName}.pdf`,
		status: "ready",
		patient: {
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
		},
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
		getExtractionMock.mockResolvedValue({ id: "saved", extractedData: [readyDocument("Ada")] });
	});

	test("loads saved information into the review form using the extraction ID in the URL", async () => {
		await renderReviewPage();
		expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
		expect(screen.getByRole("heading", { name: "Review Patient Information" })).toBeVisible();
		expect(screen.getByRole("link", { name: "View document" })).toHaveAttribute(
			"href",
			"/api/patient-extractions/saved/documents/Ada.pdf",
		);
		expect(getExtractionMock).toHaveBeenCalledWith("saved");
	});

	test("shows every stored document with the status saved in the extraction", async () => {
		getExtractionMock.mockResolvedValue({
			id: "saved",
			extractedData: [
				readyDocument("Ada"),
				{ ...readyDocument("Bola"), status: "saved" },
				{ documentId: "Chi.pdf", status: "failed", patient: null },
			],
		});
		await renderReviewPage();
		expect(
			within(screen.getByRole("article", { name: "Document 1" })).getByText("Ready to review"),
		).toBeVisible();
		expect(
			within(screen.getByRole("article", { name: "Document 2" })).getByText("Saved"),
		).toBeVisible();
		expect(
			within(screen.getByRole("article", { name: "Document 3" })).getByText("Extraction failed"),
		).toBeVisible();
	});

	test("returns to uploads when the review URL has no extraction ID", async () => {
		await renderReviewPage({});
		expect(redirectMock).toHaveBeenCalledWith("/dashboard/add-new-patient");
		expect(getExtractionMock).not.toHaveBeenCalled();
	});

	test("returns to uploads when the review URL has more than one extraction ID", async () => {
		await renderReviewPage({ extractionId: ["saved", "other"] });
		expect(redirectMock).toHaveBeenCalledWith("/dashboard/add-new-patient");
		expect(getExtractionMock).not.toHaveBeenCalled();
	});

	test("shows not found when the extraction is missing or belongs to another hospital", async () => {
		await renderReviewPage();
		expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
		cleanup();
		getExtractionMock.mockResolvedValue(null);
		await renderReviewPage({ extractionId: "unavailable" });
		expect(getExtractionMock).toHaveBeenCalledWith("unavailable");
		expect(notFoundMock).toHaveBeenCalled();
		expect(screen.queryByRole("heading", { name: "Ada Okafor" })).not.toBeInTheDocument();
	});

	test.each([
		{ state: "unverified email", destination: "/email-verified?error=unverified" },
		{ state: "missing hospital membership", destination: "/sign-in" },
		{ state: "hospital awaiting approval", destination: "/verify" },
		{ state: "signed out", destination: "/sign-in" },
	])("routes $state before loading saved patient information", async ({ state, destination }) => {
		await renderReviewPage();
		expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
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
		expect(screen.queryByRole("heading", { name: "Ada Okafor" })).not.toBeInTheDocument();
		expect(getExtractionMock).not.toHaveBeenCalled();
	});
});
