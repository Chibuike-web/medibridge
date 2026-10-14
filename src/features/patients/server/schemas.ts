import { z } from "zod";

export const updatePatientPersonalInformationSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required."),
	middleName: z.string().trim().optional(),
	lastName: z.string().trim().min(1, "Last name is required."),
	age: z.preprocess(
		(value) => (value === "" || value === null ? undefined : value),
		z.coerce.number().int().min(0).max(150).optional(),
	),
	dateOfBirth: z.string().trim().optional(),
	sex: z.string().trim().optional(),
	maritalStatus: z.string().trim().optional(),
	nationalId: z.string().trim().optional(),
});

export const updatePatientContactInformationSchema = z.object({
	phoneNumber: z.string().trim().optional(),
	emailAddress: z.preprocess(
		(value) => (value === "" || value === null ? undefined : value),
		z.string().trim().toLowerCase().email("Enter a valid email address.").optional(),
	),
	residentialAddress: z.string().trim().optional(),
	stateOfOrigin: z.string().trim().optional(),
	countryOfOrigin: z.string().trim().optional(),
});

export const updatePatientEmergencyContactSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required."),
	middleName: z.string().trim().optional(),
	lastName: z.string().trim().min(1, "Last name is required."),
	relationship: z.string().trim().optional(),
	phoneNumber: z.string().trim().optional(),
});

export const updatePatientPhysicalInformationSchema = z.object({
	height: z.string().trim().optional(),
	weight: z.string().trim().optional(),
	bloodGroup: z.string().trim().optional(),
	genotype: z.string().trim().optional(),
});

export const encounterTypes = [
	"Outpatient Visit",
	"Follow-up Visit",
	"Routine Checkup",
	"Emergency Visit",
] as const;

export const encounterDepartments = [
	"General Medicine",
	"Family Medicine",
	"Emergency Medicine",
	"Cardiology",
	"Endocrinology",
	"Nephrology",
] as const;

export const createPatientEncounterSchema = z.object({
	encounterType: z.enum(encounterTypes, "Select a visit type."),
	department: z.enum(encounterDepartments, "Select a department."),
	physician: z.string().trim().min(1, "Enter the attending physician."),
	encounterDate: z.coerce
		.date("Enter the date of the visit.")
		.refine(
			(date) => date.getTime() <= Date.now() + 5 * 60 * 1000,
			"The visit can’t be in the future.",
		),
	reason: z.string().trim().optional(),
});
