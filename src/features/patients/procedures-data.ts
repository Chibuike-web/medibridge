import { ProcedureType } from "./types";

const procedureSeed: ProcedureType[] = [
	{
		procedure: "Appendectomy",
		procedureId: "PRO-101",
		createdAtLabel: "12 July 2024",
		createdAtSortValue: "2024-07-12",
		indication: "Acute appendicitis",
		facility: "Lagos University Teaching Hospital",
		status: "Pending",
	},
	{
		procedure: "Cesarean Section",
		procedureId: "PRO-102",
		createdAtLabel: "14 Aug 2021",
		createdAtSortValue: "2021-08-14",
		indication: "Prolonged labor with fetal distress",
		facility: "University College Hospital, Ibadan",
		status: "Completed",
	},
	{
		procedure: "Coronary Angioplasty",
		procedureId: "PRO-103",
		createdAtLabel: "22 Nov 2023",
		createdAtSortValue: "2023-11-22",
		indication: "Coronary artery stenosis",
		facility: "University College Hospital, Ibadan",
		status: "Cancelled",
	},
	{
		procedure: "Knee Arthroscopy",
		procedureId: "PRO-104",
		createdAtLabel: "03 Feb 2024",
		createdAtSortValue: "2024-02-03",
		indication: "Meniscal tear",
		facility: "National Orthopaedic Hospital, Igbobi",
		status: "Completed",
	},
	{
		procedure: "Upper GI Endoscopy",
		procedureId: "PRO-105",
		createdAtLabel: "19 Mar 2024",
		createdAtSortValue: "2024-03-19",
		indication: "Persistent epigastric pain",
		facility: "Reddington Hospital",
		status: "Pending",
	},
	{
		procedure: "Wound Debridement",
		procedureId: "PRO-106",
		createdAtLabel: "27 May 2024",
		createdAtSortValue: "2024-05-27",
		indication: "Infected diabetic foot ulcer",
		facility: "Federal Medical Centre, Abeokuta",
		status: "Completed",
	},
];

export const procedures: ProcedureType[] = Array.from({ length: 7 }, (_, pageIndex) =>
	procedureSeed.map((procedure, itemIndex) => ({
		...procedure,
		procedureId: `PRO-${101 + pageIndex * procedureSeed.length + itemIndex}`,
	})),
).flat();
