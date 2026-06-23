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
		z.string().trim().email("Enter a valid email address.").optional(),
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
