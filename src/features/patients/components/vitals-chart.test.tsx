import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { VitalType } from "@/features/patients/types";
import { VitalsChart } from "./vitals-chart";

const baseVital: Omit<VitalType, "vitalId" | "recordedAt" | "createdAt"> = {
	encounterId: "ENC-1",
	encounterType: "Routine Checkup",
	createdBy: "Dr. Okafor",
	systolic: 120,
	diastolic: 80,
	heartRate: 70,
	respiratoryRate: 16,
	temperature: 36.8,
	oxygenSaturation: 98,
	weight: 70,
	bmi: 22.9,
	notes: "",
};

function vital(id: string, daysAgo: number, overrides: Partial<VitalType> = {}): VitalType {
	const recordedAt = subDays(new Date(), daysAgo).getTime();
	return { ...baseVital, vitalId: id, recordedAt, createdAt: recordedAt, ...overrides };
}

const yesterday = vital("V-yesterday", 1, { systolic: 118, diastolic: 79, heartRate: 72 });
const lastWeek = vital("V-last-week", 5, { systolic: 120, diastolic: 80, heartRate: 100 });
const twoMonthsAgo = vital("V-two-months", 60, { systolic: 140, diastolic: 90, heartRate: 55 });

const readings = [twoMonthsAgo, yesterday, lastWeek];

function summary(label: string) {
	const term = screen.getByText(new RegExp(`^${label}:?$`), { selector: "dt" });
	return term.nextElementSibling?.textContent;
}

function chartRegion() {
	return screen.getByRole("img");
}

function plottedPoints() {
	return chartRegion().querySelectorAll(".recharts-scatter-symbol");
}

function xAxisTickLabels() {
	return Array.from(
		chartRegion().querySelectorAll(
			".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value",
		),
	).map((node) => node.textContent?.replace(/\s+/g, ""));
}

async function chooseOption(triggerLabel: string, optionName: string) {
	const user = userEvent.setup();
	await user.click(screen.getByRole("combobox", { name: triggerLabel }));
	await user.click(screen.getByRole("option", { name: optionName }));
}

describe("VitalsChart", () => {
	beforeEach(() => {
		vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
			width: 800,
			height: 320,
			top: 0,
			left: 0,
			right: 800,
			bottom: 320,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("summarises blood pressure over the last 30 days and ignores older readings", () => {
		render(<VitalsChart readings={readings} />);

		expect(screen.getByRole("heading", { name: "Blood pressure" })).toBeInTheDocument();
		expect(screen.getByText("Measured in mmHg")).toBeInTheDocument();
		expect(summary("Current")).toBe("118/79 mmHg");
		expect(summary("Previous")).toBe("120/80 mmHg");
		expect(summary("Average")).toBe("119/79.5 mmHg");
		expect(summary("Lowest")).toBe("118/79 mmHg");
		expect(summary("Highest")).toBe("120/80 mmHg");
		expect(summary("Last measured")).toBe(format(yesterday.recordedAt, "dd MMM yyyy"));
	});

	test("plots systolic and diastolic points with a labelled 30-day axis", () => {
		render(<VitalsChart readings={readings} />);

		expect(chartRegion()).toHaveAccessibleName(/Blood pressure readings/);
		expect(screen.getByText("● Systolic")).toBeInTheDocument();
		expect(screen.getByText("● Diastolic")).toBeInTheDocument();
		expect(plottedPoints()).toHaveLength(4);

		const ticks = xAxisTickLabels();
		expect(ticks).toHaveLength(4);
		expect(ticks[0]).toBe(format(subDays(new Date(), 30), "dMMM"));
		expect(ticks[3]).toBe(format(new Date(), "dMMM"));
	});

	test("switching the metric updates the heading, unit, figures, points and legend", async () => {
		render(<VitalsChart readings={readings} />);

		await chooseOption("Vital measurement", "Heart rate");

		expect(screen.getByRole("heading", { name: "Heart rate" })).toBeInTheDocument();
		expect(screen.getByText("Measured in bpm")).toBeInTheDocument();
		expect(chartRegion()).toHaveAccessibleName(/Heart rate readings/);
		expect(summary("Current")).toBe("72 bpm");
		expect(summary("Previous")).toBe("100 bpm");
		expect(summary("Average")).toBe("86 bpm");
		expect(summary("Lowest")).toBe("72 bpm");
		expect(summary("Highest")).toBe("100 bpm");
		expect(plottedPoints()).toHaveLength(2);
		expect(screen.queryByText("● Systolic")).not.toBeInTheDocument();
		expect(screen.queryByText("● Diastolic")).not.toBeInTheDocument();
	});

	test("choosing All time brings older readings back into the figures and the chart", async () => {
		render(<VitalsChart readings={readings} />);

		await chooseOption("Chart period", "All time");

		expect(summary("Current")).toBe("118/79 mmHg");
		expect(summary("Previous")).toBe("120/80 mmHg");
		expect(summary("Average")).toBe("126/83 mmHg");
		expect(summary("Lowest")).toBe("118/79 mmHg");
		expect(summary("Highest")).toBe("140/90 mmHg");
		expect(plottedPoints()).toHaveLength(6);
		expect(xAxisTickLabels()).toHaveLength(8);
	});

	test("shows an empty state when nothing was recorded in the period", async () => {
		render(<VitalsChart readings={[twoMonthsAgo]} />);

		expect(screen.getByText("No measurements in this period.")).toBeInTheDocument();
		expect(plottedPoints()).toHaveLength(0);
		for (const label of ["Current", "Previous", "Average", "Lowest", "Highest", "Last measured"]) {
			expect(summary(label)).toBe("—");
		}

		await chooseOption("Chart period", "All time");

		expect(screen.queryByText("No measurements in this period.")).not.toBeInTheDocument();
		expect(summary("Current")).toBe("140/90 mmHg");
		expect(summary("Previous")).toBe("—");
		expect(plottedPoints()).toHaveLength(2);
	});

	test("shows the empty state when the patient has no vitals at all", () => {
		render(<VitalsChart readings={[]} />);

		expect(screen.getByText("No measurements in this period.")).toBeInTheDocument();
		expect(within(chartRegion()).queryByText(/mmHg/)).not.toBeInTheDocument();
	});
});
