import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { VitalType } from "@/features/patients/types";
import { VitalsTable } from "./vitals-table";

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: "owner" } }),
	},
}));

vi.mock("@/features/patients/server/create-patient-vital-action", () => ({
	createPatientVitalAction: vi.fn(),
}));

const vitals: VitalType[] = [
	{
		vitalId: "V-newer",
		encounterId: "ENC-newer",
		encounterType: "Routine Checkup",
		createdBy: "Dr. Okafor",
		recordedAt: Date.UTC(2020, 0, 2),
		createdAt: Date.UTC(2020, 0, 3),
		systolic: 118,
		diastolic: 79,
		heartRate: 72,
		respiratoryRate: 14,
		temperature: 36.5,
		oxygenSaturation: 99,
		weight: 71,
		bmi: 23.2,
		notes: "Follow-up reading.",
	},
	{
		vitalId: "V-older",
		encounterId: "ENC-older",
		encounterType: "Emergency Visit",
		createdBy: "Nurse Ada",
		recordedAt: Date.UTC(2020, 0, 1),
		createdAt: Date.UTC(2020, 0, 1),
		systolic: 120,
		diastolic: 80,
		heartRate: 100,
		respiratoryRate: 16,
		temperature: 37,
		oxygenSaturation: 98,
		weight: 70,
		bmi: 22.9,
		notes: "",
	},
];

function renderVitalsTable(overrides: Partial<React.ComponentProps<typeof VitalsTable>> = {}) {
	const props: React.ComponentProps<typeof VitalsTable> = {
		patientId: "patient-a",
		encounterOptions: [
			{
				encounterId: "ENC-newer",
				encounterType: "Routine Checkup",
				encounterDateLabel: "2 January 2020",
			},
		],
		vitals,
		readings: vitals,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		recordedFrom: "",
		recordedTo: "",
		createdFrom: "",
		createdTo: "",
		isPending: false,
		onQueryChange: vi.fn(),
		onRecordedAtRangeApply: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onFiltersClear: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		onVitalCreated: vi.fn(),
		...overrides,
	};

	render(<VitalsTable {...props} />);

	return props;
}

function displayedIds() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")).map(
		(row) => within(row as HTMLElement).getAllByRole("cell")[2].textContent,
	);
}

describe("Vitals table", () => {
	test("shows supplied rows in order and sorts measurements numerically using the keyboard", async () => {
		const user = userEvent.setup();
		renderVitalsTable();

		expect(displayedIds()).toEqual(["V-newer", "V-older"]);
		expect(screen.getByRole("cell", { name: "120/80" })).toBeVisible();
		expect(screen.getByRole("columnheader", { name: "Encounter date" })).toBeVisible();

		const heartRateHeader = screen.getByRole("columnheader", { name: "HR (bpm)" });
		heartRateHeader.focus();
		await user.keyboard("{Enter}");
		expect(heartRateHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedIds()).toEqual(["V-older", "V-newer"]);
		await user.keyboard("{Enter}");
		expect(heartRateHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(["V-newer", "V-older"]);
	});

	test("reports search input to the owner and renders the controlled query", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderVitalsTable({ query: "V-old" });

		const search = screen.getByRole("searchbox", { name: "Search vitals" });
		expect(search).toHaveValue("V-old");
		await user.type(search, "e");
		expect(onQueryChange).toHaveBeenCalledWith("V-olde");
	});

	test("shows active date filters as removable pills", async () => {
		const user = userEvent.setup();
		const { onRecordedAtRangeApply } = renderVitalsTable({
			recordedFrom: "2020-01-01",
			recordedTo: "2020-01-31",
		});

		const pill = screen.getByText("Encounter: Jan 1, 2020 - Jan 31, 2020");
		expect(pill).toBeVisible();
		await user.click(screen.getByRole("button", { name: /Remove Encounter/ }));
		expect(onRecordedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	test("clears every active filter at once", async () => {
		const user = userEvent.setup();
		const { onFiltersClear } = renderVitalsTable({
			recordedFrom: "2020-01-01",
			createdFrom: "2020-02-01",
		});

		await user.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onFiltersClear).toHaveBeenCalledTimes(1);
	});

	test("opens the details drawer from the row actions available to an owner", async () => {
		const user = userEvent.setup();
		renderVitalsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for vital V-newer" }));
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View vitals details" });
		const overview = within(dialog).getByRole("region", { name: "Routine Checkup" });
		expect(within(overview).getByRole("heading", { name: "Routine Checkup" })).toBeVisible();
		expect(within(dialog).getByRole("button", { name: "Edit" })).toBeVisible();
		expect(within(dialog).getByRole("heading", { name: "Activity" })).toBeVisible();
		expect(within(dialog).getByRole("button", { name: "Archive vitals" })).toBeVisible();
		expect(within(overview).getByText("118/79 mmHg")).toBeVisible();
		expect(within(overview).getByText("Follow-up reading.")).toBeVisible();
		const activityButton = within(dialog).getByRole("button", { name: /Created by Dr. Okafor/ });
		expect(activityButton).toHaveAttribute("aria-expanded", "false");
		await user.click(activityButton);
		const activity = within(dialog).getByRole("region", { name: /Created by Dr. Okafor/ });
		expect(within(activity).getByText("Encounter type")).toBeVisible();
		expect(within(activity).getByText("Routine Checkup")).toBeVisible();
		expect(within(dialog).getByRole("button", { name: "Copy ENC-newer" })).toBeVisible();
	});

	test("paginates through the owner callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderVitalsTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});
});
