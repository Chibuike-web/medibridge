vi.mock("@/lib/storage/client", () => ({ patientUploads: {}, hospitalUploads: {} }));
import { render, screen, waitFor, within } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server.browser";
import { JSDOM } from "jsdom";
import { beforeEach, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import type { AllergyType, MedicationType } from "@/features/patients/types";
import PatientPage from "./page";
import EncounterDetailsPage from "./encounters/[encounterId]/page";

const { getAllergies, getMedications } = vi.hoisted(() => ({
	getAllergies: vi.fn(),
	getMedications: vi.fn(),
}));
vi.mock("@/lib/api/verify-session", () => ({
	verifySession: async () => ({ user: { id: "user-1", emailVerified: true } }),
}));
vi.mock("@/lib/api/get-organization-id", () => ({
	getOrganizationContext: async () => ({
		organizationId: "hospital-1",
		isOrganizationVerified: true,
		role: "owner",
	}),
}));
vi.mock("@/lib/api/get-patient-by-id", () => ({
	getPatientById: async () => ({
		patientId: "patient-1",
		firstName: "Ada",
		lastName: "Okafor",
		email: "ada@example.com",
		sex: "Female",
	}),
}));
vi.mock("@/lib/api/get-patient-encounter", () => ({
	getPatientEncounter: async () => ({
		patientId: "patient-1",
		encounterId: "ENC-1",
		encounterType: "Routine Checkup",
		encounterDate: new Date("2026-10-17"),
		updatedAt: new Date("2026-10-17"),
		encounterDateLabel: "Oct 17, 2026",
		department: "General Medicine",
		physician: "Dr. Okafor",
		createdAtLabel: "Oct 17, 2026",
		createdBy: "Dr. Okafor",
	}),
}));
vi.mock("@/lib/api/get-patient-allergies", () => ({ getPatientAllergies: getAllergies }));
vi.mock("@/lib/api/get-patient-medications", () => ({ getPatientMedications: getMedications }));
vi.mock("@/lib/api/get-patient-diagnoses", () => ({
	getPatientDiagnoses: async () => ({ diagnoses: [], totalDiagnoses: 0 }),
}));
vi.mock("@/lib/api/get-patient-imaging", () => ({
	getPatientImaging: async () => ({ imagingStudies: [], totalImagingStudies: 0 }),
}));
vi.mock("@/lib/api/get-patient-immunizations", () => ({
	getPatientImmunizations: async () => ({ immunizations: [], totalImmunizations: 0 }),
}));
vi.mock("@/lib/api/get-patient-procedures", () => ({
	getPatientProcedures: async () => ({ procedures: [], totalProcedures: 0 }),
}));
vi.mock("@/lib/api/get-patient-lab-tests", () => ({
	getPatientLabTests: async () => ({ labTests: [], totalLabTests: 0 }),
}));
vi.mock("@/lib/api/get-patient-encounters", () => ({
	getPatientEncounters: async () => ({ encounters: [], totalEncounters: 0 }),
}));
vi.mock("@/lib/api/get-patient-vitals", () => ({
	getPatientVitals: async () => ({ vitals: [], totalVitals: 0 }),
	getPatientVitalReadings: async () => [],
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: "owner" } }),
		useSession: () => ({ data: { user: { name: "Dr. Okafor" } } }),
	},
}));
vi.mock("@/lib/better-auth/auth", () => ({ db: {}, auth: {} }));
vi.mock("next/navigation", () => ({
	redirect: (path: string) => {
		throw new Error(`REDIRECT:${path}`);
	},
	notFound: () => {
		throw new Error("NOT_FOUND");
	},
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/dashboard/patients/patient-1",
}));

const allergy: AllergyType = {
	allergyId: "ALLE-1",
	allergen: "Penicillin",
	reaction: "Rash",
	severity: "Severe",
	status: "Active",
	createdAtLabel: "Oct 17, 2026",
	createdAtSortValue: "2026-10-17",
};
const medication: MedicationType = {
	medicationId: "MED-1",
	medication: "Aspirin",
	dose: "75 mg",
	route: "Oral",
	indication: "Prevention",
	status: "Completed",
	createdAtLabel: "Oct 17, 2026",
	createdAtSortValue: "2026-10-17",
};

async function renderPage(page: ReactNode) {
	const errors: unknown[] = [];
	const stream = await renderToReadableStream(page, {
		onError: (error) => {
			errors.push(error);
		},
	});
	await stream.allReady;
	expect(errors).toEqual([]);
	// Nested Suspense boundaries stream reveal scripts that need a browser document.
	const document = new JSDOM(await new Response(stream).text(), {
		runScripts: "dangerously",
		pretendToBeVisual: true,
	});
	try {
		await waitFor(() =>
			expect(document.window.document.querySelector('div[hidden][id^="S:"]')).toBeNull(),
		);
		render(<div dangerouslySetInnerHTML={{ __html: document.window.document.body.innerHTML }} />);
	} finally {
		document.window.close();
	}
}

