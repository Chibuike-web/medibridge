import { DiagnosisType } from "./types";

const diagnosisSeed: Omit<DiagnosisType, "diagnosisId">[] = [
	{
		name: "Hypertension",
		onsetLabel: "March 2019",
		onsetSortValue: "2019-03-01",
		lastReviewedLabel: "December 2025",
		lastReviewedSortValue: "2025-12-01",
		createdAtLabel: "17th Apr 2025, 12:30PM",
		createdAtSortValue: "2025-04-17T12:30:00",
		status: "Active",
	},
	{
		name: "Type 2 Diabetes Mellitus",
		onsetLabel: "January 2020",
		onsetSortValue: "2020-01-01",
		lastReviewedLabel: "November 2025",
		lastReviewedSortValue: "2025-11-01",
		createdAtLabel: "18th Apr 2025, 9:15AM",
		createdAtSortValue: "2025-04-18T09:15:00",
		status: "Resolved",
	},
	{
		name: "Chronic Kidney Disease",
		onsetLabel: "June 2022",
		onsetSortValue: "2022-06-01",
		lastReviewedLabel: "October 2025",
		lastReviewedSortValue: "2025-10-01",
		createdAtLabel: "18th Apr 2025, 10:40AM",
		createdAtSortValue: "2025-04-18T10:40:00",
		status: "Active",
	},
	{
		name: "Asthma",
		onsetLabel: "April 2015",
		onsetSortValue: "2015-04-01",
		lastReviewedLabel: "January 2026",
		lastReviewedSortValue: "2026-01-01",
		createdAtLabel: "19th Apr 2025, 8:25AM",
		createdAtSortValue: "2025-04-19T08:25:00",
		status: "Active",
	},
	{
		name: "Iron Deficiency Anemia",
		onsetLabel: "August 2023",
		onsetSortValue: "2023-08-01",
		lastReviewedLabel: "December 2025",
		lastReviewedSortValue: "2025-12-01",
		createdAtLabel: "19th Apr 2025, 11:05AM",
		createdAtSortValue: "2025-04-19T11:05:00",
		status: "Active",
	},
	{
		name: "Ischemic Heart Disease",
		onsetLabel: "February 2021",
		onsetSortValue: "2021-02-01",
		lastReviewedLabel: "November 2025",
		lastReviewedSortValue: "2025-11-01",
		createdAtLabel: "20th Apr 2025, 1:30PM",
		createdAtSortValue: "2025-04-20T13:30:00",
		status: "Active",
	},
];

export const diagnoses: DiagnosisType[] = Array.from({ length: 7 }, (_, pageIndex) =>
	diagnosisSeed.map((diagnosis, itemIndex) => ({
		...diagnosis,
		diagnosisId: `DIA-${101 + pageIndex * diagnosisSeed.length + itemIndex}`,
	})),
).flat();
