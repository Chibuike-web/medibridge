import { z } from "zod";

export const clinicalRecordTypeSchema = z.enum([
	"diagnoses",
	"allergies",
	"immunizations",
	"procedures",
	"medications",
	"lab-tests",
	"imaging",
]);

const selectedClinicalRecordSchema = z.object({
	id: z.string().trim().min(1),
	type: clinicalRecordTypeSchema,
});

export const createTransferRequestsSchema = z
	.array(
		z.object({
			patientId: z.string().trim().min(1),
			targetHospitalName: z.string().trim().min(2).max(200),
			targetHospitalEmail: z.email(),
			notes: z.string().trim().max(2000).optional(),
			records: z.array(selectedClinicalRecordSchema).min(1),
		}),
	)
	.min(1)
	.max(20);

export type CreateTransferRequestsInput = z.infer<
	typeof createTransferRequestsSchema
>;
