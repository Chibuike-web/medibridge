import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { DiagnosisDetailsType, DiagnosisType } from "@/features/patients/types";
import { DiagnosesTable } from "./diagnoses-table";

const auth = vi.hoisted(() => ({ role: "owner" }));
const { createPatientDiagnosisMock } = vi.hoisted(() => ({ createPatientDiagnosisMock: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: auth.role } }),
		useSession: () => ({ data: { user: { name: "Dr. Okafor" } } }),
	},
}));

vi.mock("@/features/patients/server/create-patient-diagnosis-action", () => ({
	createPatientDiagnosisAction: createPatientDiagnosisMock,
}));

const diagnoses: DiagnosisType[] = [
	{
		name: "Hypertension",
		diagnosedAtLabel: "Jan 5, 2020",
		diagnosedAtSortValue: "2020-01-05",
		lastReviewedLabel: "Mar 1, 2020",
		lastReviewedSortValue: "2020-03-01",
		diagnosisId: "DX-hyper",
		createdAtLabel: "Jan 6, 2020",
		createdAtSortValue: "2020-01-06",
		status: "Active",
	},
	{
		name: "Asthma",
		diagnosedAtLabel: "Feb 10, 2019",
		diagnosedAtSortValue: "2019-02-10",
		lastReviewedLabel: "Feb 1, 2020",
		lastReviewedSortValue: "2020-02-01",
		diagnosisId: "DX-asthma",
		createdAtLabel: "Feb 11, 2019",
		createdAtSortValue: "2019-02-11",
		status: "Resolved",
	},
];

const diagnosisDetails: Record<string, DiagnosisDetailsType> = {
	"DX-hyper": {
		diagnosisId: "DX-hyper",
		encounterId: "ENC-1",
		name: "Hypertension",
		status: "Active",
		severityStage: "Stage 2",
		diagnosedAt: "Jan 5, 2020",
		createdAt: "Jan 6, 2020",
		updatedAt: "Mar 1, 2020",
		lastReviewedAt: "Mar 1, 2020",
		diagnosedBy: "Dr. Okafor",
		createdBy: "Dr. Okafor",
		updatedBy: "Dr. Bello",
		clinicalNote: "Blood pressure remains elevated.",
		history: [],
		relatedRecords: { medications: [], labTests: [], imaging: [], procedures: [] },
	},
	"DX-asthma": {
		diagnosisId: "DX-asthma",
		encounterId: null,
		name: "Asthma",
		status: "Resolved",
		severityStage: "Mild",
		diagnosedAt: "Feb 10, 2019",
		createdAt: "Feb 11, 2019",
		updatedAt: "Feb 1, 2020",
		lastReviewedAt: "Feb 1, 2020",
		diagnosedBy: "Dr. Adeyemi",
		createdBy: "Nurse Chika",
		updatedBy: "Dr. Bello",
		clinicalNote: "Symptom free for twelve months.",
		history: [],
		relatedRecords: { medications: [], labTests: [], imaging: [], procedures: [] },
	},
};

type DiagnosesTableProps = React.ComponentProps<typeof DiagnosesTable>;

function buildProps(overrides: Partial<DiagnosesTableProps> = {}): DiagnosesTableProps {
	return {
		patientId: "patient-1",
		diagnoses,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		createdFrom: "",
		createdTo: "",
		diagnosedFrom: "",
		diagnosedTo: "",
		isPending: false,
		lastReviewedFrom: "",
		lastReviewedTo: "",
		statusFilters: [],
		onCreatedAtRangeApply: vi.fn(),
		onDiagnosedAtRangeApply: vi.fn(),
		onLastReviewedRangeApply: vi.fn(),
		onQueryChange: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onFiltersClear: vi.fn(),
		onDiagnosisCreated: vi.fn(),
		...overrides,
	};
}

function renderDiagnosesTable(overrides: Partial<DiagnosesTableProps> = {}) {
	const props = buildProps(overrides);

	render(<DiagnosesTable {...props} />);

	return props;
}

function displayedNames() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")).map(
		(row) => within(row as HTMLElement).getAllByRole("cell")[1].textContent,
	);
}

