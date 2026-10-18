import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MedicationDetailsType, MedicationType } from "@/features/patients/types";
import { MedicationsTable } from "./medications-table";
import { SWRConfig } from "swr";

const auth = vi.hoisted(() => ({ role: "owner" }));
const { createPatientMedicationMock, updateMedicationMock } = vi.hoisted(() => ({
	createPatientMedicationMock: vi.fn(),
	updateMedicationMock: vi.fn(),
}));

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: auth.role } }),
		useSession: () => ({ data: { user: { name: "Dr. Okafor" } } }),
	},
}));

vi.mock("@/features/patients/server/create-patient-medication-action", () => ({
	createPatientMedicationAction: createPatientMedicationMock,
}));

vi.mock("@/features/patients/server/update-patient-medication-action", () => ({
	updatePatientMedicationAction: updateMedicationMock,
}));

const medications: MedicationType[] = [
	{
		medication: "Metformin",
		dose: "500 mg",
		route: "Oral",
		medicationId: "MED-metformin",
		indication: "Type 2 diabetes",
		createdAtLabel: "Apr 2, 2021",
		createdAtSortValue: "2021-04-02",
		status: "Active",
	},
	{
		medication: "Amoxicillin",
		dose: "250 mg",
		route: "Intravenous",
		medicationId: "MED-amox",
		indication: "Ear infection",
		createdAtLabel: "Feb 14, 2020",
		createdAtSortValue: "2020-02-14",
		status: "Completed",
	},
];

const medicationDetails: Record<string, MedicationDetailsType> = {
	"MED-metformin": {
		medicationId: "MED-metformin",
		encounterId: "ENC-1",
		name: "Metformin",
		dose: "500 mg",
		route: "Oral",
		indication: "Type 2 diabetes",
		status: "Active",
		frequency: "Twice daily",
		duration: "Ongoing",
		prescribedBy: "Dr. Okafor",
		startedAt: "Apr 2, 2021",
		createdAt: "3 April 2021 at 09:00",
		updatedAt: "Apr 9, 2021",
		createdBy: "Nurse Chika",
		clinicalNote: "Review renal function every six months.",
		editValues: {
			updatedAt: "2026-01-02T09:00:00.000Z",
			indication: "Type 2 diabetes",
			dose: "500 mg",
			route: "Oral",
			prescribedBy: "Dr. Okafor",
			frequency: "Twice daily",
			duration: "Ongoing",
			startedAt: "2021-04-02",
			clinicalNote: "Review renal function every six months.",
		},
		history: [
			{
				id: "updated",
				title: "Updated",
				actor: "Nurse Chika",
				timestamp: "9 April 2021 at 09:00",
				items: [{ label: "Dose", previousValue: "1000 mg", value: "500 mg" }],
			},
		],
	},
	"MED-amox": {
		medicationId: "MED-amox",
		encounterId: null,
		name: "Amoxicillin",
		dose: "250 mg",
		route: "Intravenous",
		indication: "Ear infection",
		status: "Completed",
		frequency: "Three times daily",
		duration: "7 days",
		prescribedBy: "Dr. Adeyemi",
		startedAt: "Feb 14, 2020",
		createdAt: "15 February 2020 at 09:00",
		updatedAt: "Feb 21, 2020",
		createdBy: "Dr. Bello",
		clinicalNote: "Course completed without side effects.",
		editValues: {
			updatedAt: "2026-01-02T09:00:00.000Z",
			indication: "Ear infection",
			dose: "250 mg",
			route: "IV",
			prescribedBy: "Dr. Adeyemi",
			frequency: "Three times daily",
			duration: "7 days",
			startedAt: "2020-02-14",
			clinicalNote: "Course completed without side effects.",
		},
		history: [
			{
				id: "updated",
				title: "Updated",
				actor: "Dr. Adeyemi",
				timestamp: "21 February 2020 at 09:00",
				items: [
					{ label: "Dose", previousValue: "500 mg", value: "250 mg" },
					{
						label: "Clinical note",
						previousValue: "-",
						value: "Patient reported nausea after the first dose.",
					},
				],
			},
		],
	},
};

type MedicationsTableProps = React.ComponentProps<typeof MedicationsTable>;

function buildProps(overrides: Partial<MedicationsTableProps> = {}): MedicationsTableProps {
	return {
		patientId: "patient-1",
		medications,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		createdFrom: "",
		createdTo: "",
		statusFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onFiltersClear: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};
}

function renderMedicationsTable(overrides: Partial<MedicationsTableProps> = {}) {
	const props = buildProps(overrides);

	render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<MedicationsTable {...props} />
		</SWRConfig>,
	);

	return props;
}

function displayedMedications() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")).map(
		(row) => within(row as HTMLElement).getAllByRole("cell")[1].textContent,
	);
}

