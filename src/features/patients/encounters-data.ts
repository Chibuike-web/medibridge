import { EncounterType } from "./types";

const encounterSeed: EncounterType[] = [
	{
		encounterDateLabel: "1st Mar 2026, 2:30 PM",
		encounterDateSortValue: "2026-03-01T14:30:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Emergency Visit",
		encounterId: "ENC-10231",
		department: "Emergency Medicine",
		physician: "Dr. S. Okonkwo",
	},
	{
		encounterDateLabel: "28th Feb 2026, 10:15 PM",
		encounterDateSortValue: "2026-02-28T22:15:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Routine Checkup",
		encounterId: "ENC-10228",
		department: "General Medicine",
		physician: "Dr. A. Bello",
	},
	{
		encounterDateLabel: "25th Feb 2026, 4:45 PM",
		encounterDateSortValue: "2026-02-25T16:45:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Follow-up Visit",
		encounterId: "ENC-10222",
		department: "Cardiology",
		physician: "Dr. T. Adeyemi",
	},
	{
		encounterDateLabel: "20th Feb 2026, 1:20 PM",
		encounterDateSortValue: "2026-02-20T13:20:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Outpatient Visit",
		encounterId: "ENC-10210",
		department: "Endocrinology",
		physician: "Dr. R. Hassan",
	},
	{
		encounterDateLabel: "18th Feb 2026, 11:30 AM",
		encounterDateSortValue: "2026-02-18T11:30:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Emergency Visit",
		encounterId: "ENC-10205",
		department: "Emergency Medicine",
		physician: "Dr. S. Okonkwo",
	},
	{
		encounterDateLabel: "15th Feb 2026, 11:30 AM",
		encounterDateSortValue: "2026-02-15T11:30:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Emergency Visit",
		encounterId: "ENC-10198",
		department: "Family Medicine",
		physician: "Dr. E. Nwosu",
	},
	{
		encounterDateLabel: "10th Feb 2026, 3:10 PM",
		encounterDateSortValue: "2026-02-10T15:10:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Follow-up Visit",
		encounterId: "ENC-10185",
		department: "Nephrology",
		physician: "Dr. M. Ibrahim",
	},
	{
		encounterDateLabel: "5th Feb 2026, 8:50 AM",
		encounterDateSortValue: "2026-02-05T08:50:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Emergency Visit",
		encounterId: "ENC-10170",
		department: "General Medicine",
		physician: "Dr. A. Bello",
	},
	{
		encounterDateLabel: "2nd Feb 2026, 6:40 PM",
		encounterDateSortValue: "2026-02-02T18:40:00",
		createdAtLabel: "17th Apr 2024, 12:30 PM",
		createdAtSortValue: "2024-04-17T12:30:00",
		encounterType: "Emergency Visit",
		encounterId: "ENC-10160",
		department: "Emergency Medicine",
		physician: "Dr. S. Okonkwo",
	},
];

export const encounters: EncounterType[] = Array.from({ length: 5 }, (_, pageIndex) =>
	encounterSeed.map((encounter, encounterIndex) => ({
		...encounter,
		encounterId:
			pageIndex === 0
				? encounter.encounterId
				: `ENC-${10160 - pageIndex * encounterSeed.length - encounterIndex}`,
	})),
).flat();
