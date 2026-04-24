import { DiagnosisType } from "./types";

const diagnosisSeed: Omit<DiagnosisType, "diagnosisId">[] = [
	{
		name: "Hypertension",
		onsetLabel: "March 2019",
		onsetSortValue: "2019-03-01",
		lastReviewedLabel: "December 2025",
		lastReviewedSortValue: "2025-12-01",
		clinicalSummary: "Poor control despite dual therapy. Patient intermittently non-adherent",
		status: "Active",
	},
	{
		name: "Type 2 Diabetes Mellitus",
		onsetLabel: "January 2020",
		onsetSortValue: "2020-01-01",
		lastReviewedLabel: "November 2025",
		lastReviewedSortValue: "2025-11-01",
		clinicalSummary: "HbA1c persistently above target. Dietary counseling repeated.",
		status: "Resolved",
	},
	{
		name: "Chronic Kidney Disease",
		onsetLabel: "June 2022",
		onsetSortValue: "2022-06-01",
		lastReviewedLabel: "October 2025",
		lastReviewedSortValue: "2025-10-01",
		clinicalSummary: "Suspected hypertensive nephropathy",
		status: "Active",
	},
	{
		name: "Asthma",
		onsetLabel: "April 2015",
		onsetSortValue: "2015-04-01",
		lastReviewedLabel: "January 2026",
		lastReviewedSortValue: "2026-01-01",
		clinicalSummary: "Frequent exacerbations with poor inhaler adherence",
		status: "Active",
	},
	{
		name: "Iron Deficiency Anemia",
		onsetLabel: "August 2023",
		onsetSortValue: "2023-08-01",
		lastReviewedLabel: "December 2025",
		lastReviewedSortValue: "2025-12-01",
		clinicalSummary: "Resolved following iron supplementation",
		status: "Active",
	},
	{
		name: "Ischemic Heart Disease",
		onsetLabel: "February 2021",
		onsetSortValue: "2021-02-01",
		lastReviewedLabel: "November 2025",
		lastReviewedSortValue: "2025-11-01",
		clinicalSummary: "Stable symptoms on medical therapy, no recent chest pain episodes",
		status: "Active",
	},
];

export const diagnoses: DiagnosisType[] = Array.from({ length: 7 }, (_, pageIndex) =>
	diagnosisSeed.map((diagnosis, itemIndex) => ({
		...diagnosis,
		diagnosisId: `DIA-${101 + pageIndex * diagnosisSeed.length + itemIndex}`,
	})),
).flat();
