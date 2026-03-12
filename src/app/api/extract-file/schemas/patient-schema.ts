import { z } from "zod";

export const PatientRecordSchema = z.object({
	personalInfo: z.object({
		firstName: z.string().nullable(),
		middleName: z.string().nullable(),
		lastName: z.string().nullable(),
		patientId: z.string().nullable(),
		dateOfBirth: z.string().nullable(),
		sex: z.string().nullable(),
		age: z.number().nullable(),
		maritalStatus: z.string().nullable(),
		nationalId: z.string().nullable(),
	}),
	contactInfo: z.object({
		phoneNumber: z.string().nullable(),
		emailAddress: z.string().nullable(),
		residentialAddress: z.string().nullable(),
		stateOfOrigin: z.string().nullable(),
		countryOfOrigin: z.string().nullable(),
	}),
	emergencyInfo: z.object({
		firstName: z.string().nullable(),
		middleName: z.string().nullable(),
		lastName: z.string().nullable(),
		relationship: z.string().nullable(),
		phone: z.string().nullable(),
	}),
	physicalInfo: z.object({
		height: z.string().nullable(),
		weight: z.string().nullable(),
		bloodGroup: z.string().nullable(),
		genotype: z.string().nullable(),
	}),
});

export const PatientSchema = z.array(PatientRecordSchema);

export type PatientRecord = z.infer<typeof PatientRecordSchema>;
export type PatientType = z.infer<typeof PatientSchema>;