function rowFor(name: string) {
	return screen.getByText(name).closest("tr") as HTMLElement;
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

describe("Diagnoses table", () => {
	beforeEach(() => {
		auth.role = "owner";
		createPatientDiagnosisMock.mockReset();
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const id = decodeURIComponent(String(input).split("/").pop() ?? "");
				return {
					ok: true,
					json: async () => ({ diagnosis: diagnosisDetails[id] ?? null }),
				} as Response;
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("lists diagnoses alphabetically with their dates, IDs and statuses", () => {
		renderDiagnosesTable();

		expect(screen.getByRole("heading", { name: "Diagnoses" })).toBeVisible();
		for (const header of [
			"Diagnosis name",
			"Diagnosed At",
			"Last Reviewed",
			"Diagnosis ID",
			"Created At",
			"Status",
		]) {
			expect(screen.getByRole("columnheader", { name: header })).toBeVisible();
		}

		expect(displayedNames()).toEqual(["Asthma", "Hypertension"]);

		const hypertensionRow = rowFor("Hypertension");
		expect(within(hypertensionRow).getByRole("cell", { name: "Jan 5, 2020" })).toBeVisible();
		expect(within(hypertensionRow).getByRole("cell", { name: "Mar 1, 2020" })).toBeVisible();
		expect(within(hypertensionRow).getByRole("cell", { name: "Jan 6, 2020" })).toBeVisible();
		expect(within(hypertensionRow).getByRole("button", { name: "Copy DX-hyper" })).toBeVisible();
		expect(within(hypertensionRow).getByText("Active")).toBeVisible();

		const asthmaRow = rowFor("Asthma");
		expect(within(asthmaRow).getByText("Resolved")).toBeVisible();
		expect(within(asthmaRow).getByRole("button", { name: "Copy DX-asthma" })).toBeVisible();
	});

	test("re-orders rows when a sortable header is clicked", async () => {
		const user = userEvent.setup();
		renderDiagnosesTable();

		const nameHeader = screen.getByRole("columnheader", { name: "Diagnosis name" });
		expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
		await user.click(nameHeader);
		expect(nameHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedNames()).toEqual(["Hypertension", "Asthma"]);

		const diagnosedHeader = screen.getByRole("columnheader", { name: "Diagnosed At" });
		await user.click(diagnosedHeader);
		expect(diagnosedHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedNames()).toEqual(["Asthma", "Hypertension"]);
		await user.click(diagnosedHeader);
		expect(diagnosedHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedNames()).toEqual(["Hypertension", "Asthma"]);

		expect(screen.getByRole("columnheader", { name: "Diagnosis ID" })).not.toHaveAttribute(
			"aria-sort",
		);
	});

	test("reports what the user types in the search box", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderDiagnosesTable({ query: "Hyper" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by diagnosis, diagnosis ID, or encounter ID",
		);
		expect(search).toHaveValue("Hyper");
		await user.type(search, "t");
		expect(onQueryChange).toHaveBeenCalledWith("Hypert");
	});

	test("adds and removes status filters from the filter menu", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange } = renderDiagnosesTable({ statusFilters: ["active"] });

		await openFilterSubmenu(user, "Status");

		const activeOption = await screen.findByRole("checkbox", { name: "Active" });
		const resolvedOption = screen.getByRole("checkbox", { name: "Resolved" });
		expect(activeOption).toBeChecked();
		expect(resolvedOption).not.toBeChecked();

		await tap(user, resolvedOption);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith(["active", "resolved"]);

		await tap(user, activeOption);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith([]);
	});

	test("applies date presets to the matching date filter", async () => {
		const user = userEvent.setup();
		const today = new Date();
		const { onDiagnosedAtRangeApply, onLastReviewedRangeApply, onCreatedAtRangeApply } =
			renderDiagnosesTable();

		await openFilterSubmenu(user, "Diagnosed At");
		await tap(user, await screen.findByRole("menuitem", { name: "Today" }));
		expect(onDiagnosedAtRangeApply).toHaveBeenCalledWith(urlDate(today), urlDate(today));

		await user.click(screen.getByRole("menuitem", { name: "Last updated" }));
		await tap(user, await screen.findByRole("menuitem", { name: "Last 7 days" }));
		expect(onLastReviewedRangeApply).toHaveBeenCalledWith(
			urlDate(subDays(today, 6)),
			urlDate(today),
		);

		await user.click(screen.getByRole("menuitem", { name: "Created at" }));
		await tap(user, await screen.findByRole("menuitem", { name: "Last 30 days" }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(urlDate(subDays(today, 29)), urlDate(today));
	});

	test("shows active filters as pills that clear the matching filter", async () => {
		const user = userEvent.setup();
		const {
			onStatusFiltersChange,
			onDiagnosedAtRangeApply,
			onLastReviewedRangeApply,
			onCreatedAtRangeApply,
		} = renderDiagnosesTable({
			statusFilters: ["active", "resolved"],
			diagnosedFrom: "2020-01-01",
			diagnosedTo: "2020-01-31",
			lastReviewedFrom: "2020-02-01",
			lastReviewedTo: "",
			createdFrom: "",
			createdTo: "2020-03-15",
		});

		expect(screen.getByText("Status: Active")).toBeVisible();
		expect(screen.getByText("Status: Resolved")).toBeVisible();
		expect(screen.getByText("Diagnosed: Jan 1, 2020 - Jan 31, 2020")).toBeVisible();
		expect(screen.getByText("Last reviewed: From Feb 1, 2020")).toBeVisible();
		expect(screen.getByText("Created: Until Mar 15, 2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Active filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith(["resolved"]);
		await user.click(screen.getByRole("button", { name: /Remove Diagnosed:/ }));
		expect(onDiagnosedAtRangeApply).toHaveBeenCalledWith("", "");
		await user.click(screen.getByRole("button", { name: /Remove Last reviewed:/ }));
		expect(onLastReviewedRangeApply).toHaveBeenCalledWith("", "");
		await user.click(screen.getByRole("button", { name: /Remove Created:/ }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	test("clears every active filter at once", async () => {
		const user = userEvent.setup();
		const { onFiltersClear } = renderDiagnosesTable({
			statusFilters: ["resolved"],
			diagnosedFrom: "2020-01-01",
		});

		await user.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onFiltersClear).toHaveBeenCalledTimes(1);
	});

	test("paginates through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderDiagnosesTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	test("disables paging at the bounds and while a request is pending", () => {
		const { rerender } = render(<DiagnosesTable {...buildProps({ page: 1, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

		rerender(<DiagnosesTable {...buildProps({ page: 3, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

		rerender(<DiagnosesTable {...buildProps({ page: 2, totalPages: 3, isPending: true })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderDiagnosesTable({ limit: 14 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("14");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "28" }));
		expect(onLimitChange).toHaveBeenCalledWith(28);
	});

	test("opens the details drawer with the chosen row's data from the row actions", async () => {
		const user = userEvent.setup();
		renderDiagnosesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Asthma" }));
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View diagnosis details" });
		expect(await within(dialog).findByRole("heading", { name: "Asthma" })).toBeVisible();
		expect(within(dialog).getByText("Mild")).toBeVisible();
		expect(within(dialog).getByText("Dr. Adeyemi")).toBeVisible();
		expect(within(dialog).getByText("Symptom free for twelve months.")).toBeVisible();
		expect(within(dialog).queryByText("Hypertension")).not.toBeInTheDocument();
		expect(within(dialog).queryByRole("heading", { name: "Activity" })).not.toBeInTheDocument();
	});

	test("switches the details drawer to edit mode from its actions menu", async () => {
		const user = userEvent.setup();
		renderDiagnosesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Asthma" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "View diagnosis details" });
		await within(dialog).findByRole("heading", { name: "Asthma" });

		await user.click(within(dialog).getByRole("button", { name: "Diagnosis actions" }));
		await user.click(screen.getByRole("menuitem", { name: "Edit" }));

		const editDialog = await screen.findByRole("dialog", { name: "Edit diagnosis details" });
		expect(within(editDialog).getByRole("button", { name: "Save changes" })).toBeVisible();
	});

	test("asks an owner to confirm before archiving from the details actions menu", async () => {
		const user = userEvent.setup();
		renderDiagnosesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Asthma" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "View diagnosis details" });
		await within(dialog).findByRole("heading", { name: "Asthma" });

		await user.click(within(dialog).getByRole("button", { name: "Diagnosis actions" }));
		await user.click(screen.getByRole("menuitem", { name: "Archive" }));

		const confirmation = await screen.findByRole("alertdialog", { name: "Archive diagnosis" });
		expect(
			within(confirmation).getByText(/removed from the patient’s active problem list/),
		).toBeVisible();

		await user.click(within(confirmation).getByRole("button", { name: "Cancel" }));
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
		expect(screen.getByRole("dialog", { name: "View diagnosis details" })).toBeVisible();
	});

	test("hides Archive from a member in the details actions menu", async () => {
		auth.role = "member";
		const user = userEvent.setup();
		renderDiagnosesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Asthma" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "View diagnosis details" });
		await within(dialog).findByRole("heading", { name: "Asthma" });

		await user.click(within(dialog).getByRole("button", { name: "Diagnosis actions" }));

		expect(screen.getByRole("menuitem", { name: "Edit" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
	});

	test("opens the details drawer when a row is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderDiagnosesTable();

		rowFor("Hypertension").focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View diagnosis details" });
		expect(await within(dialog).findByRole("heading", { name: "Hypertension" })).toBeVisible();
		expect(within(dialog).getByText("Blood pressure remains elevated.")).toBeVisible();
	});

	test("offers bulk actions for the selected rows, including archive for an owner", async () => {
		const user = userEvent.setup();
		renderDiagnosesTable();

		const [selectAll] = within(screen.getByRole("table")).getAllByRole("checkbox");
		await user.click(selectAll);

		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Export all" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected diagnoses" }));
		expect(screen.queryByText("2 items selected")).not.toBeInTheDocument();
	});

	test("hides archive actions from a member", async () => {
		auth.role = "member";
		const user = userEvent.setup();
		renderDiagnosesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Asthma" }));
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

	test("adds a diagnosis to the encounter it was opened from and refreshes the table", async () => {
		createPatientDiagnosisMock.mockResolvedValue({ status: "success", diagnosisId: "DX-new" });
		const user = userEvent.setup();
		const { onDiagnosisCreated } = renderDiagnosesTable({ encounterId: "ENC-1" });
		const today = new Date();

		await user.click(screen.getByRole("button", { name: "Add diagnosis" }));
		const drawer = await screen.findByRole("dialog", { name: "Add diagnosis" });
		await user.type(within(drawer).getByLabelText(/Diagnosis name/), "Essential hypertension");
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Active" }));
		await user.click(within(drawer).getByRole("button", { name: /Diagnosed at/ }));
		await user.click(
			await screen.findByRole("button", { name: new RegExp(format(today, "MMMM do, yyyy")) }),
		);
		expect(within(drawer).getByLabelText(/Diagnosed by/)).toHaveValue("Dr. Okafor");
		await user.click(within(drawer).getByRole("button", { name: "Add diagnosis" }));

		expect(createPatientDiagnosisMock).toHaveBeenCalledTimes(1);
		const [patientId, formData] = createPatientDiagnosisMock.mock.calls[0] as [string, FormData];
		expect(patientId).toBe("patient-1");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				diagnosisName: "Essential hypertension",
				status: "Active",
				diagnosedAt: format(today, "yyyy-MM-dd"),
				diagnosedBy: "Dr. Okafor",
				encounterId: "ENC-1",
			}),
		);
		expect(onDiagnosisCreated).toHaveBeenCalled();
		expect(screen.queryByRole("dialog", { name: "Add diagnosis" })).not.toBeInTheDocument();
	});

	test("keeps the add diagnosis drawer open and shows why the diagnosis was not saved", async () => {
		createPatientDiagnosisMock.mockResolvedValue({
			status: "failed",
			error: "Select the diagnosis date.",
		});
		const user = userEvent.setup();
		const { onDiagnosisCreated } = renderDiagnosesTable();

		await user.click(screen.getByRole("button", { name: "Add diagnosis" }));
		const drawer = await screen.findByRole("dialog", { name: "Add diagnosis" });
		await user.type(within(drawer).getByLabelText(/Diagnosis name/), "Asthma");
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Active" }));
		await user.click(within(drawer).getByRole("button", { name: "Add diagnosis" }));

		expect(await within(drawer).findByRole("alert")).toHaveTextContent(
			"Select the diagnosis date.",
		);
		expect(within(drawer).getByLabelText(/Diagnosis name/)).toHaveValue("Asthma");
		expect(onDiagnosisCreated).not.toHaveBeenCalled();
	});
});
