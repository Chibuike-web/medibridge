import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import { SharedAllergiesTable } from "./allergies-table";
import { SharedDiagnosesTable } from "./diagnoses-table";
import { SharedImagingTable } from "./imaging-table";
import { SharedImmunizationsTable } from "./immunizations-table";
import { SharedLabTestsTable } from "./lab-tests-table";
import { SharedMedicationsTable } from "./medications-table";
import { SharedProceduresTable } from "./procedures-table";

const navigation = vi.hoisted(() => ({
	pathname: "/shared-records/access-1",
	params: "section=medications&medicationsPage=3&medicationsQuery=aspirin",
	push: vi.fn(),
	replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => navigation,
	usePathname: () => navigation.pathname,
	useSearchParams: () => new URLSearchParams(navigation.params),
}));

type NavigationProps = { page: number; limit: number; searchQuery: string };

const createdAt = { createdAt: "1st Oct 2026", createdAtValue: "2026-10-01T09:00:00.000Z" };
const tableCases = [
	{
		name: "diagnoses",
		prefix: "diagnoses",
		rowText: "Asthma",
		renderTable: (props: NavigationProps) => (
			<SharedDiagnosesTable
				rows={[
					{
						name: "Asthma",
						diagnosedAt: "2026-10-01",
						diagnosedAtValue: "2026-10-01T00:00:00.000Z",
						lastReviewed: "-",
						lastReviewedValue: "",
						diagnosisId: "DIA-1",
						status: "Active",
						...createdAt,
					},
				]}
				totalPages={4}
				statusFilters={[]}
				diagnosedFrom=""
				diagnosedTo=""
				reviewedFrom=""
				reviewedTo=""
				createdFrom=""
				createdTo=""
				{...props}
			/>
		),
	},
	{
		name: "allergies",
		prefix: "allergies",
		rowText: "Penicillin",
		renderTable: (props: NavigationProps) => (
			<SharedAllergiesTable
				rows={[
					{
						allergen: "Penicillin",
						allergyId: "ALG-1",
						reaction: "Rash",
						severity: "Mild",
						status: "Active",
						...createdAt,
					},
				]}
				totalPages={4}
				statusFilters={[]}
				severityFilters={[]}
				createdFrom=""
				createdTo=""
				{...props}
			/>
		),
	},
	{
		name: "immunizations",
		prefix: "immunizations",
		rowText: "Hepatitis B",
		renderTable: (props: NavigationProps) => (
			<SharedImmunizationsTable
				rows={[
					{
						vaccineName: "Hepatitis B",
						dose: "1",
						immunizationId: "IMM-1",
						status: "Completed",
						...createdAt,
					},
				]}
				totalPages={4}
				statusFilters={[]}
				createdFrom=""
				createdTo=""
				{...props}
			/>
		),
	},
	{
		name: "procedures",
		prefix: "procedures",
		rowText: "Appendectomy",
		renderTable: (props: NavigationProps) => (
			<SharedProceduresTable
				rows={[
					{
						procedure: "Appendectomy",
						indication: "Appendicitis",
						facility: "Theatre 1",
						procedureId: "PRO-1",
						status: "Completed",
						...createdAt,
					},
				]}
				totalPages={4}
				statusFilters={[]}
				createdFrom=""
				createdTo=""
				{...props}
			/>
		),
	},
	{
		name: "medications",
		prefix: "medications",
		rowText: "Amoxicillin",
		renderTable: (props: NavigationProps) => (
			<SharedMedicationsTable
				rows={[
					{
						medication: "Amoxicillin",
						dose: "500 mg",
						frequency: "Three times daily",
						duration: "7 days",
						route: "Oral",
						indication: "Infection",
						medicationId: "MED-1",
						status: "Discontinued",
						...createdAt,
					},
				]}
				totalPages={4}
				statusFilters={[]}
				createdFrom=""
				createdTo=""
				{...props}
			/>
		),
	},
	{
		name: "lab tests",
		prefix: "labTests",
		rowText: "Full Blood Count",
		renderTable: (props: NavigationProps) => (
			<SharedLabTestsTable
				rows={[
					{
						test: "Full Blood Count",
						result: "11.2",
						labId: "LAB-1",
						referenceRange: "4.0 - 11.0",
						interpretation: "High",
						status: "Completed",
						...createdAt,
					},
				]}
				totalPages={4}
				statusFilters={[]}
				interpretationFilters={[]}
				createdFrom=""
				createdTo=""
				{...props}
			/>
		),
	},
	{
		name: "imaging",
		prefix: "imaging",
		rowText: "Chest X-ray",
		renderTable: (props: NavigationProps) => (
			<SharedImagingTable
				rows={[
					{
						study: "Chest X-ray",
						modality: "X-ray",
						region: "Chest",
						impression: "Clear",
						orderedAt: "1st Oct 2026",
						orderedAtValue: "2026-10-01T09:00:00.000Z",
						imagingId: "IMG-1",
						status: "Completed",
						...createdAt,
					},
				]}
				totalPages={4}
				statusFilters={[]}
				modalityFilters={[]}
				orderedFrom=""
				orderedTo=""
				createdFrom=""
				createdTo=""
				{...props}
			/>
		),
	},
];

