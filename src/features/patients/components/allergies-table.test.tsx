import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AllergyDetailsType, AllergyType } from "@/features/patients/types";
import { AllergiesTable } from "./allergies-table";
import { SWRConfig } from "swr";

const auth = vi.hoisted(() => ({ role: "owner" }));
const { createPatientAllergyMock, updateAllergyMock } = vi.hoisted(() => ({
	createPatientAllergyMock: vi.fn(),
	updateAllergyMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: auth.role } }),
	},
}));

vi.mock("@/features/patients/server/create-patient-allergy-action", () => ({
	createPatientAllergyAction: createPatientAllergyMock,
}));

vi.mock("@/features/patients/server/update-patient-allergy-action", () => ({
	updatePatientAllergyAction: updateAllergyMock,
}));

const allergies: AllergyType[] = [
	{
		allergen: "Peanuts",
		allergyId: "AL-peanut",
		reaction: "Anaphylaxis",
		createdAtLabel: "Mar 3, 2021",
		createdAtSortValue: "2021-03-03",
		severity: "Severe",
		status: "Active",
	},
	{
		allergen: "Latex",
		allergyId: "AL-latex",
		reaction: "Rash",
		createdAtLabel: "Jan 9, 2020",
		createdAtSortValue: "2020-01-09",
		severity: "Mild",
		status: "Inactive",
	},
];

const allergyDetails: Record<string, AllergyDetailsType> = {
	"AL-peanut": {
		allergyId: "AL-peanut",
		encounterId: "ENC-1",
		allergen: "Peanuts",
		reaction: "Anaphylaxis within minutes",
		severity: "Severe",
		status: "Active",
		createdAt: "Mar 3, 2021",
		updatedAt: "Mar 10, 2021",
		createdBy: "Dr. Okafor",
		updatedBy: "Dr. Bello",
		clinicalNote: "Carries an epinephrine auto-injector.",
		editValues: {
			reaction: "Anaphylaxis within minutes",
			clinicalNote: "Carries an epinephrine auto-injector.",
		},
		history: [
			{
				id: "created",
				title: "Created",
				actor: "Dr. Okafor",
				timestamp: "3 March 2021 at 09:00",
				items: [{ label: "Severity", previousValue: "Moderate", value: "Severe" }],
			},
		],
	},
	"AL-latex": {
		allergyId: "AL-latex",
		encounterId: null,
		allergen: "Latex",
		reaction: "Contact rash on hands",
		severity: "Mild",
		status: "Inactive",
		createdAt: "Jan 9, 2020",
		updatedAt: "Feb 2, 2020",
		createdBy: "Nurse Chika",
		updatedBy: "Dr. Adeyemi",
		clinicalNote: "Avoid latex gloves.",
		editValues: {
			reaction: "Contact rash on hands",
			clinicalNote: "Avoid latex gloves.",
		},
		history: [
			{
				id: "created",
				title: "Created",
				actor: "Nurse Chika",
				timestamp: "9 January 2020 at 09:00",
				items: [{ label: "Severity", previousValue: "Moderate", value: "Mild" }],
			},
		],
	},
};

type AllergiesTableProps = React.ComponentProps<typeof AllergiesTable>;

function buildProps(overrides: Partial<AllergiesTableProps> = {}): AllergiesTableProps {
	return {
		patientId: "patient-1",
		allergies,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		createdFrom: "",
		createdTo: "",
		statusFilters: [],
		severityFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onSeverityFiltersChange: vi.fn(),
		onFiltersClear: vi.fn(),
		onAllergyCreated: vi.fn(),
		onAllergyUpdated: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};
}

function renderAllergiesTable(overrides: Partial<AllergiesTableProps> = {}) {
	const props = buildProps(overrides);

	render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<AllergiesTable {...props} />
		</SWRConfig>,
	);

	return props;
}

function displayedAllergens() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")).map(
		(row) => within(row as HTMLElement).getAllByRole("cell")[1].textContent,
	);
}

