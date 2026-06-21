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
