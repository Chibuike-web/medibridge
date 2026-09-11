import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, setDate, startOfMonth, subDays } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EncounterType } from "@/features/patients/types";
import { EncountersTable } from "./encounters-table";

const authState = vi.hoisted(() => ({ role: "owner" }));
const router = vi.hoisted(() => ({ push: vi.fn(), prefetch: vi.fn() }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: authState.role } }),
	},
}));

vi.mock("next/navigation", () => ({
	useRouter: () => router,
}));

const encounters: EncounterType[] = [
	{
		encounterId: "ENC-2001",
		patientId: "patient-a",
		encounterDateLabel: "Mar 5, 2024",
		encounterDateSortValue: "2024-03-05",
		createdAtLabel: "Mar 5, 2024",
		createdAtSortValue: "2024-03-05",
		updatedAtLabel: "Mar 6, 2024",
		updatedAtSortValue: "2024-03-06",
		createdBy: "Dr. Okafor",
		updatedBy: "Dr. Okafor",
		encounterType: "Routine Checkup",
		department: "General Medicine",
		physician: "Dr. Amaka Okafor",
	},
	{
		encounterId: "ENC-1001",
		patientId: "patient-a",
		encounterDateLabel: "Jan 12, 2024",
		encounterDateSortValue: "2024-01-12",
		createdAtLabel: "Jan 12, 2024",
		createdAtSortValue: "2024-01-12",
		updatedAtLabel: "Jan 12, 2024",
		updatedAtSortValue: "2024-01-12",
		createdBy: "Dr. Bello",
		updatedBy: "Dr. Bello",
		encounterType: "Emergency Visit",
		department: "Emergency Medicine",
		physician: "Dr. Zainab Bello",
	},
];

function renderEncountersTable(
	overrides: Partial<React.ComponentProps<typeof EncountersTable>> = {},
) {
	const props: React.ComponentProps<typeof EncountersTable> = {
		patientId: "patient-a",
		encounters,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		encounterFrom: "",
		encounterTo: "",
		createdFrom: "",
		createdTo: "",
		encounterTypeFilters: [],
		departmentFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onEncounterDateRangeApply: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onEncounterTypeFiltersChange: vi.fn(),
		onDepartmentFiltersChange: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};

	render(<EncountersTable {...props} />);

	return props;
}

function bodyRows() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")) as HTMLElement[];
}

function displayedIds() {
	return bodyRows().map((row) => within(row).getAllByRole("cell")[3].textContent);
}

function rowsPerPagePicker() {
	return within(screen.getByText("Rows per page").parentElement as HTMLElement).getByRole(
		"combobox",
	);
}

// jsdom has no layout geometry, so moving a synthetic pointer into the positioned
// side panel can fire the root menu's leave handler before the intended control is clicked.
function clickInSubmenu(element: HTMLElement) {
	fireEvent.click(element);
}

async function openFilterSubmenu(user: ReturnType<typeof userEvent.setup>, label: string) {
	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(screen.getByRole("menuitem", { name: label }));
}

function calendarDay(date: Date) {
	return screen.getByRole("button", { name: new RegExp(format(date, "MMMM do, yyyy")) });
}

