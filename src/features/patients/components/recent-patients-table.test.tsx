import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { RecentPatientType } from "../types";
import { RecentPatientsTable } from "./recent-patients-table";

test("sorts patient names alphabetically regardless of capitalization", async () => {
	const user = userEvent.setup();
	const patients: RecentPatientType[] = ["Zoe", "amy", "Ben"].map((name) => ({
		name,
		patientId: `PAT-${name}`,
		gender: "Female",
		age: 30,
		createdAt: "2026-09-01",
	}));
	render(<RecentPatientsTable data={patients} />);
	const displayedNames = () =>
		within(screen.getByRole("table"))
			.getAllByText(/^(Zoe|amy|Ben)$/)
			.map((cell) => cell.textContent);
	expect(displayedNames()).toEqual(["amy", "Ben", "Zoe"]);
	await user.click(screen.getByRole("columnheader", { name: "Patient Name" }));
	expect(displayedNames()).toEqual(["Zoe", "Ben", "amy"]);
});

test("moves between recent-patient pages and shows more patients when the page size increases", async () => {
	const user = userEvent.setup();
	const patients: RecentPatientType[] = Array.from({ length: 6 }, (_, index) => ({
		name: `Patient ${index + 1}`,
		patientId: `PAT-${index + 1}`,
		gender: "Female",
		age: 30,
		createdAt: "2026-09-01",
	}));
	render(<RecentPatientsTable data={patients} />);
	const table = screen.getByRole("table");

	for (const patient of patients.slice(0, 4)) {
		expect(within(table).getByText(patient.name)).toBeVisible();
	}
	expect(within(table).queryByText(patients[4].name)).not.toBeInTheDocument();
	expect(screen.getByText("Page 1 of 2")).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Next" }));
	for (const patient of patients.slice(4)) {
		expect(within(table).getByText(patient.name)).toBeVisible();
	}
	expect(within(table).queryByText(patients[0].name)).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

	await user.click(screen.getByRole("combobox"));
	await user.click(await screen.findByRole("option", { name: "8" }));
	for (const patient of patients) {
		expect(within(table).getByText(patient.name)).toBeVisible();
	}
	expect(screen.getByText("Page 1 of 1")).toBeVisible();
});