function rowFor(medication: string) {
	return screen.getByText(medication).closest("tr") as HTMLElement;
}

function urlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

type User = ReturnType<typeof userEvent.setup>;

async function openFilterSubmenu(user: User, name: string) {
	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(screen.getByRole("menuitem", { name }));
}

// jsdom has no layout, so a mouse move from a submenu trigger into its content reads as the
// pointer leaving the menu and the submenu closes. A tap has no move phase, so it behaves like
// a real click inside the submenu.
async function tap(user: User, target: Element) {
	await user.pointer({ keys: "[TouchA]", target });
}

describe("Medications table", () => {
	let savedMedicationDetails: typeof medicationDetails;

	beforeEach(() => {
		auth.role = "owner";
		createPatientMedicationMock.mockReset();
		updateMedicationMock.mockReset();
		savedMedicationDetails = { ...medicationDetails };
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const id = decodeURIComponent(String(input).split("/").pop() ?? "");
				return {
					ok: true,
					json: async () => ({ medication: savedMedicationDetails[id] ?? null }),
				} as Response;
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("re-orders rows when a sortable header is clicked", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		const medicationHeader = screen.getByRole("columnheader", { name: "Medication" });
		expect(medicationHeader).toHaveAttribute("aria-sort", "none");
		await user.click(medicationHeader);
		expect(medicationHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedMedications()).toEqual(["Amoxicillin", "Metformin"]);
		await user.click(medicationHeader);
		expect(medicationHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedMedications()).toEqual(["Metformin", "Amoxicillin"]);

		const routeHeader = screen.getByRole("columnheader", { name: "Route" });
		await user.click(routeHeader);
		expect(routeHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedMedications()).toEqual(["Amoxicillin", "Metformin"]);

		const createdHeader = screen.getByRole("columnheader", { name: "Created at" });
		await user.click(createdHeader);
		await user.click(createdHeader);
		expect(createdHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedMedications()).toEqual(["Metformin", "Amoxicillin"]);

		expect(screen.getByRole("columnheader", { name: "Dose" })).not.toHaveAttribute("aria-sort");
		expect(screen.getByRole("columnheader", { name: "Status" })).not.toHaveAttribute("aria-sort");
	});

	test("reports what the user types in the search box", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderMedicationsTable({ query: "Met" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by medication, dose, route, indication, medication ID, or encounter ID",
		);
		expect(search).toHaveValue("Met");
		await user.type(search, "f");
		expect(onQueryChange).toHaveBeenCalledWith("Metf");
	});

	test("adds and removes status filters from the filter menu", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange } = renderMedicationsTable({ statusFilters: ["active"] });

		await openFilterSubmenu(user, "Status");

		const activeOption = await screen.findByRole("checkbox", { name: "Active" });
		expect(activeOption).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Completed" })).not.toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Discontinued" })).not.toBeChecked();

		await tap(user, screen.getByRole("checkbox", { name: "Discontinued" }));
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith(["active", "discontinued"]);

		await tap(user, activeOption);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith([]);
	});

	test("applies created-at date presets", async () => {
		const user = userEvent.setup();
		const today = new Date();
		const { onCreatedAtRangeApply } = renderMedicationsTable();

		await openFilterSubmenu(user, "Created at");
		await tap(user, await screen.findByRole("menuitem", { name: "Today" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith(urlDate(today), urlDate(today));

		await tap(user, screen.getByRole("menuitem", { name: "Last 7 days" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith(
			urlDate(subDays(today, 6)),
			urlDate(today),
		);

		await tap(user, screen.getByRole("menuitem", { name: "Last 30 days" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith(
			urlDate(subDays(today, 29)),
			urlDate(today),
		);
	});

	test("shows active filters as pills that clear the matching filter", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange, onCreatedAtRangeApply } = renderMedicationsTable({
			statusFilters: ["completed", "discontinued"],
			createdFrom: "2020-01-01",
			createdTo: "",
		});

		expect(screen.getByText("Status: Completed")).toBeVisible();
		expect(screen.getByText("Status: Discontinued")).toBeVisible();
		expect(screen.getByText("Created: From Jan 1, 2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Completed filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith(["discontinued"]);
		await user.click(screen.getByRole("button", { name: /Remove Created:/ }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	test("clears every active filter at once", async () => {
		const user = userEvent.setup();
		const { onFiltersClear } = renderMedicationsTable({
			statusFilters: ["completed"],
			createdFrom: "2020-01-01",
		});

		await user.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onFiltersClear).toHaveBeenCalledTimes(1);
	});

	test("paginates through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderMedicationsTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	test("disables paging at the bounds and while a request is pending", () => {
		const { rerender } = render(<MedicationsTable {...buildProps({ page: 1, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

		rerender(<MedicationsTable {...buildProps({ page: 3, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

		rerender(<MedicationsTable {...buildProps({ page: 2, totalPages: 3, isPending: true })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderMedicationsTable({ limit: 14 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("14");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "28" }));
		expect(onLimitChange).toHaveBeenCalledWith(28);
	});

	test("opens the details drawer with the chosen row's data from the row actions", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Amoxicillin" }));
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "Medication details" });
		expect(await within(dialog).findByRole("heading", { name: "Amoxicillin" })).toBeVisible();
		expect(within(dialog).getByText("Three times daily")).toBeVisible();
		expect(within(dialog).getByText("7 days")).toBeVisible();
		expect(within(dialog).getByText("Dr. Adeyemi")).toBeVisible();
		expect(within(dialog).getByText("Created by Dr. Bello")).toBeVisible();
		expect(within(dialog).getByText("15 February 2020 at 09:00")).toBeVisible();
		expect(within(dialog).getByRole("heading", { name: "Activity" })).toBeVisible();
		const activityToggle = within(dialog).getByRole("button", {
			name: /Updated by Dr. Adeyemi .* 1 change/,
		});
		expect(activityToggle).toHaveAttribute("aria-expanded", "false");
		await user.click(activityToggle);
		const activity = within(dialog).getByRole("region", { name: /Updated by Dr. Adeyemi/ });
		const [doseChange, clinicalNote] = within(activity).getAllByRole("definition");
		expect(
			within(activity)
				.getAllByRole("term")
				.map((term) => term.textContent),
		).toEqual(["Dose", "Clinical note"]);
		expect(doseChange).toHaveTextContent("500 mg changed to 250 mg");
		expect(clinicalNote).toHaveTextContent(/^Patient reported nausea after the first dose\.$/);
		expect(within(dialog).queryByText("Metformin")).not.toBeInTheDocument();
	});

	test("opens the details drawer when a row is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		rowFor("Metformin").focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "Medication details" });
		expect(await within(dialog).findByRole("heading", { name: "Metformin" })).toBeVisible();
		expect(within(dialog).getByText("Twice daily")).toBeVisible();
		expect(within(dialog).getByText("Ongoing")).toBeVisible();
	});

	test("only offers status changes for active medications", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Metformin" }));
		expect(screen.getByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Discontinue" })).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(screen.getByRole("button", { name: "Open actions for Amoxicillin" }));
		expect(screen.getByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Mark as completed" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Discontinue" })).not.toBeInTheDocument();
	});

	test("asks to confirm before discontinuing an active medication from the details actions menu", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Metformin" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Medication details" });
		await within(dialog).findByRole("heading", { name: "Metformin" });

		await user.click(within(dialog).getByRole("button", { name: "Medication actions" }));
		expect(screen.getByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "Discontinue" }));

		const confirmation = await screen.findByRole("alertdialog", {
			name: "Discontinue medication?",
		});
		expect(
			within(confirmation).getByText(/removed from the patient’s active medication list/),
		).toBeVisible();
		expect(
			within(confirmation).getByRole("button", { name: "Discontinue medication" }),
		).toBeVisible();
	});

	test("offers bulk actions for the selected rows, including archive for an admin", async () => {
		auth.role = "admin";
		const user = userEvent.setup();
		renderMedicationsTable();

		const [selectAll] = within(screen.getByRole("table")).getAllByRole("checkbox");
		await user.click(selectAll);

		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Export all" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected medications" }));
		expect(screen.queryByText("2 items selected")).not.toBeInTheDocument();
	});

	test("hides archive actions from a member", async () => {
		auth.role = "member";
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Amoxicillin" }));
		expect(screen.getByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
		await user.keyboard("{Escape}");

		const [, firstRowCheckbox] = within(screen.getByRole("table")).getAllByRole("checkbox");
		await user.click(firstRowCheckbox);
		const bulkBar = screen.getByText("1 item selected").parentElement as HTMLElement;
		expect(within(bulkBar).getByRole("button", { name: "View details" })).toBeVisible();
		expect(within(bulkBar).getByRole("button", { name: "Export" })).toBeVisible();
		expect(within(bulkBar).queryByRole("button", { name: /Archive/ })).not.toBeInTheDocument();
	});

	test("adds a medication to the encounter it was opened from without a follow-up table request", async () => {
		createPatientMedicationMock.mockResolvedValue({ status: "success", medicationId: "MED-new" });
		const user = userEvent.setup();
		renderMedicationsTable({ encounterId: "ENC-1" });
		const today = new Date();

		await user.click(screen.getByRole("button", { name: "Add medication" }));
		const drawer = await screen.findByRole("dialog", { name: "Add medication" });
		await user.type(within(drawer).getByLabelText(/^Medication/), "Amlodipine");
		await user.type(within(drawer).getByLabelText(/Indication/), "Essential hypertension");
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Active" }));
		await user.type(within(drawer).getByLabelText(/Dose/), "5 mg");
		await user.click(within(drawer).getByRole("combobox", { name: /Route/ }));
		await user.click(await screen.findByRole("option", { name: "Oral" }));
		await user.type(within(drawer).getByLabelText(/Frequency/), "Once daily");
		await user.type(within(drawer).getByLabelText(/Duration/), "3 months");
		await user.click(within(drawer).getByRole("button", { name: /Started at/ }));
		await user.click(
			await screen.findByRole("button", { name: new RegExp(format(today, "MMMM do, yyyy")) }),
		);
		expect(within(drawer).getByLabelText(/Prescribed by/)).toHaveValue("Dr. Okafor");
		await user.click(within(drawer).getByRole("button", { name: "Add medication" }));

		expect(createPatientMedicationMock).toHaveBeenCalledTimes(1);
		const [patientId, formData] = createPatientMedicationMock.mock.calls[0] as [string, FormData];
		expect(patientId).toBe("patient-1");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				medicationName: "Amlodipine",
				indication: "Essential hypertension",
				status: "Active",
				dose: "5 mg",
				route: "Oral",
				prescribedBy: "Dr. Okafor",
				frequency: "Once daily",
				duration: "3 months",
				startedAt: format(today, "yyyy-MM-dd"),
				encounterId: "ENC-1",
			}),
		);
		expect(screen.queryByRole("dialog", { name: "Add medication" })).not.toBeInTheDocument();
	});

	test("keeps the add medication drawer open and shows why the medication was not saved", async () => {
		createPatientMedicationMock.mockResolvedValue({
			status: "failed",
			error: "We couldn’t add this medication. Please try again.",
		});
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Add medication" }));
		const drawer = await screen.findByRole("dialog", { name: "Add medication" });
		await user.type(within(drawer).getByLabelText(/^Medication/), "Metformin");
		await user.type(within(drawer).getByLabelText(/Indication/), "Type 2 diabetes");
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Active" }));
		await user.type(within(drawer).getByLabelText(/Dose/), "500 mg");
		await user.click(within(drawer).getByRole("combobox", { name: /Route/ }));
		await user.click(await screen.findByRole("option", { name: "Oral" }));
		await user.type(within(drawer).getByLabelText(/Frequency/), "Twice daily");
		await user.type(within(drawer).getByLabelText(/Duration/), "6 months");
		await user.click(within(drawer).getByRole("button", { name: "Add medication" }));

		expect(await within(drawer).findByRole("alert")).toHaveTextContent(
			"We couldn’t add this medication. Please try again.",
		);
		expect(within(drawer).getByLabelText(/^Medication/)).toHaveValue("Metformin");
	});

	async function openMedicationEditForm(user: ReturnType<typeof userEvent.setup>) {
		await user.click(screen.getByRole("button", { name: "Open actions for Amoxicillin" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Medication details" });
		await within(dialog).findByRole("heading", { name: "Amoxicillin" });
		await user.click(within(dialog).getByRole("button", { name: "Medication actions" }));
		await user.click(screen.getByRole("menuitem", { name: "Edit" }));

		return screen.findByRole("dialog", { name: "Edit medication details" });
	}

	test("saves edits from the details drawer and shows the saved medication", async () => {
		updateMedicationMock.mockImplementation(async () => {
			savedMedicationDetails["MED-amox"] = {
				...savedMedicationDetails["MED-amox"],
				frequency: "Twice daily",
			};
			return { status: "success" };
		});
		const user = userEvent.setup();
		renderMedicationsTable();

		const editDialog = await openMedicationEditForm(user);
		const changedField = within(editDialog).getByLabelText(/Frequency/);
		await user.clear(changedField);
		await user.type(changedField, "Twice daily");
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));

		const [recordId, formData] = updateMedicationMock.mock.calls[0] as [string, FormData];
		expect(recordId).toBe("MED-amox");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				medicationName: "Amoxicillin",
				indication: "Ear infection",
				status: "Completed",
				dose: "250 mg",
				route: "IV",
				prescribedBy: "Dr. Adeyemi",
				frequency: "Twice daily",
				duration: "7 days",
				startedAt: "2020-02-14",
				clinicalNote: "Course completed without side effects.",
			}),
		);
		const viewDialog = await screen.findByRole("dialog", { name: "Medication details" });
		expect(await within(viewDialog).findByText("Twice daily")).toBeVisible();
	});

	test("keeps the medication edit form open and shows why the changes were not saved", async () => {
		updateMedicationMock.mockResolvedValue({
			status: "failed",
			error: "Enter how often it is taken.",
		});
		const user = userEvent.setup();
		renderMedicationsTable();

		const editDialog = await openMedicationEditForm(user);
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));

		expect(await within(editDialog).findByRole("alert")).toHaveTextContent(
			"Enter how often it is taken.",
		);
	});
});