async function renderRedirects(page: ReactNode) {
	const redirects: string[] = [];
	const stream = await renderToReadableStream(page, {
		onError: (error) => {
			if (error instanceof Error && error.message.startsWith("REDIRECT:")) {
				redirects.push(error.message.slice("REDIRECT:".length));
			}
		},
	});
	await stream.allReady;
	return redirects;
}

beforeEach(() => {
	getAllergies.mockResolvedValue({ allergies: [allergy], totalAllergies: 56 });
	getMedications.mockResolvedValue({ medications: [medication], totalMedications: 56 });
});

test("opens a patient section with its bookmarked page, search, and filters", async () => {
	await renderPage(
		<PatientPage
			params={Promise.resolve({ patientId: "patient-1" })}
			searchParams={Promise.resolve({
				section: "allergies",
				allergiesPage: "2",
				allergiesLimit: "28",
				allergiesQuery: "pen",
				allergiesStatus: "active,invalid",
				allergiesSeverity: "severe",
				allergiesCreatedFrom: "2026-10-01",
				medicationsPage: "3",
			})}
		/>,
	);
	expect(within(screen.getByRole("table")).getByText("Penicillin")).toBeVisible();
	expect(screen.getByRole("searchbox")).toHaveValue("pen");
	expect(screen.getByText("Page 2 of 2")).toBeVisible();
	expect(screen.getByText("Status: Active")).toBeVisible();
	expect(screen.getByText("Severity: Severe")).toBeVisible();
	expect(getAllergies).toHaveBeenCalledWith(
		"patient-1",
		2,
		28,
		"pen",
		{ createdFrom: "2026-10-01", createdTo: "" },
		["active"],
		["severe"],
	);
});

test("opens an encounter with independent allergy and medication parameters scoped to the same encounter", async () => {
	await renderPage(
		<EncounterDetailsPage
			params={Promise.resolve({ patientId: "patient-1", encounterId: "ENC-1" })}
			searchParams={Promise.resolve({
				allergiesPage: "2",
				allergiesLimit: "28",
				allergiesQuery: "pen",
				allergiesStatus: "active",
				medicationsPage: "3",
				medicationsLimit: "14",
				medicationsQuery: "asp",
				medicationsStatus: "completed",
			})}
		/>,
	);
	const tables = screen.getAllByRole("table");
	expect(tables.some((table) => within(table).queryByText("Penicillin"))).toBe(true);
	expect(tables.some((table) => within(table).queryByText("Aspirin"))).toBe(true);
	expect(screen.getByText("Page 2 of 2")).toBeVisible();
	expect(screen.getByText("Page 3 of 4")).toBeVisible();
	expect(screen.getByDisplayValue("pen")).toBeVisible();
	expect(screen.getByDisplayValue("asp")).toBeVisible();
	expect(getAllergies).toHaveBeenCalledWith(
		"patient-1",
		2,
		28,
		"pen",
		{ createdFrom: "", createdTo: "" },
		["active"],
		[],
		"ENC-1",
	);
	expect(getMedications).toHaveBeenCalledWith(
		"patient-1",
		3,
		14,
		"asp",
		{ createdFrom: "", createdTo: "" },
		["completed"],
		"ENC-1",
	);
});

test("sends a patient section past its last page to the last page and keeps its search", async () => {
	const redirects = await renderRedirects(
		<PatientPage
			params={Promise.resolve({ patientId: "patient-1" })}
			searchParams={Promise.resolve({
				section: "allergies",
				allergiesPage: "9",
				allergiesLimit: "28",
				allergiesQuery: "pen",
			})}
		/>,
	);
	expect(redirects).toEqual([
		"/dashboard/patients/patient-1?section=allergies&allergiesPage=2&allergiesLimit=28&allergiesQuery=pen",
	]);
});

test("moves every encounter table past its last page in one redirect", async () => {
	const redirects = await renderRedirects(
		<EncounterDetailsPage
			params={Promise.resolve({ patientId: "patient-1", encounterId: "ENC-1" })}
			searchParams={Promise.resolve({
				allergiesPage: "9",
				medicationsPage: "7",
				medicationsQuery: "asp",
			})}
		/>,
	);
	expect(redirects).toEqual([
		"/dashboard/patients/patient-1/encounters/ENC-1?allergiesPage=4&medicationsPage=4&medicationsQuery=asp",
	]);
});

test.each(["patient", "encounter"])(
	"keeps the %s table controls visible when filters match no rows",
	async (view) => {
		getAllergies.mockResolvedValue({ allergies: [], totalAllergies: 0 });
		const searchParams = Promise.resolve({
			section: "allergies",
			allergiesQuery: "no match",
			allergiesStatus: "inactive",
		});
		await renderPage(
			view === "patient" ? (
				<PatientPage
					params={Promise.resolve({ patientId: "patient-1" })}
					searchParams={searchParams}
				/>
			) : (
				<EncounterDetailsPage
					params={Promise.resolve({ patientId: "patient-1", encounterId: "ENC-1" })}
					searchParams={searchParams}
				/>
			),
		);
		expect(screen.getByDisplayValue("no match")).toBeVisible();
		expect(screen.getByText("Status: Inactive")).toBeVisible();
		expect(screen.getByRole("button", { name: "Clear all" })).toBeVisible();
		expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
	},
);
