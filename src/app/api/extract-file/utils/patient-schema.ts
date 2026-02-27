import { z } from "zod";

export const PatientSchema = z.object({
	personalInformation: z
		.object({
			firstName: z.string().optional().describe("Patient first name"),

			middleName: z.string().optional().describe("Patient middle name"),

			lastName: z.string().optional().describe("Patient last name"),

			dateOfBirth: z.string().optional().describe("Date of birth in ISO or document format"),

			age: z.number().optional().describe("Patient age if explicitly stated"),

			sex: z.string().optional().describe("Biological sex or gender stated in document"),

			phoneNumber: z.string().optional().describe("Primary patient phone number"),

			emailAddress: z.string().optional().describe("Patient email address"),

			residentialAddress: z.string().optional().describe("Full residential address"),

			stateOfOrigin: z
				.string()
				.optional()
				.describe("State of origin or ethnicity state if present"),

			countryOfOrigin: z.string().optional().describe("Country of origin"),

			nationalId: z.string().optional().describe("Government issued identification number"),

			bloodGroup: z.string().optional().describe("ABO blood group"),

			genotype: z.string().optional().describe("Hemoglobin genotype if stated"),

			emergencyContact: z
				.object({
					firstName: z.string().optional().describe("Emergency contact first name"),

					middleName: z.string().optional().describe("Emergency contact middle name"),

					lastName: z.string().optional().describe("Emergency contact last name"),

					relationship: z.string().optional().describe("Relationship to patient"),

					phonePrimary: z.string().optional().describe("Primary emergency contact phone"),
				})
				.optional()
				.describe("Emergency contact details"),
		})
		.describe("Patient demographic and identity information"),

	medicalInformation: z
		.object({
			height: z.string().optional().describe("Patient height with unit if present"),

			weight: z.string().optional().describe("Patient weight with unit if present"),

			bmi: z.string().optional().describe("Body mass index if documented"),

			bloodPressure: z.string().optional().describe("Blood pressure reading"),

			currentMedications: z
				.array(
					z.object({
						drugName: z.string().optional().describe("Medication name"),

						dosage: z
							.string()
							.optional()
							.describe("Dose strength or quantity such as 500 mg or 1 tablet"),

						frequency: z
							.string()
							.optional()
							.describe("How often the medication is taken such as twice daily or nightly"),

						route: z
							.string()
							.optional()
							.describe("Administration route if stated such as oral, inhaled, IV"),
					}),
				)
				.optional()
				.describe("Active medications with dosage, frequency, and administration details"),

			primaryCarePhysicians: z
				.array(
					z.object({
						name: z.string().optional().describe("Doctor or specialist full name"),

						department: z
							.string()
							.optional()
							.describe("Clinical department or specialty managing the patient"),
					}),
				)
				.optional()
				.describe(
					"Doctors or specialists currently managing care with their department or specialty",
				),

			knownAllergies: z
				.array(
					z.object({
						substance: z
							.string()
							.optional()
							.describe("Allergen substance such as drug, food, or material"),

						reaction: z
							.string()
							.optional()
							.describe("Observed reaction such as rash, swelling, anaphylaxis"),

						severity: z
							.string()
							.optional()
							.describe("Severity if stated such as mild, moderate, severe"),
					}),
				)
				.optional()
				.describe(
					"Documented allergies including substance, reaction, and severity when available",
				),
			chronicConditions: z
				.array(z.string())
				.optional()
				.describe("Active chronic medical conditions"),

			lastMedicalReview: z
				.string()
				.optional()
				.describe("Most recent clinical review date if available"),
		})
		.describe("Current clinical overview excluding historical records"),
});
