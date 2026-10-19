import { z } from "zod";
import {
	updatePatientContactInformationSchema,
	updatePatientEmergencyContactSchema,
	updatePatientPersonalInformationSchema,
	updatePatientPhysicalInformationSchema,
} from "@/features/patients/server/schemas";

export const manualPatientSchema = z.object({
	personalInformation: updatePatientPersonalInformationSchema.extend({
		dateOfBirth: z.iso.date("Date of birth is required."),
	}),
	contactInformation: updatePatientContactInformationSchema,
	emergencyContact: updatePatientEmergencyContactSchema,
	physicalInformation: updatePatientPhysicalInformationSchema,
});

export type ManualPatientType = z.infer<typeof manualPatientSchema>;
