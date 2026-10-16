import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ClinicalRecordItem, SelectedTransferPatient } from "@/features/transfers/types";
import { NewTransferRequestClient } from "./new-transfer-request-client";

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
	records = [],
}: {
	patients: SelectedTransferPatient[];
	records?: ClinicalRecordItem[];
}) {
	vi.stubGlobal(
		"fetch",
		vi.fn(async (url: string) => {
			const type = new URL(url, "http://localhost").searchParams.get("type");
			const recordsOfType = records.filter((record) => record.type === type);

			return Response.json({
				patients,
				records: recordsOfType,
				page: 1,
				totalPages: 1,
				totalRecords: recordsOfType.length,
			});
		}),
	);
	const user = userEvent.setup();

	render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<NewTransferRequestClient
				searchParams={Object.assign(Promise.resolve({}), { status: "fulfilled", value: {} })}
				patients={patients}
				patientOptionsLimit={20}
				totalPatientPages={1}
			/>
		</SWRConfig>,
	);
	await user.click(screen.getByRole("button", { name: "Select patient" }));
	for (const patient of patients) {
		await user.click(screen.getByRole("button", { name: new RegExp(patient.name) }));
	}
	await user.keyboard("{Escape}");
	await user.click(screen.getByRole("button", { name: "Continue" }));
	await screen.findByText("Step 2/2");

	return user;
}

async function attachRecords(
	user: ReturnType<typeof userEvent.setup>,
	tab: string,
	recordNames: string[],
) {
	await user.click(screen.getByRole("tab", { name: tab }));
	await user.click(screen.getByRole("button", { name: `Select ${tab.toLowerCase()} records` }));
	for (const recordName of recordNames) {
		await user.click(await screen.findByRole("button", { name: new RegExp(recordName) }));
	}
	await user.keyboard("{Escape}");
}

describe("new transfer request, step 2", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		window.history.replaceState(null, "", "/");
	});

	test("counts every attached record, not the number of record types", async () => {
		const user = await renderStepTwo({
			patients: [fatima],
			records: [
				{ id: "DIA-1", name: "Asthma", type: "diagnoses" },
				{ id: "DIA-2", name: "Hypertension", type: "diagnoses" },
				{ id: "ALLE-1", name: "Penicillin", type: "allergies" },
			],
		});

		await attachRecords(user, "Diagnoses", ["Asthma", "Hypertension"]);
		await attachRecords(user, "Allergies", ["Penicillin"]);

		expect(screen.getByText("3 records selected")).toBeVisible();
	});

	test("lets the user continue as soon as the target hospital details are typed", async () => {
		const user = await renderStepTwo({
			patients: [fatima],
			records: [{ id: "DIA-1", name: "Asthma", type: "diagnoses" }],
		});
		await attachRecords(user, "Diagnoses", ["Asthma"]);
		const continueButton = screen.getByRole("button", { name: "Continue" });
		expect(continueButton).toBeDisabled();

		await user.type(screen.getByLabelText(/Target Hospital Name/), "Enugu State Teaching Hospital");
		await user.type(screen.getByLabelText(/Target Hospital Email/), "records@esuth.gov.ng");

		expect(screen.getByLabelText(/Target Hospital Email/)).toHaveFocus();
		expect(continueButton).toBeEnabled();
		expect(screen.queryByText("Must be official verified hospital")).not.toBeInTheDocument();
	});

	test("removes a selected patient from the keyboard and keeps the others", async () => {
		const user = await renderStepTwo({ patients: [fatima, amara] });
		const removeFatimaButton = screen.getByRole("button", { name: "Remove Fatima Bello" });
		expect(screen.getByRole("button", { name: "Remove Amara Okafor" })).toBeVisible();

		removeFatimaButton.focus();
		await user.keyboard("{Enter}");

		expect(screen.queryByRole("button", { name: "Remove Fatima Bello" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Remove Amara Okafor" })).toBeVisible();
	});

	test("keeps the selected patients in the address so a reload brings them back", async () => {
		const user = await renderStepTwo({ patients: [fatima, amara] });

		expect(new URL(window.location.href).searchParams.getAll("patientId")).toEqual([
			fatima.patientId,
			amara.patientId,
		]);

		await user.click(screen.getByRole("button", { name: "Remove Fatima Bello" }));

		expect(new URL(window.location.href).searchParams.getAll("patientId")).toEqual([
			amara.patientId,
		]);
	});

	test("keeps nothing from the request in the browser's storage", async () => {
		const user = await renderStepTwo({
			patients: [fatima],
			records: [{ id: "DIA-1", name: "Asthma", type: "diagnoses" }],
		});
		await attachRecords(user, "Diagnoses", ["Asthma"]);
		await user.type(screen.getByLabelText(/Target Hospital Name/), "Enugu State Teaching Hospital");

		expect(screen.getByText("1 record selected")).toBeVisible();
		expect(localStorage.length).toBe(0);
		expect(sessionStorage.length).toBe(0);
	});
});