describe("Encounters table", () => {
	beforeEach(() => {
		authState.role = "owner";
	});

	it("shows each encounter's date, type, ID, department and physician", () => {
		renderEncountersTable();

		for (const label of [
			"Encounter date",
			"Encounter Type",
			"Encounter ID",
			"Department",
			"Physician",
		]) {
			expect(screen.getByRole("columnheader", { name: label })).toBeVisible();
		}

		const [firstRow, secondRow] = bodyRows();
		expect(within(firstRow).getByText("Mar 5, 2024")).toBeVisible();
		expect(within(firstRow).getByText("Routine Checkup")).toBeVisible();
		expect(within(firstRow).getByRole("button", { name: "Copy ENC-2001" })).toBeVisible();
		expect(within(firstRow).getByText("General Medicine")).toBeVisible();
		expect(within(firstRow).getByText("Dr. Amaka Okafor")).toBeVisible();

		expect(within(secondRow).getByText("Jan 12, 2024")).toBeVisible();
		expect(within(secondRow).getByText("Emergency Visit")).toBeVisible();
		expect(within(secondRow).getByRole("button", { name: "Copy ENC-1001" })).toBeVisible();
	});

	it("shows an empty message when the patient has no encounters", () => {
		renderEncountersTable({ encounters: [] });

		expect(screen.getByText("No matching encounters found.")).toBeVisible();
		expect(bodyRows()).toHaveLength(1);
	});

	it("reports what the user types in the search box", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderEncountersTable({ query: "Cardio" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by type, department, physician, or encounter ID",
		);
		expect(search).toHaveValue("Cardio");
		await user.type(search, "l");
		expect(onQueryChange).toHaveBeenCalledWith("Cardiol");
	});

	it("re-orders rows when the user sorts by encounter date", async () => {
		const user = userEvent.setup();
		renderEncountersTable();

		expect(displayedIds()).toEqual(["ENC-2001", "ENC-1001"]);

		const dateHeader = screen.getByRole("columnheader", { name: "Encounter date" });
		await user.click(dateHeader);
		expect(dateHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(["ENC-1001", "ENC-2001"]);

		await user.click(dateHeader);
		expect(dateHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedIds()).toEqual(["ENC-2001", "ENC-1001"]);
	});

	it("sorts by physician from the keyboard", async () => {
		const user = userEvent.setup();
		renderEncountersTable();

		const physicianHeader = screen.getByRole("columnheader", { name: "Physician" });
		physicianHeader.focus();
		await user.keyboard("{Enter}");
		expect(physicianHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(["ENC-2001", "ENC-1001"]);
		await user.keyboard("{Enter}");
		expect(displayedIds()).toEqual(["ENC-1001", "ENC-2001"]);
	});

	it("does not allow sorting by encounter ID", () => {
		renderEncountersTable();

		expect(screen.getByRole("columnheader", { name: "Encounter ID" })).not.toHaveAttribute(
			"aria-sort",
		);
	});

	it("lists encounter, department, and date filters", async () => {
		const user = userEvent.setup();
		renderEncountersTable();

		await user.click(screen.getByRole("button", { name: "Filter" }));

		for (const label of ["Encounter date", "Encounter type", "Created at", "Department"]) {
			expect(screen.getByRole("menuitem", { name: label })).toBeVisible();
		}
	});

	it("adds and removes encounter type filters from the Encounter type submenu", async () => {
		const user = userEvent.setup();
		const { onEncounterTypeFiltersChange } = renderEncountersTable({
			encounterTypeFilters: ["emergency-visit"],
		});

		await openFilterSubmenu(user, "Encounter type");

		const emergency = await screen.findByRole("checkbox", { name: "Emergency Visit" });
		expect(emergency).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Routine Checkup" })).not.toBeChecked();

		clickInSubmenu(screen.getByRole("checkbox", { name: "Routine Checkup" }));
		expect(onEncounterTypeFiltersChange).toHaveBeenLastCalledWith([
			"emergency-visit",
			"routine-checkup",
		]);

		clickInSubmenu(emergency);
		expect(onEncounterTypeFiltersChange).toHaveBeenLastCalledWith([]);
	});

	it("adds department filters from the Department submenu", async () => {
		const user = userEvent.setup();
		const { onDepartmentFiltersChange } = renderEncountersTable();

		await openFilterSubmenu(user, "Department");

		clickInSubmenu(await screen.findByRole("checkbox", { name: "Cardiology" }));
		expect(onDepartmentFiltersChange).toHaveBeenCalledWith(["cardiology"]);
	});

	it("applies an encounter date preset as a from/to range", async () => {
		const user = userEvent.setup();
		const { onEncounterDateRangeApply } = renderEncountersTable();

		await openFilterSubmenu(user, "Encounter date");
		clickInSubmenu(await screen.findByRole("menuitem", { name: "Last 7 days" }));

		const today = new Date();
		expect(onEncounterDateRangeApply).toHaveBeenCalledWith(
			format(subDays(today, 6), "yyyy-MM-dd"),
			format(today, "yyyy-MM-dd"),
		);
	});

	it("applies a custom created-at range picked on the calendar and can reset it", async () => {
		const user = userEvent.setup();
		const { onCreatedAtRangeApply } = renderEncountersTable();

		await openFilterSubmenu(user, "Created at");

		const applyButton = await screen.findByRole("button", { name: "Apply" });
		expect(applyButton).toBeDisabled();

		const rangeStart = setDate(startOfMonth(new Date()), 3);
		const rangeEnd = setDate(startOfMonth(new Date()), 5);
		clickInSubmenu(calendarDay(rangeStart));
		clickInSubmenu(calendarDay(rangeEnd));

		expect(screen.getByText(format(rangeStart, "dd/MM/yyyy"))).toBeVisible();
		expect(screen.getByText(format(rangeEnd, "dd/MM/yyyy"))).toBeVisible();
		expect(applyButton).toBeEnabled();

		clickInSubmenu(applyButton);
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(
			format(rangeStart, "yyyy-MM-dd"),
			format(rangeEnd, "yyyy-MM-dd"),
		);

		clickInSubmenu(screen.getByRole("button", { name: "Reset" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith("", "");
	});

	it("shows active filters as pills the user can remove", async () => {
		const user = userEvent.setup();
		const {
			onEncounterTypeFiltersChange,
			onDepartmentFiltersChange,
			onEncounterDateRangeApply,
			onCreatedAtRangeApply,
		} = renderEncountersTable({
			encounterTypeFilters: ["follow-up-visit", "routine-checkup"],
			departmentFilters: ["nephrology"],
			encounterFrom: "2024-01-01",
			encounterTo: "2024-01-31",
			createdFrom: "2024-02-01",
			createdTo: "",
		});

		expect(screen.getByText("Type: Follow Up Visit")).toBeVisible();
		expect(screen.getByText("Type: Routine Checkup")).toBeVisible();
		expect(screen.getByText("Department: Nephrology")).toBeVisible();
		expect(screen.getByText("Encounter: Jan 1, 2024 - Jan 31, 2024")).toBeVisible();
		expect(screen.getByText("Created: From Feb 1, 2024")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Type: Follow Up Visit filter" }));
		expect(onEncounterTypeFiltersChange).toHaveBeenCalledWith(["routine-checkup"]);

		await user.click(screen.getByRole("button", { name: "Remove Department: Nephrology filter" }));
		expect(onDepartmentFiltersChange).toHaveBeenCalledWith([]);

		await user.click(screen.getByRole("button", { name: /Remove Encounter:/ }));
		expect(onEncounterDateRangeApply).toHaveBeenCalledWith("", "");

		await user.click(screen.getByRole("button", { name: /Remove Created:/ }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	it("shows no filter pills when no filters are active", () => {
		renderEncountersTable();

		expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
	});

	it("paginates through the owner callbacks and shows the current page", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderEncountersTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	it("disables Previous on the first page and Next on the last page", () => {
		renderEncountersTable({ page: 1, totalPages: 1 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("disables paging and the rows-per-page picker while a request is pending", () => {
		renderEncountersTable({ page: 2, totalPages: 3, isPending: true });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		expect(rowsPerPagePicker()).toBeDisabled();
	});

	it("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderEncountersTable();

		const picker = rowsPerPagePicker();
		expect(picker).toHaveTextContent("14");
		await user.click(picker);
		await user.click(await screen.findByRole("option", { name: "28" }));
		expect(onLimitChange).toHaveBeenCalledWith(28);
	});

	it("opens the encounter detail page when a row is activated", async () => {
		const user = userEvent.setup();
		renderEncountersTable();

		const [firstRow] = bodyRows();
		await user.click(within(firstRow).getByText("Dr. Amaka Okafor"));
		expect(router.push).toHaveBeenCalledWith("/dashboard/patients/patient-a/encounters/ENC-2001");

		firstRow.focus();
		await user.keyboard("{Enter}");
		expect(router.push).toHaveBeenCalledTimes(2);
	});

	it("links the row actions to that encounter's detail page and offers Archive to an owner", async () => {
		const user = userEvent.setup();
		renderEncountersTable();

		await user.click(screen.getByRole("button", { name: "Open actions for ENC-1001" }));

		const viewDetails = await screen.findByRole("menuitem", { name: "View details" });
		expect(viewDetails).toHaveAttribute(
			"href",
			"/dashboard/patients/patient-a/encounters/ENC-1001",
		);
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Archive" })).toBeVisible();
	});

	it("hides Archive from a member in the row actions and the bulk bar", async () => {
		authState.role = "member";
		const user = userEvent.setup();
		renderEncountersTable();

		await user.click(screen.getByRole("button", { name: "Open actions for ENC-1001" }));
		expect(await screen.findByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
		await user.keyboard("{Escape}");

		const [firstRow] = bodyRows();
		await user.click(within(firstRow).getByRole("checkbox"));
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.queryByRole("button", { name: /Archive/ })).not.toBeInTheDocument();
	});

	it("shows a bulk action bar for selected rows with Archive for an admin", async () => {
		authState.role = "admin";
		const user = userEvent.setup();
		renderEncountersTable();

		const [firstRow, secondRow] = bodyRows();
		await user.click(within(firstRow).getByRole("checkbox"));
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "View details" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "View details" }));
		expect(router.push).toHaveBeenCalledWith("/dashboard/patients/patient-a/encounters/ENC-2001");

		await user.click(within(secondRow).getByRole("checkbox"));
		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.queryByRole("button", { name: "View details" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected encounters" }));
		expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
	});

	it("opens the create encounter drawer from the Create encounter button", async () => {
		const user = userEvent.setup();
		renderEncountersTable();

		await user.click(screen.getByRole("button", { name: "Create encounter" }));

		const dialog = await screen.findByRole("dialog", { name: "Create encounter" });
		expect(within(dialog).getByRole("button", { name: /Vitals/ })).toBeVisible();
	});
});
