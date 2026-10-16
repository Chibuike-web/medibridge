import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/features/transfers/server/actions", () => ({
	createTransferRequestsAction: vi.fn(),
}));
vi.mock("@/features/patients/server/get-patient-by-id-action", () => ({
	getPatientByIdAction: vi.fn(),
}));

const fatima = { patientId: "patient-fatima", name: "Fatima Bello" };
const amara = { patientId: "patient-amara", name: "Amara Okafor" };

async function renderStepTwo({
	patients,
	attachedRecords,
}: {
	patients: (typeof fatima)[];
	attachedRecords: Record<string, { id: string; name: string; type: string }[]>;
}) {
	localStorage.setItem(
		"selected-transfer-patients",
		JSON.stringify({ state: { selectedTransferPatients: patients }, version: 0 }),
	);
	localStorage.setItem(
		"attached-clinical-records",
		JSON.stringify({ state: { attachedClinicalRecordsByPatientId: attachedRecords }, version: 2 }),
	);
	const { NewTransferRequestClient } = await import("./new-transfer-request-client");
	const user = userEvent.setup();

	render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<NewTransferRequestClient
				searchParams={Object.assign(Promise.resolve({}), { status: "fulfilled", value: {} })}
				patients={[]}
				patientOptionsLimit={20}
				totalPatientPages={1}
			/>
		</SWRConfig>,
	);
	await user.click(await screen.findByRole("button", { name: "Continue" }));
	await screen.findByText("Step 2/2");

	return user;
}

describe("new transfer request, step 2", () => {
	beforeAll(async () => {
		await import("./new-transfer-request-client");
	}, 30_000);

	beforeEach(() => {
		vi.resetModules();
		localStorage.clear();
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({ patients: [], records: [], page: 1, totalPages: 1, totalRecords: 0 }),
			),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("counts every attached record, not the number of record types", async () => {
		await renderStepTwo({
			patients: [fatima],
			attachedRecords: {
				[fatima.patientId]: [
					{ id: "DIA-1", name: "Asthma", type: "diagnoses" },
					{ id: "DIA-2", name: "Hypertension", type: "diagnoses" },
					{ id: "ALLE-1", name: "Penicillin", type: "allergies" },
				],
			},
		});

		expect(screen.getByText("3 records selected")).toBeVisible();
	});

	test("lets the user continue as soon as the target hospital details are typed", async () => {
		const user = await renderStepTwo({
			patients: [fatima],
			attachedRecords: {
				[fatima.patientId]: [{ id: "DIA-1", name: "Asthma", type: "diagnoses" }],
			},
		});
		const continueButton = screen.getByRole("button", { name: "Continue" });
		expect(continueButton).toBeDisabled();

		await user.type(screen.getByLabelText(/Target Hospital Name/), "Enugu State Teaching Hospital");
		await user.type(screen.getByLabelText(/Target Hospital Email/), "records@esuth.gov.ng");

		expect(screen.getByLabelText(/Target Hospital Email/)).toHaveFocus();
		expect(continueButton).toBeEnabled();
		expect(screen.queryByText("Must be official verified hospital")).not.toBeInTheDocument();
	});

	test("removes a selected patient from the keyboard and keeps the others", async () => {
		const user = await renderStepTwo({ patients: [fatima, amara], attachedRecords: {} });
		const removeFatimaButton = screen.getByRole("button", { name: "Remove Fatima Bello" });
		expect(screen.getByRole("button", { name: "Remove Amara Okafor" })).toBeVisible();

		removeFatimaButton.focus();
		await user.keyboard("{Enter}");

		expect(screen.queryByRole("button", { name: "Remove Fatima Bello" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Remove Amara Okafor" })).toBeVisible();
	});
});