function rowFor(allergen: string) {
	return screen.getByText(allergen).closest("tr") as HTMLElement;
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

describe("Allergies table", () => {
	let savedAllergyDetails: typeof allergyDetails;

	beforeEach(() => {
		auth.role = "owner";
		createPatientAllergyMock.mockReset();
		updateAllergyMock.mockReset();
		savedAllergyDetails = { ...allergyDetails };
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const id = decodeURIComponent(String(input).split("/").pop() ?? "");
				return {
					ok: true,
					json: async () => ({ allergy: savedAllergyDetails[id] ?? null }),
				} as Response;
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("re-orders rows when a sortable header is clicked", async () => {
		const user = userEvent.setup();
		renderAllergiesTable();

		const allergenHeader = screen.getByRole("columnheader", { name: "Allergen" });
		expect(allergenHeader).toHaveAttribute("aria-sort", "none");
		await user.click(allergenHeader);
		expect(allergenHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedAllergens()).toEqual(["Latex", "Peanuts"]);
		await user.click(allergenHeader);
		expect(allergenHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedAllergens()).toEqual(["Peanuts", "Latex"]);

		const createdHeader = screen.getByRole("columnheader", { name: "Created at" });
		await user.click(createdHeader);
		expect(createdHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedAllergens()).toEqual(["Latex", "Peanuts"]);

		const severityHeader = screen.getByRole("columnheader", { name: "Severity" });
		await user.click(severityHeader);
		expect(severityHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedAllergens()).toEqual(["Latex", "Peanuts"]);

		expect(screen.getByRole("columnheader", { name: "Reaction" })).not.toHaveAttribute("aria-sort");
	});

	test("shows, sorts and selects every allergy on the current page", async () => {
		const user = userEvent.setup();
		const serverPage = Array.from({ length: 14 }, (_, index) => ({
			...allergies[0],
			allergyId: `AL-page-2-${index}`,
			allergen: `Allergen ${String(index + 1).padStart(2, "0")}`,
		}));
		renderAllergiesTable({ allergies: serverPage, page: 2, limit: 14, totalPages: 3 });
		const displayedPageAllergens = () =>
			within(screen.getByRole("table"))
				.getAllByRole("cell", { name: /^Allergen \d+$/ })
				.map((cell) => cell.textContent);

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		expect(displayedPageAllergens()).toEqual(serverPage.map((allergy) => allergy.allergen));
		await user.click(screen.getByRole("columnheader", { name: "Allergen" }));
		await user.click(screen.getByRole("columnheader", { name: "Allergen" }));
		expect(displayedPageAllergens()).toEqual(
			serverPage.map((allergy) => allergy.allergen).reverse(),
		);

		const [selectAll] = within(screen.getByRole("table")).getAllByRole("checkbox");
		await user.click(selectAll);
		expect(screen.getByText(`${serverPage.length} items selected`)).toBeVisible();
	});

	test("reports what the user types in the search box", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderAllergiesTable({ query: "Pea" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by allergen, reaction, severity, allergy ID, or encounter ID",
		);
		expect(search).toHaveValue("Pea");
		await user.type(search, "n");
		expect(onQueryChange).toHaveBeenCalledWith("Pean");
	});

	test("adds and removes status filters from the filter menu", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange } = renderAllergiesTable({ statusFilters: ["active"] });

		await openFilterSubmenu(user, "Status");

		const activeOption = await screen.findByRole("checkbox", { name: "Active" });
		const inactiveOption = screen.getByRole("checkbox", { name: "Inactive" });
		expect(activeOption).toBeChecked();
		expect(inactiveOption).not.toBeChecked();

		await tap(user, inactiveOption);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith(["active", "inactive"]);

		await tap(user, activeOption);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith([]);
	});

	test("adds and removes severity filters from the filter menu", async () => {
		const user = userEvent.setup();
		const { onSeverityFiltersChange } = renderAllergiesTable({ severityFilters: ["mild"] });

		await openFilterSubmenu(user, "Severity");

		const mildOption = await screen.findByRole("checkbox", { name: "Mild" });
		expect(mildOption).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Moderate" })).not.toBeChecked();

		await tap(user, screen.getByRole("checkbox", { name: "Severe" }));
		expect(onSeverityFiltersChange).toHaveBeenLastCalledWith(["mild", "severe"]);

		await tap(user, mildOption);
		expect(onSeverityFiltersChange).toHaveBeenLastCalledWith([]);
	});

	test("applies created-at date presets", async () => {
		const user = userEvent.setup();
		const today = new Date();
		const { onCreatedAtRangeApply } = renderAllergiesTable();

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
		const { onStatusFiltersChange, onSeverityFiltersChange, onCreatedAtRangeApply } =
			renderAllergiesTable({
				statusFilters: ["inactive"],
				severityFilters: ["mild", "severe"],
				createdFrom: "2020-01-01",
				createdTo: "2020-01-31",
			});

		expect(screen.getByText("Status: Inactive")).toBeVisible();
		expect(screen.getByText("Severity: Mild")).toBeVisible();
		expect(screen.getByText("Severity: Severe")).toBeVisible();
		expect(screen.getByText("Created: Jan 1, 2020 - Jan 31, 2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Inactive filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith([]);
		await user.click(screen.getByRole("button", { name: "Remove Severity: Mild filter" }));
		expect(onSeverityFiltersChange).toHaveBeenCalledWith(["severe"]);
		await user.click(screen.getByRole("button", { name: /Remove Created:/ }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	test("clears every active filter at once", async () => {
		const user = userEvent.setup();
		const { onFiltersClear } = renderAllergiesTable({
			statusFilters: ["inactive"],
			severityFilters: ["mild"],
		});

		await user.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onFiltersClear).toHaveBeenCalledTimes(1);
	});

	test("paginates through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderAllergiesTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	test("disables paging at the bounds and while a request is pending", () => {
		const { rerender } = render(<AllergiesTable {...buildProps({ page: 1, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

		rerender(<AllergiesTable {...buildProps({ page: 3, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

		rerender(<AllergiesTable {...buildProps({ page: 2, totalPages: 3, isPending: true })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderAllergiesTable({ limit: 14 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("14");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "42" }));
		expect(onLimitChange).toHaveBeenCalledWith(42);
	});

	test("opens the details drawer with the chosen row's data from the row actions", async () => {
		const user = userEvent.setup();
		renderAllergiesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Latex" }));
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View allergies details" });
		expect(await within(dialog).findByRole("heading", { name: "Latex" })).toBeVisible();
		expect(within(dialog).getByText("Contact rash on hands")).toBeVisible();
		expect(within(dialog).getByRole("heading", { name: "Activity" })).toBeVisible();
		expect(within(dialog).getByRole("button", { name: /Created by Nurse Chika/ })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		expect(within(dialog).getByText("Avoid latex gloves.")).toBeVisible();
		expect(within(dialog).queryByText("Peanuts")).not.toBeInTheDocument();
	});

	test("opens the details drawer when a row is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderAllergiesTable();

		rowFor("Peanuts").focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View allergies details" });
		expect(await within(dialog).findByRole("heading", { name: "Peanuts" })).toBeVisible();
		expect(within(dialog).getByText("Carries an epinephrine auto-injector.")).toBeVisible();
	});

	test("offers bulk actions for the selected rows, including archive for an admin", async () => {
		auth.role = "admin";
		const user = userEvent.setup();
		renderAllergiesTable();

		const [selectAll] = within(screen.getByRole("table")).getAllByRole("checkbox");
		await user.click(selectAll);

		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Export all" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected allergies" }));
		expect(screen.queryByText("2 items selected")).not.toBeInTheDocument();
	});

	test("hides archive actions from a member", async () => {
		auth.role = "member";
		const user = userEvent.setup();
		renderAllergiesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Latex" }));
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

	test("adds an allergy to the encounter it was opened from and refreshes the table", async () => {
		createPatientAllergyMock.mockResolvedValue({ status: "success", allergyId: "ALLE-new" });
		const user = userEvent.setup();
		const { onAllergyCreated } = renderAllergiesTable({ encounterId: "ENC-1" });

		await user.click(screen.getByRole("button", { name: "Add allergy" }));
		const drawer = await screen.findByRole("dialog", { name: "Add allergy" });
		await user.type(within(drawer).getByLabelText(/Allergen/), "Penicillin");
		await user.click(within(drawer).getByRole("combobox", { name: /Severity/ }));
		await user.click(await screen.findByRole("option", { name: "Severe" }));
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Active" }));
		await user.type(within(drawer).getByLabelText(/Reaction/), "Facial swelling");
		await user.click(within(drawer).getByRole("button", { name: "Add allergy" }));

		expect(createPatientAllergyMock).toHaveBeenCalledTimes(1);
		const [patientId, formData] = createPatientAllergyMock.mock.calls[0] as [string, FormData];
		expect(patientId).toBe("patient-1");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				allergen: "Penicillin",
				severity: "Severe",
				status: "Active",
				reaction: "Facial swelling",
				encounterId: "ENC-1",
			}),
		);
		expect(onAllergyCreated).toHaveBeenCalled();
		expect(screen.queryByRole("dialog", { name: "Add allergy" })).not.toBeInTheDocument();
	});

	test("keeps the add allergy drawer open and shows why the allergy was not saved", async () => {
		createPatientAllergyMock.mockResolvedValue({
			status: "failed",
			error: "We couldn’t add this allergy. Please try again.",
		});
		const user = userEvent.setup();
		const { onAllergyCreated } = renderAllergiesTable();

		await user.click(screen.getByRole("button", { name: "Add allergy" }));
		const drawer = await screen.findByRole("dialog", { name: "Add allergy" });
		await user.type(within(drawer).getByLabelText(/Allergen/), "Latex");
		await user.click(within(drawer).getByRole("combobox", { name: /Severity/ }));
		await user.click(await screen.findByRole("option", { name: "Mild" }));
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Active" }));
		await user.type(within(drawer).getByLabelText(/Reaction/), "Itching");
		await user.click(within(drawer).getByRole("button", { name: "Add allergy" }));

		expect(await within(drawer).findByRole("alert")).toHaveTextContent(
			"We couldn’t add this allergy. Please try again.",
		);
		expect(within(drawer).getByLabelText(/Allergen/)).toHaveValue("Latex");
		expect(onAllergyCreated).not.toHaveBeenCalled();
	});

	async function openAllergyEditForm(user: ReturnType<typeof userEvent.setup>) {
		await user.click(screen.getByRole("button", { name: "Open actions for Latex" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "View allergies details" });
		await within(dialog).findByRole("heading", { name: "Latex" });
		await user.click(within(dialog).getByRole("button", { name: "Allergy actions" }));
		await user.click(screen.getByRole("menuitem", { name: "Edit" }));

		return screen.findByRole("dialog", { name: "Edit allergies details" });
	}

	test("saves edits from the details drawer and shows the saved allergy", async () => {
		updateAllergyMock.mockImplementation(async () => {
			savedAllergyDetails["AL-latex"] = {
				...savedAllergyDetails["AL-latex"],
				reaction: "Hives on both hands",
			};
			return { status: "success" };
		});
		const user = userEvent.setup();
		const { onAllergyUpdated } = renderAllergiesTable();

		const editDialog = await openAllergyEditForm(user);
		const changedField = within(editDialog).getByLabelText(/Reaction/);
		await user.clear(changedField);
		await user.type(changedField, "Hives on both hands");
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));

		const [recordId, formData] = updateAllergyMock.mock.calls[0] as [string, FormData];
		expect(recordId).toBe("AL-latex");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				allergen: "Latex",
				severity: "Mild",
				status: "Inactive",
				reaction: "Hives on both hands",
				clinicalNote: "Avoid latex gloves.",
			}),
		);
		const viewDialog = await screen.findByRole("dialog", { name: "View allergies details" });
		expect(await within(viewDialog).findByText("Hives on both hands")).toBeVisible();
		expect(onAllergyUpdated).toHaveBeenCalledTimes(1);
	});

	test("keeps the allergy edit form open and shows why the changes were not saved", async () => {
		updateAllergyMock.mockResolvedValue({ status: "failed", error: "Describe the reaction." });
		const user = userEvent.setup();
		const { onAllergyUpdated } = renderAllergiesTable();

		const editDialog = await openAllergyEditForm(user);
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));

		expect(await within(editDialog).findByRole("alert")).toHaveTextContent(
			"Describe the reaction.",
		);
		expect(onAllergyUpdated).not.toHaveBeenCalled();
	});
});