beforeEach(() => {
	navigation.params = "section=medications&medicationsPage=3&medicationsQuery=aspirin";
	navigation.push.mockReset();
	navigation.replace.mockReset();
});
afterEach(() => {
	vi.useRealTimers();
});

describe.each(tableCases)("URL-driven shared $name table", ({ prefix, rowText, renderTable }) => {
	test("keeps the server's rows visible and pushes a namespaced page URL without changing other tables", async () => {
		const user = userEvent.setup();
		const { rerender } = render(renderTable({ page: 2, limit: 28, searchQuery: "" }), {
			wrapper: TableUrlNavigation,
		});
		expect(within(screen.getByRole("table")).getByText(rowText)).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		const [href, options] = navigation.push.mock.calls[0];
		const url = new URL(href, "http://localhost");
		expect(url.pathname).toBe(navigation.pathname);
		expect(url.searchParams.get(`${prefix}Page`)).toBe("3");
		expect(url.searchParams.get(`${prefix}Limit`)).toBe("28");
		expect(url.searchParams.get("section")).toBe("medications");
		if (prefix !== "medications") {
			expect(url.searchParams.get("medicationsPage")).toBe("3");
			expect(url.searchParams.get("medicationsQuery")).toBe("aspirin");
		}
		expect(options).toEqual({ scroll: false });
		expect(within(screen.getByRole("table")).getByText(rowText)).toBeVisible();
		rerender(renderTable({ page: 3, limit: 28, searchQuery: "" }));
		expect(screen.getByText("Page 3 of 4")).toBeVisible();
	});

	test("debounces search into the URL and restores the input when revisiting URL history", async () => {
		vi.useFakeTimers();
		navigation.params += `&${prefix}Page=2`;
		const { rerender } = render(renderTable({ page: 2, limit: 14, searchQuery: "" }), {
			wrapper: TableUrlNavigation,
		});
		const input = screen.getByRole("searchbox");
		fireEvent.change(input, { target: { value: "new search" } });
		expect(input).toHaveValue("new search");
		expect(navigation.replace).not.toHaveBeenCalled();
		await act(async () => {
			vi.advanceTimersByTime(300);
		});
		const [href, options] = navigation.replace.mock.calls[0];
		const params = new URL(href, "http://localhost").searchParams;
		expect(params.get(`${prefix}Query`)).toBe("new search");
		expect(params.get(`${prefix}Page`)).toBeNull();
		expect(options).toEqual({ scroll: false });
		expect(navigation.push).not.toHaveBeenCalled();
		rerender(renderTable({ page: 1, limit: 14, searchQuery: "new search" }));
		rerender(renderTable({ page: 2, limit: 14, searchQuery: "" }));
		expect(input).toHaveValue("");
	});
});
