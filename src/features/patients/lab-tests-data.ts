import { LabTestType } from "./types";

const labTestSeed: LabTestType[] = [
	{
		test: "Hemoglobin — 1.2 g/dL",
		labId: "LAB-101",
		referenceRange: "13-17 g/dL",
		interpretation: "-",
		createdAtLabel: "1st Mar 2026, 2:30 PM",
		createdAtSortValue: "2026-03-01T14:30:00.000Z",
		status: "Pending",
	},
	{
		test: "HIV Antibody — Negative",
		labId: "LAB-101",
		referenceRange: "-",
		interpretation: "Non-reactive",
		createdAtLabel: "1st Mar 2026, 2:30 PM",
		createdAtSortValue: "2026-03-01T14:30:00.000Z",
		status: "Completed",
	},
	{
		test: "Blood Culture — Staphylococcus aureus isolated",
		labId: "LAB-101",
		referenceRange: "-",
		interpretation: "Abnormal",
		createdAtLabel: "1st Mar 2026, 2:30 PM",
		createdAtSortValue: "2026-03-01T14:30:00.000Z",
		status: "Completed",
	},
	{
		test: "Glucose (Fasting) — 7.0 mmol/L",
		labId: "LAB-101",
		referenceRange: "3.9-5.5 mmol/L",
		interpretation: "-",
		createdAtLabel: "1st Mar 2026, 2:30 PM",
		createdAtSortValue: "2026-03-01T14:30:00.000Z",
		status: "Cancelled",
	},
	{
		test: "Glucose (Fasting) — 110 mg/dL",
		labId: "LAB-101",
		referenceRange: "70-99 mg/dL",
		interpretation: "High",
		createdAtLabel: "1st Mar 2026, 2:30 PM",
		createdAtSortValue: "2026-03-01T14:30:00.000Z",
		status: "Completed",
	},
	{
		test: "Lipid Profile — 150 mg/dL",
		labId: "LAB-101",
		referenceRange: "<100 mg/dL",
		interpretation: "-",
		createdAtLabel: "1st Mar 2026, 2:30 PM",
		createdAtSortValue: "2026-03-01T14:30:00.000Z",
		status: "Pending",
	},
	{
		test: "Vitamin D — 30 ng/mL",
		labId: "LAB-101",
		referenceRange: "20-50 ng/mL",
		interpretation: "Within range",
		createdAtLabel: "1st Mar 2026, 2:30 PM",
		createdAtSortValue: "2026-03-01T14:30:00.000Z",
		status: "Completed",
	},
];

export const labTests: LabTestType[] = Array.from({ length: 6 }, (_, pageIndex) =>
	labTestSeed.map((labTest, itemIndex) => ({
		...labTest,
		labId: `LAB-${101 + pageIndex * labTestSeed.length + itemIndex}`,
	})),
).flat();
